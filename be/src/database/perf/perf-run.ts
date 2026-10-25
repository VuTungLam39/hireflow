import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import { join } from 'node:path';
import type { DataSource } from 'typeorm';
import { QueryCounter, type CapturedQuery } from './query-counter.js';

// Kickoff 14, Backend Architecture 8.2
const LABEL = process.argv[2] ?? 'run';
const DATABASE = process.env.PERF_DATABASE ?? 'ncc_intern_perf';
const REQUESTS = Number(process.env.PERF_REQUESTS ?? 200);
const CONCURRENCY = Number(process.env.PERF_CONCURRENCY ?? 10);
const WARMUP = 10;
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';

if (!DATABASE.endsWith('_perf')) throw new Error(`Refusing to benchmark "${DATABASE}"`);
process.env.DB_DATABASE = DATABASE;
process.env.DB_LOGGING = 'false';
process.env.THROTTLE_LIMIT = '100000000';
process.env.LLM_PROVIDERS = 'fake';
process.env.EMBEDDING_PROVIDER = 'fake';

interface Stats {
  p50: number;
  p95: number;
  max: number;
}

interface HttpResult extends Stats {
  name: string;
  path: string;
  who: string;
  queries: number;
  queriesLarge?: number;
  plan?: PlanSummary;
}

interface PlanSummary {
  executionMs: number;
  scans: string[];
  sql: string;
  text: string;
}

interface SimResult {
  name: string;
  variant: string;
  queries: number;
  p50: number;
  p95: number;
}

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];

const stats = (samples: number[]): Stats => {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    p50: +percentile(sorted, 50).toFixed(1),
    p95: +percentile(sorted, 95).toFixed(1),
    max: +sorted.at(-1)!.toFixed(1),
  };
};

const timed = async (work: () => Promise<unknown>) => {
  const start = performance.now();
  await work();
  return performance.now() - start;
};

async function runConcurrent(total: number, concurrency: number, work: () => Promise<unknown>) {
  const samples: number[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < total) {
        next++;
        samples.push(await timed(work));
      }
    }),
  );
  return samples;
}

async function explain(ds: DataSource, query: CapturedQuery): Promise<PlanSummary> {
  const rows: { 'QUERY PLAN': string }[] = await ds.query(
    `EXPLAIN (ANALYZE, BUFFERS) ${query.sql}`,
    query.params,
  );
  const text = rows.map((r) => r['QUERY PLAN']).join('\n');
  const scans = [
    ...new Set(
      [
        ...text.matchAll(
          /(Seq Scan|Index Only Scan|Index Scan|Bitmap Index Scan|Bitmap Heap Scan)(?: using "?(\w+)"?)? on (\w+)/g,
        ),
      ].map((m) => `${m[1]} ${m[3]}${m[2] ? ` (${m[2]})` : ''}`),
    ),
  ];
  const executionMs = Number(/Execution Time: ([\d.]+) ms/.exec(text)?.[1] ?? 0);
  return { executionMs, scans, sql: query.sql, text };
}

async function slowestPlan(ds: DataSource, queries: CapturedQuery[]) {
  let slowest: PlanSummary | undefined;
  for (const query of queries.filter((q) => /^\s*SELECT/i.test(q.sql))) {
    const plan = await explain(ds, query);
    if (!slowest || plan.executionMs > slowest.executionMs) slowest = plan;
  }
  return slowest;
}

async function main() {
  const { AppModule } = await import('../../app.module.js');
  const { setupApp } = await import('../../setup-app.js');
  const { DataSource } = await import('typeorm');

  const app: INestApplication = await NestFactory.create(AppModule, { logger: ['error'] });
  setupApp(app);
  await app.listen(0);
  const port = (app.getHttpServer().address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}/api/v1`;
  const ds = app.get(DataSource);
  const counter = new QueryCounter(ds);

  const login = async (email: string) => {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    if (!res.ok) throw new Error(`Login ${email} failed: ${res.status}`);
    return ((await res.json()) as { data: { tokens: { accessToken: string } } }).data.tokens
      .accessToken;
  };
  const [manager] = await ds.query(
    `SELECT u.email FROM users u WHERE u.role = 'hiring_manager' ORDER BY u.email LIMIT 1`,
  );
  const tokens = { admin: await login('admin@perf.local'), hm: await login(manager.email) };

  const [busiest] = await ds.query(
    `SELECT job_id AS id FROM applications GROUP BY job_id ORDER BY COUNT(*) DESC LIMIT 1`,
  );
  const [sample] = await ds.query(
    `SELECT a.id, c.full_name AS name FROM applications a JOIN candidates c ON c.id = a.candidate_id ORDER BY a.id LIMIT 1`,
  );
  const searchTerm = String(sample.name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .split(' ')
    .slice(-2)
    .join(' ');

  const get = async (who: keyof typeof tokens, path: string) => {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${tokens[who]}` },
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
    await res.arrayBuffer();
  };

  const scenarios: { name: string; who: keyof typeof tokens; path: string; large?: string }[] = [
    {
      name: 'Bảng hồ sơ – mặc định (mới nhất)',
      who: 'admin',
      path: '/applications?page=1&limit=20',
      large: '/applications?page=1&limit=100',
    },
    {
      name: 'Bảng hồ sơ – sắp theo điểm',
      who: 'admin',
      path: '/applications?page=1&limit=20&sortBy=score&order=DESC',
    },
    {
      name: 'Bảng hồ sơ – lọc job + trạng thái, sắp theo điểm',
      who: 'admin',
      path: `/applications?page=1&limit=20&jobId=${busiest.id}&status=SCREENING&sortBy=score&order=DESC`,
    },
    {
      name: 'Bảng hồ sơ – lọc cờ thiếu MUST',
      who: 'admin',
      path: '/applications?page=1&limit=20&missingMust=true',
    },
    {
      name: 'Bảng hồ sơ – tìm tên không dấu',
      who: 'admin',
      path: `/applications?page=1&limit=20&search=${encodeURIComponent(searchTerm)}`,
    },
    {
      name: 'Bảng hồ sơ – trang sâu (OFFSET 150.000)',
      who: 'admin',
      path: '/applications?page=7501&limit=20',
    },
    {
      name: 'Bảng hồ sơ – Hiring Manager (scope phòng)',
      who: 'hm',
      path: '/applications?page=1&limit=20',
      large: '/applications?page=1&limit=100',
    },
    {
      name: 'Danh sách job kèm pipeline',
      who: 'admin',
      path: '/jobs?page=1&limit=20',
      large: '/jobs?page=1&limit=100',
    },
    { name: 'Xếp hạng job đông hồ sơ nhất', who: 'admin', path: `/jobs/${busiest.id}/ranking` },
    { name: 'Chi tiết hồ sơ', who: 'admin', path: `/applications/${sample.id}` },
    {
      name: 'Kho ứng viên – trang đầu',
      who: 'admin',
      path: '/candidates?limit=20',
      large: '/candidates?limit=100',
    },
    {
      name: 'Kho ứng viên – tìm không dấu',
      who: 'admin',
      path: `/candidates?limit=20&search=${encodeURIComponent(searchTerm)}`,
    },
    { name: 'Kho ứng viên – Hiring Manager', who: 'hm', path: '/candidates?limit=20' },
    { name: 'Dashboard – Admin', who: 'admin', path: '/dashboard/summary' },
    { name: 'Dashboard – Hiring Manager', who: 'hm', path: '/dashboard/summary' },
  ];

  const http: HttpResult[] = [];
  for (const s of scenarios) {
    const counted = await counter.count(() => get(s.who, s.path));
    const queriesLarge = s.large
      ? (await counter.count(() => get(s.who, s.large!))).queries.length
      : undefined;
    for (let i = 0; i < WARMUP; i++) await get(s.who, s.path);
    const samples = await runConcurrent(REQUESTS, CONCURRENCY, () => get(s.who, s.path));
    http.push({
      name: s.name,
      path: s.path,
      who: s.who,
      queries: counted.queries.length,
      queriesLarge,
      ...stats(samples),
      plan: await slowestPlan(ds, counted.queries),
    });
    console.log(`  ${s.name}: p95 ${http.at(-1)!.p95}ms, ${counted.queries.length} query`);
  }

  const sims = await simulations(ds);
  await app.close();
  await report(http, sims, searchTerm);
}

// Kickoff 14: so sánh cách làm lỗi và cách đã sửa trên cùng dữ liệu
async function simulations(ds: DataSource): Promise<SimResult[]> {
  const RUNS = 30;
  const measure = async (name: string, variant: string, work: () => Promise<number>) => {
    for (let i = 0; i < 3; i++) await work();
    const samples: number[] = [];
    let queries = 0;
    for (let i = 0; i < RUNS; i++) {
      const start = performance.now();
      queries = await work();
      samples.push(performance.now() - start);
    }
    const { p50, p95 } = stats(samples);
    return { name, variant, queries, p50, p95 };
  };
  const results: SimResult[] = [];

  results.push(
    await measure('List hồ sơ 20 dòng', 'N+1: lấy ứng viên, job từng dòng', async () => {
      const apps: { candidate_id: string; job_id: string }[] = await ds.query(
        `SELECT id, candidate_id, job_id, status, score FROM applications WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 20`,
      );
      for (const a of apps) {
        await ds.query(`SELECT id, full_name, email FROM candidates WHERE id = $1`, [
          a.candidate_id,
        ]);
        await ds.query(`SELECT id, title FROM jobs WHERE id = $1`, [a.job_id]);
      }
      return 1 + apps.length * 2;
    }),
    await measure('List hồ sơ 20 dòng', 'JOIN, chỉ chọn cột cần', async () => {
      await ds.query(
        `SELECT a.id, a.status, a.score, c.id, c.full_name, c.email, j.id, j.title FROM applications a JOIN candidates c ON c.id = a.candidate_id JOIN jobs j ON j.id = a.job_id WHERE a.deleted_at IS NULL ORDER BY a.created_at DESC, a.id DESC LIMIT 20`,
      );
      return 1;
    }),
  );

  const jobIds: string[] = (
    await ds.query(`SELECT id FROM jobs WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 20`)
  ).map((r: { id: string }) => r.id);
  const groups: [string, string[]][] = [
    ['new', ['NEW']],
    ['inProgress', ['SCREENING', 'INTERVIEW', 'OFFER']],
    ['hired', ['HIRED']],
    ['closed', ['REJECTED', 'WITHDRAWN']],
  ];
  results.push(
    await measure('Job kèm pipeline 20 job', 'Đếm từng job, từng nhóm', async () => {
      for (const id of jobIds) {
        for (const [, statuses] of groups) {
          await ds.query(
            `SELECT COUNT(*) FROM applications WHERE job_id = $1 AND status = ANY($2::application_status_enum[]) AND deleted_at IS NULL`,
            [id, statuses],
          );
        }
      }
      return jobIds.length * groups.length;
    }),
    await measure('Job kèm pipeline 20 job', 'Một câu GROUP BY + COUNT FILTER', async () => {
      await ds.query(
        `SELECT job_id, ${groups
          .map(
            ([key, statuses]) =>
              `COUNT(*) FILTER (WHERE status IN (${statuses.map((s) => `'${s}'`).join(', ')}))::int AS "${key}"`,
          )
          .join(
            ', ',
          )} FROM applications WHERE job_id = ANY($1::uuid[]) AND deleted_at IS NULL GROUP BY job_id`,
        [jobIds],
      );
      return 1;
    }),
  );

  const statuses = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'];
  results.push(
    await measure('Dashboard', 'Nhiều query rời (tổng, từng trạng thái, từng job)', async () => {
      let n = 0;
      await ds.query(`SELECT COUNT(*), AVG(score) FROM applications WHERE deleted_at IS NULL`);
      await ds.query(`SELECT COUNT(*) FROM jobs WHERE status = 'OPEN' AND deleted_at IS NULL`);
      n += 2;
      for (const s of statuses) {
        await ds.query(
          `SELECT COUNT(*) FROM applications WHERE status = $1 AND deleted_at IS NULL`,
          [s],
        );
        n++;
      }
      const jobs: { id: string }[] = await ds.query(`SELECT id FROM jobs WHERE deleted_at IS NULL`);
      for (const j of jobs) {
        await ds.query(
          `SELECT COUNT(*), AVG(score), COUNT(*) FILTER (WHERE status = 'HIRED') FROM applications WHERE job_id = $1 AND deleted_at IS NULL`,
          [j.id],
        );
      }
      return n + 1 + jobs.length;
    }),
    await measure('Dashboard', 'Một query tổng hợp theo job', async () => {
      await ds.query(
        `SELECT j.id, j.title, j.status, COUNT(a.id), COUNT(a.score), SUM(a.score), ${statuses
          .map((s) => `COUNT(a.id) FILTER (WHERE a.status = '${s}')`)
          .join(
            ', ',
          )} FROM jobs j LEFT JOIN applications a ON a.job_id = j.id AND a.deleted_at IS NULL WHERE j.deleted_at IS NULL GROUP BY j.id`,
      );
      return 1;
    }),
  );

  const [deep] = await ds.query(
    `SELECT created_at, id FROM applications WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC OFFSET 149999 LIMIT 1`,
  );
  results.push(
    await measure('Trang thứ 7.501 (20 dòng)', 'OFFSET 150.000', async () => {
      await ds.query(
        `SELECT id, created_at FROM applications WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC OFFSET 150000 LIMIT 20`,
      );
      return 1;
    }),
    await measure('Trang thứ 7.501 (20 dòng)', 'Cursor (created_at, id)', async () => {
      await ds.query(
        `SELECT id, created_at FROM applications WHERE deleted_at IS NULL AND (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`,
        [deep.created_at, deep.id],
      );
      return 1;
    }),
  );
  return results;
}

async function report(http: HttpResult[], sims: SimResult[], searchTerm: string) {
  const dir = join(process.cwd(), 'docs', 'perf');
  await mkdir(dir, { recursive: true });
  const machine = `${cpus()[0].model.trim()} · ${cpus().length} luồng · RAM ${Math.round(totalmem() / 1024 ** 3)} GB · Node ${process.version}`;
  const lines = [
    `# Kết quả đo: ${LABEL}`,
    '',
    `- Thời điểm: ${new Date().toISOString()}`,
    `- Máy: ${machine}`,
    `- DB: ${DATABASE}; ${REQUESTS} request mỗi kịch bản, ${CONCURRENCY} request đồng thời, ${WARMUP} request làm nóng`,
    `- Từ khoá tìm: "${searchTerm}"`,
    '',
    '## Endpoint',
    '',
    '| Kịch bản | Query/request | p50 (ms) | p95 (ms) | max (ms) | Query chậm nhất (EXPLAIN ANALYZE) |',
    '|---|---|---|---|---|---|',
    ...http.map(
      (r) =>
        `| ${r.name} | ${r.queries}${r.queriesLarge !== undefined ? ` (limit 100: ${r.queriesLarge})` : ''} | ${r.p50} | ${r.p95} | ${r.max} | ${r.plan ? `${r.plan.executionMs} ms · ${r.plan.scans.join(', ')}` : '–'} |`,
    ),
    '',
    '## Mô phỏng trước/sau (chạy thẳng trên DB, 30 lần)',
    '',
    '| Bài toán | Cách làm | Số query | p50 (ms) | p95 (ms) |',
    '|---|---|---|---|---|',
    ...sims.map((s) => `| ${s.name} | ${s.variant} | ${s.queries} | ${s.p50} | ${s.p95} |`),
    '',
    '## Kế hoạch thực thi',
    '',
    ...http.flatMap((r) =>
      r.plan
        ? [`### ${r.name}`, '', '```sql', r.plan.sql, '```', '', '```', r.plan.text, '```', '']
        : [],
    ),
  ];
  await writeFile(join(dir, `${LABEL}.md`), lines.join('\n'));
  await writeFile(join(dir, `${LABEL}.json`), JSON.stringify({ http, sims }, null, 2));
  console.log(`\nĐã ghi docs/perf/${LABEL}.md`);
}

main().catch((error) => {
  console.error('Perf run failed:', error);
  process.exit(1);
});

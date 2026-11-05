import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { buildAiConfig } from '../../../config/ai.config.js';
import { Role } from '../../../common/enums/role.enum.js';
import dataSource from '../../../database/data-source.js';
import { buildEmbeddingProvider } from '../../ai/ai.factory.js';
import { searchKeywords } from '../keywords.js';
import { CHAT_TOP_K, retrieveChunks, type RetrievalMode } from '../retrieval.js';
import { RETRIEVAL_CASES, type RetrievalCase } from './retrieval-dataset.js';

// F-SEARCH-01 · Mở rộng MVP 2 – E1: npm run rag:eval (cần DB đã seed demo và embedding thật)

const MODES: RetrievalMode[] = ['vector', 'keyword', 'hybrid'];
const TIMING_RUNS = 5;
const ADMIN = { role: Role.Admin, departmentId: null };

interface CaseResult {
  id: string;
  kind: RetrievalCase['kind'];
  question: string;
  keywords: string;
  expected: string[];
  modes: Record<RetrievalMode, { found: string[]; recall: number; firstRank: number | null }>;
}

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const pct = (n: number) => `${round(n * 100)}%`;

async function expectedCandidates(ds: DataSource, terms: string[], model: string) {
  const rows = await ds.query<{ name: string }[]>(
    `SELECT DISTINCT c.full_name AS name
     FROM cv_chunks ch
     JOIN cv_files cf ON cf.id = ch.cv_file_id AND cf.deleted_at IS NULL
     JOIN candidates c ON c.id = cf.candidate_id AND c.deleted_at IS NULL AND c.anonymized_at IS NULL
     WHERE ch.embedding_model = $1
       AND EXISTS (SELECT 1 FROM applications a WHERE a.cv_file_id = cf.id AND a.deleted_at IS NULL)
       AND f_unaccent(lower(ch.content)) LIKE ANY ($2)`,
    [model, terms.map((t) => `%${t}%`)],
  );
  return rows.map((r) => r.name).sort();
}

async function main() {
  const config = buildAiConfig();
  const embedding = buildEmbeddingProvider(config);
  const model = `${embedding.name}/${embedding.model}`.slice(0, 100);
  await dataSource.initialize();
  console.log(`Embedding ${model} · top ${CHAT_TOP_K} · ${RETRIEVAL_CASES.length} câu hỏi`);

  const results: CaseResult[] = [];
  const timings: Record<RetrievalMode, number[]> = { vector: [], keyword: [], hybrid: [] };
  const embedMs: number[] = [];

  for (const c of RETRIEVAL_CASES) {
    const expected = await expectedCandidates(dataSource, c.terms, model);
    if (!expected.length) throw new Error(`${c.id}: không ứng viên nào khớp ${c.terms.join(', ')}`);
    const started = performance.now();
    const [vector] = await embedding.embed([c.question], 'query');
    embedMs.push(performance.now() - started);
    const keywords = searchKeywords(c.question);

    const modes = {} as CaseResult['modes'];
    for (const mode of MODES) {
      const input = { vector, keywords, embeddingModel: model, user: ADMIN, mode };
      const rows = await retrieveChunks(dataSource, input);
      for (let i = 0; i < TIMING_RUNS; i++) {
        const t = performance.now();
        await retrieveChunks(dataSource, input);
        timings[mode].push(performance.now() - t);
      }
      const ranked = [...new Set(rows.map((r) => r.candidateName))];
      const found = expected.filter((name) => ranked.includes(name));
      const first = ranked.findIndex((name) => expected.includes(name));
      modes[mode] = {
        found,
        recall: found.length / expected.length,
        firstRank: first < 0 ? null : first + 1,
      };
    }
    results.push({ id: c.id, kind: c.kind, question: c.question, keywords, expected, modes });
    console.log(
      `  ${c.id} ${MODES.map((m) => `${m} ${modes[m].found.length}/${expected.length}`).join(' · ')}`,
    );
  }

  const summary = (kind?: RetrievalCase['kind']) => {
    const rows = results.filter((r) => !kind || r.kind === kind);
    return Object.fromEntries(
      MODES.map((m) => [
        m,
        {
          recall: rows.reduce((s, r) => s + r.modes[m].recall, 0) / rows.length,
          mrr:
            rows.reduce((s, r) => s + (r.modes[m].firstRank ? 1 / r.modes[m].firstRank! : 0), 0) /
            rows.length,
          missed: rows.filter((r) => r.modes[m].recall === 0).map((r) => r.id),
        },
      ]),
    ) as Record<RetrievalMode, { recall: number; mrr: number; missed: string[] }>;
  };
  const report = {
    startedAt: new Date().toISOString(),
    embeddingModel: model,
    topK: CHAT_TOP_K,
    summary: { all: summary(), keyword: summary('keyword'), meaning: summary('meaning') },
    latencyMs: Object.fromEntries(
      MODES.map((m) => [
        m,
        { p50: round(percentile(timings[m], 50)), p95: round(percentile(timings[m], 95)) },
      ]),
    ),
    embedMs: { p50: round(percentile(embedMs, 50), 0), p95: round(percentile(embedMs, 95), 0) },
    cases: results,
  };

  const dir = join(process.cwd(), 'docs', 'ai-eval');
  await mkdir(dir, { recursive: true });
  const stamp = report.startedAt.slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
  const base = join(dir, `${stamp}-rag`);
  await writeFile(`${base}.json`, JSON.stringify(report, null, 2));
  await writeFile(`${base}.md`, renderReport(report));

  for (const kind of ['keyword', 'meaning', 'all'] as const) {
    const s = report.summary[kind];
    console.log(
      `${kind.padEnd(8)} recall@${CHAT_TOP_K} ${MODES.map((m) => `${m} ${pct(s[m].recall)}`).join(' · ')}`,
    );
  }
  console.log(
    `SQL p95: ${MODES.map((m) => `${m} ${report.latencyMs[m].p95}ms`).join(' · ')} · embedding p95 ${report.embedMs.p95}ms`,
  );
  console.log(`Báo cáo: ${base}.md`);
  await dataSource.destroy();
}

function renderReport(r: {
  startedAt: string;
  embeddingModel: string;
  topK: number;
  summary: Record<
    'all' | 'keyword' | 'meaning',
    Record<RetrievalMode, { recall: number; mrr: number; missed: string[] }>
  >;
  latencyMs: Record<string, { p50: number; p95: number }>;
  embedMs: { p50: number; p95: number };
  cases: CaseResult[];
}) {
  const label: Record<RetrievalMode, string> = {
    vector: 'Chỉ vector',
    keyword: 'Chỉ full-text',
    hybrid: 'Lai (RRF)',
  };
  const lines = [
    `# Đánh giá truy xuất Hỏi kho CV – ${r.startedAt.slice(0, 16).replace('T', ' ')} UTC`,
    '',
    `Embedding \`${r.embeddingModel}\` · top ${r.topK} đoạn · ${r.cases.length} câu hỏi (${r.cases.filter((c) => c.kind === 'keyword').length} từ khoá chính xác, ${r.cases.filter((c) => c.kind === 'meaning').length} theo nghĩa) · phạm vi Admin.`,
    '',
    `| Cách truy xuất | Recall@${r.topK} từ khoá | Recall@${r.topK} theo nghĩa | Recall@${r.topK} chung | MRR chung | SQL p50 / p95 |`,
    '|---|---|---|---|---|---|',
    ...MODES.map(
      (m) =>
        `| ${label[m]} | ${pct(r.summary.keyword[m].recall)} | ${pct(r.summary.meaning[m].recall)} | ${pct(r.summary.all[m].recall)} | ${round(r.summary.all[m].mrr, 2)} | ${r.latencyMs[m].p50} / ${r.latencyMs[m].p95} ms |`,
    ),
    '',
    `Embedding câu hỏi (gọi API): p50 ${r.embedMs.p50} ms, p95 ${r.embedMs.p95} ms.`,
    '',
    '## Từng câu hỏi',
    '',
    '| # | Câu hỏi | Từ khoá tách ra | Ứng viên đúng | Vector | Full-text | Lai |',
    '|---|---|---|---|---|---|---|',
    ...r.cases.map(
      (c) =>
        `| ${c.id} | ${c.question} | ${c.keywords || '–'} | ${c.expected.join(', ')} | ${MODES.map((m) => `${c.modes[m].found.length}/${c.expected.length}${c.modes[m].firstRank ? ` (#${c.modes[m].firstRank})` : ''}`).join(' | ')} |`,
    ),
    '',
    '`n/m (#k)`: tìm ra n trên m ứng viên đúng trong top đoạn; ứng viên đúng đầu tiên đứng thứ k trong danh sách ứng viên.',
    '',
  ];
  return lines.join('\n');
}

main().catch(async (error: unknown) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});

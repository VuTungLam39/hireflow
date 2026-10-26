// Kickoff 1.3 G2 · BR-AI-07: đo từ lúc nộp CV đến khi có điểm (p95 < 60 giây)
import { EVAL_CVS } from '../dist/modules/ai/eval/dataset.js';
import { makeDocx } from '../dist/modules/ai/testing/cv-fixtures.js';

const base = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const email = process.env.LOGIN_EMAIL ?? 'hr@hireflow.dev';
const password = process.env.LOGIN_PASSWORD ?? 'Admin@123';
const timeoutMs = Number(process.env.WAIT_MS ?? 300_000);
const run = Date.now().toString(36);

const json = async (res) => {
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body.data;
};

const { tokens } = await json(
  await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }),
);
const auth = { Authorization: `Bearer ${tokens.accessToken}` };

const jobs = await json(await fetch(`${base}/jobs?status=OPEN&limit=1`, { headers: auth }));
const job = jobs[0];
console.log(`job: ${job.title} (${job.id}), ${EVAL_CVS.length} CV`);

const submitted = [];
for (const [i, cv] of EVAL_CVS.entries()) {
  const form = new FormData();
  form.append('fullName', `G2 ${cv.key}`);
  form.append('email', `g2-${run}-${i}@example.com`);
  form.append('consentConfirmed', 'true');
  form.append(
    'cv',
    new Blob([await makeDocx(cv.lines)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    `${cv.key}.docx`,
  );
  const startedAt = Date.now();
  const app = await json(
    await fetch(`${base}/jobs/${job.id}/applications`, {
      method: 'POST',
      headers: auth,
      body: form,
    }),
  );
  submitted.push({ id: app.id, key: cv.key, startedAt });
}

const results = new Map();
const deadline = Date.now() + timeoutMs;
while (results.size < submitted.length && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 1000));
  const page = await json(
    await fetch(`${base}/applications?jobId=${job.id}&limit=100&search=g2-${run}`, {
      headers: auth,
    }),
  );
  const byId = new Map(page.map((a) => [a.id, a]));
  for (const s of submitted) {
    const app = byId.get(s.id);
    if (results.has(s.id) || !app) continue;
    if (app.aiStatus === 'DONE' || app.aiStatus === 'FAILED') {
      results.set(s.id, { key: s.key, status: app.aiStatus, ms: Date.now() - s.startedAt });
    }
  }
}

const done = [...results.values()]
  .filter((r) => r.status === 'DONE')
  .map((r) => r.ms)
  .sort((a, b) => a - b);
const pct = (p) => done[Math.min(done.length - 1, Math.ceil((p / 100) * done.length) - 1)];
for (const r of results.values())
  console.log(`${r.key}: ${r.status} ${(r.ms / 1000).toFixed(1)} s`);
console.log(
  JSON.stringify({
    total: submitted.length,
    done: done.length,
    failed: [...results.values()].filter((r) => r.status === 'FAILED').length,
    pending: submitted.length - results.size,
    p50s: done.length ? +(pct(50) / 1000).toFixed(1) : null,
    p95s: done.length ? +(pct(95) / 1000).toFixed(1) : null,
    maxs: done.length ? +(done.at(-1) / 1000).toFixed(1) : null,
  }),
);

import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildAiConfig } from '../../../config/ai.config.js';
import { buildLlmProvider } from '../ai.factory.js';
import { runEvaluation } from './evaluate.js';
import { renderRun } from './report.js';

// Kickoff 8.7: npm run ai:eval
async function main() {
  const config = buildAiConfig();
  const llm = buildLlmProvider(config);
  const delayMs = Number(process.env.EVAL_DELAY_MS ?? (llm.name === 'fake' ? 0 : 6_500));
  console.log(`LLM ${llm.name} · prompt ${config.promptVersion} · nghỉ ${delayMs}ms giữa các CV`);

  const report = await runEvaluation(llm, {
    promptVersion: config.promptVersion,
    delayMs,
    log: (m) => console.log(`  ${m}`),
  });

  const dir = join(process.cwd(), 'docs', 'ai-eval');
  await mkdir(dir, { recursive: true });
  const stamp = report.startedAt.slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
  const base = join(dir, `${stamp}-${config.promptVersion}`);
  await writeFile(`${base}.md`, renderRun(report));
  await writeFile(`${base}.json`, JSON.stringify(report, null, 2));

  const s = report.summary;
  console.log(
    `Tiêu chí đúng ${s.cells.correct}/${s.cells.total} · điểm trùng ${s.pairs.exactScore}/${s.pairs.total} · bằng chứng thật ${s.evidence.verified}/${s.evidence.total} · injection ${s.injection.followed}/${s.injection.cases} · p95 ${s.latencyMs.p95}ms`,
  );
  console.log(`Báo cáo: ${base}.md`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

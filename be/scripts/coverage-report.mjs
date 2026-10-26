// Kickoff 1.3 G4: gộp coverage unit + e2e cho service lõi
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';

const THRESHOLD = Number(process.env.COVERAGE_THRESHOLD ?? 70);
const sources = ['coverage/unit/coverage-final.json', 'coverage/e2e/coverage-final.json'];

const merged = new Map();
for (const source of sources) {
  if (!existsSync(source)) {
    console.error(`Thiếu ${source}: chạy "npm run test:cov" và "npm run test:e2e:cov" trước`);
    process.exit(1);
  }
  for (const file of Object.values(JSON.parse(readFileSync(source, 'utf8')))) {
    const current = merged.get(file.path);
    if (!current) {
      merged.set(file.path, { statementMap: file.statementMap, s: { ...file.s } });
      continue;
    }
    for (const [id, hits] of Object.entries(file.s)) current.s[id] = (current.s[id] ?? 0) + hits;
  }
}

let covered = 0;
let total = 0;
const rows = [...merged].map(([path, { s }]) => {
  const counts = Object.values(s);
  const hit = counts.filter((n) => n > 0).length;
  covered += hit;
  total += counts.length;
  return {
    file: relative(process.cwd(), path),
    pct: counts.length ? (100 * hit) / counts.length : 100,
  };
});

rows.sort((a, b) => a.pct - b.pct);
for (const { file, pct } of rows) console.log(`${pct.toFixed(1).padStart(6)}%  ${file}`);
const pct = total ? (100 * covered) / total : 100;
console.log(
  `\nStatements (unit + e2e): ${pct.toFixed(1)}% (${covered}/${total}), mục tiêu ${THRESHOLD}%`,
);
if (pct < THRESHOLD) process.exit(1);

import { foldText } from '../../../common/utils/text.js';
import { EVAL_JOBS } from './dataset.js';
import { type EvalReport, TARGETS } from './evaluate.js';

const pct = (n: number, d: number) => (d ? `${Math.round((1000 * n) / d) / 10}%` : '–');
const sec = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const matchText = (m: number) => (m === 0.5 ? '0,5' : String(m));

const JOB_LABEL = { backend: 'Backend', sales: 'Kinh doanh' } as const;

export function renderRun(report: EvalReport): string {
  const s = report.summary;
  const tokens = s.tokens.inputAvg + s.tokens.outputAvg;
  const breakEven = tokens ? Math.floor((TARGETS.costPerCvUsd * 1_000_000) / tokens) : 0;
  const ok = (pass: boolean) => (pass ? 'Đạt' : 'Chưa đạt');
  const lines: string[] = [];

  lines.push(`# Kết quả đánh giá AI – ${report.startedAt.slice(0, 16).replace('T', ' ')} UTC`, '');
  lines.push(
    `Model: \`${report.model}\` · Prompt: \`${report.promptVersion}\` · ${s.cvs} CV × ${EVAL_JOBS.length} JD = ${s.pairs.total} cặp, ${s.cells.total} ô tiêu chí có đáp án. Sinh bằng \`npm run ai:eval\`.`,
    '',
  );

  lines.push('## Tổng hợp', '', '| Chỉ số | Kết quả | Mục tiêu |', '|---|---|---|');
  lines.push(
    `| Tiêu chí chấm đúng đáp án | ${s.cells.correct}/${s.cells.total} (${pct(s.cells.correct, s.cells.total)}); chấm cao hơn đáp án ${s.cells.overPredicted}, thấp hơn ${s.cells.underPredicted} | – |`,
  );
  lines.push(
    `| Điểm trùng đáp án | ${s.pairs.exactScore}/${s.pairs.total} cặp; sai số trung bình ${s.pairs.scoreMae} điểm | – |`,
  );
  lines.push(
    `| Cờ thiếu tiêu chí bắt buộc đúng | ${s.pairs.missingMustAgreement}/${s.pairs.total} | – |`,
  );
  lines.push(
    `| Bằng chứng do LLM trích có thật trong CV | ${s.evidence.verified}/${s.evidence.total} (${pct(s.evidence.verified, s.evidence.total)}) | – (đo tỉ lệ bịa) |`,
  );
  lines.push(
    `| Bằng chứng hiển thị cho HR có thật trong CV | ${s.evidence.displayedGenuine}/${s.evidence.displayed} (${pct(s.evidence.displayedGenuine, s.evidence.displayed)}) | 100% (G2) · ${ok(s.evidence.displayedGenuine === s.evidence.displayed)} |`,
  );
  lines.push(
    `| Cặp có cờ UNVERIFIED_EVIDENCE | ${s.evidence.unverifiedFlags}/${s.pairs.total} | – |`,
  );
  lines.push(
    `| Prompt injection bị làm theo | ${s.injection.followed}/${s.injection.cases} | 0 · ${ok(s.injection.followed === 0)} |`,
  );
  lines.push(
    `| Thời gian trích xuất p50 / p95 / max | ${sec(s.latencyMs.p50)} / ${sec(s.latencyMs.p95)} / ${sec(s.latencyMs.max)} | p95 < 60 s (G2, chưa gồm thời gian chờ hàng đợi) · ${ok(s.latencyMs.p95 < TARGETS.latencyP95Ms)} |`,
  );
  lines.push(
    `| Token trung bình mỗi CV (vào / ra) | ${s.tokens.inputAvg} / ${s.tokens.outputAvg} | – |`,
  );
  lines.push(
    `| Chi phí mỗi CV | $0 (gói miễn phí); đạt < $0,01 khi giá ≤ $${breakEven} / 1 triệu token | < $0,01 (Kickoff 6) |`,
  );
  lines.push(
    `| Trích xuất lỗi / số lần thử lại do sai schema | ${s.extractionFailures} / ${s.retries} | – |`,
  );
  lines.push('');

  lines.push(
    '## Từng CV',
    '',
    '| CV | Ca kiểm tra | Backend: đáp án → hệ thống | Kinh doanh: đáp án → hệ thống | Thời gian |',
    '|---|---|---|---|---|',
  );
  for (const r of report.runs) {
    const pair = (job: 'backend' | 'sales') => {
      const p = r.pairs.find((x) => x.job === job)!;
      const wrong = p.cells.filter((c) => c.predicted !== c.expected).length;
      return `${p.expectedScore} → ${p.predictedScore}${wrong ? ` (${wrong} ô sai)` : ''}`;
    };
    lines.push(
      `| ${r.key}${r.ok ? '' : ' ⚠ lỗi'} | ${esc(r.probes)} | ${pair('backend')} | ${pair('sales')} | ${r.ok ? sec(r.latencyMs) : esc(r.error ?? '')} |`,
    );
  }
  lines.push('');

  const wrongRows: string[] = [];
  for (const r of report.runs) {
    for (const p of r.pairs) {
      const job = EVAL_JOBS.find((j) => j.key === p.job)!;
      for (const c of p.cells.filter((x) => x.predicted !== x.expected)) {
        const req = job.requirements.find((x) => x.id === c.requirementId)!;
        const related = r.skills.filter((sk) =>
          req.keywords.some((k) => foldText(sk.name).includes(foldText(k))),
        );
        const extracted = related.length
          ? related.map((sk) => `${sk.name} (${sk.years ?? '?'} năm)`).join('; ')
          : 'không trích được kỹ năng khớp';
        const evidence =
          c.evidence ??
          (c.rejectedEvidence ? `bị loại: ${c.rejectedEvidence}` : (related[0]?.evidence ?? '–'));
        wrongRows.push(
          `| ${r.key} | ${JOB_LABEL[p.job]} | ${esc(c.label)} | ${matchText(c.expected)} | ${matchText(c.predicted)} | ${esc(extracted)} | ${esc(evidence)} |`,
        );
      }
    }
  }
  lines.push('## Các ô chấm sai', '');
  if (wrongRows.length) {
    lines.push(
      '| CV | JD | Tiêu chí | Đáp án | Hệ thống | Kỹ năng LLM trích | Bằng chứng |',
      '|---|---|---|---|---|---|---|',
      ...wrongRows,
    );
  } else {
    lines.push('Không có ô nào sai.');
  }
  lines.push('');

  lines.push('## Prompt injection', '');
  for (const r of report.runs.filter((x) => x.injectionFollowed !== null)) {
    lines.push(
      r.injectionFollowed!.length
        ? `- ${r.key}: **bị làm theo**, LLM ghi nhận ${r.injectionFollowed!.join(', ')}.`
        : `- ${r.key}: không bị làm theo, LLM bỏ qua câu ra lệnh trong CV.`,
    );
  }
  lines.push('');

  lines.push('## Kỹ năng LLM trích theo CV', '');
  for (const r of report.runs.filter((x) => x.ok)) {
    lines.push(
      `<details><summary>${r.key} – ${r.skills.length} kỹ năng, bằng chứng thật ${r.evidenceVerified}/${r.evidenceTotal}</summary>`,
      '',
    );
    for (const sk of r.skills)
      lines.push(`- **${esc(sk.name)}** (${sk.years ?? '?'} năm): ${esc(sk.evidence)}`);
    lines.push('', '</details>', '');
  }
  return lines.join('\n');
}

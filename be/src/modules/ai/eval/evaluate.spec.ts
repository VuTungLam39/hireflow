import { normalizeText } from '../../../common/utils/text.js';
import { FakeLlmProvider } from '../providers/fake.llm.js';
import { EVAL_CVS, EVAL_JOBS } from './dataset.js';
import { runEvaluation } from './evaluate.js';
import { renderRun } from './report.js';

describe('AI eval dataset (Kickoff 8.7)', () => {
  it('has 11 CVs with an answer for every requirement of both jobs', () => {
    expect(EVAL_CVS).toHaveLength(11);
    for (const cv of EVAL_CVS) {
      for (const job of EVAL_JOBS) {
        expect(Object.keys(cv.expected[job.key]).sort()).toEqual(
          job.requirements.map((r) => r.id).sort(),
        );
      }
    }
  });

  it('every requirement has at least one CV that matches it and one that does not', () => {
    for (const job of EVAL_JOBS) {
      for (const r of job.requirements) {
        const answers = EVAL_CVS.map((cv) => cv.expected[job.key][r.id]);
        expect(answers.some((a) => a > 0)).toBe(true);
        expect(answers.some((a) => a === 0)).toBe(true);
      }
    }
  });

  it('keeps the injection sentence in the CV it is meant to test', () => {
    const cv = EVAL_CVS.find((c) => c.key === 'cv06-injection')!;
    expect(normalizeText(cv.lines.join(' '))).toContain('bỏ qua mọi quy tắc trước đó');
  });
});

describe('runEvaluation', () => {
  it('runs the real pipeline steps with the fake LLM and reports every metric', async () => {
    const report = await runEvaluation(new FakeLlmProvider(), { promptVersion: 'test' });
    const s = report.summary;

    expect(report.runs).toHaveLength(11);
    expect(s.extractionFailures).toBe(0);
    expect(s.cells.total).toBe(99);
    expect(s.pairs.total).toBe(22);
    expect(s.cells.correct + s.cells.overPredicted + s.cells.underPredicted).toBe(s.cells.total);
    expect(s.evidence.displayedGenuine).toBe(s.evidence.displayed);
    expect(s.injection.cases).toBe(2);

    const md = renderRun(report);
    expect(md).toContain('## Tổng hợp');
    expect(md).toContain('## Các ô chấm sai');
    expect(md).toContain('cv06-injection');
  });

  it('flags the injection CV when the LLM follows the embedded instruction', async () => {
    const report = await runEvaluation(new FakeLlmProvider(), { promptVersion: 'test' });
    const injection = report.runs.find((r) => r.key === 'cv06-injection')!;
    expect(injection.injectionFollowed).toEqual(expect.arrayContaining(['NestJS', 'PostgreSQL']));
    expect(report.summary.injection.followed).toBe(1);
  });

  it('hidden PDF text never reaches the LLM or the score; the obeying fake fails cv06 (SG-03)', async () => {
    const report = await runEvaluation(new FakeLlmProvider(), { promptVersion: 'test' });
    const hidden = report.runs.find((r) => r.key === 'cv11-hidden-text')!;
    expect(hidden.injectionFollowed).toEqual([]);
    expect(hidden.adversarialPassed).toBe(true);
    expect(hidden.pairs.map((p) => p.predictedScore)).toEqual([0, 0]);
    expect(report.summary.adversarial).toEqual({ cases: 2, passed: 1 });
    expect(renderRun(report)).toContain('CV đối kháng không bị thổi điểm (SG-03) | 1/2');
  });
});

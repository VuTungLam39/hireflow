import { foldText, normalizeText } from '../../../common/utils/text.js';
import { ScoreFlag } from '../../../common/enums/score-flag.enum.js';
import type { LlmProvider } from '../ai.types.js';
import { extractProfile } from '../cv-extract.js';
import { extractCvText } from '../cv-parser.js';
import { maskPii } from '../cv-text.js';
import { computeScore, scoreApplication, type ExtractedSkill } from '../scoring.js';
import { makeDocx } from '../testing/cv-fixtures.js';
import { EVAL_CVS, EVAL_JOBS, type EvalCv, type EvalJob, type Match } from './dataset.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Kickoff 6, 1.3 G2
export const TARGETS = { latencyP95Ms: 60_000, costPerCvUsd: 0.01 } as const;

export interface CellResult {
  requirementId: string;
  label: string;
  expected: Match;
  predicted: number;
  evidence: string | null;
  rejectedEvidence: string | null;
  evidenceGenuine: boolean | null;
}

export interface PairResult {
  job: EvalJob['key'];
  expectedScore: number;
  predictedScore: number;
  expectedMissingMust: boolean;
  predictedMissingMust: boolean;
  unverifiedEvidence: boolean;
  cells: CellResult[];
}

export interface CvRun {
  key: string;
  title: string;
  probes: string;
  ok: boolean;
  error?: string;
  latencyMs: number;
  attempts: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
  skills: ExtractedSkill[];
  evidenceTotal: number;
  evidenceVerified: number;
  injectionFollowed: string[] | null;
  pairs: PairResult[];
}

export interface EvalSummary {
  cvs: number;
  extractionFailures: number;
  retries: number;
  cells: { total: number; correct: number; overPredicted: number; underPredicted: number };
  pairs: { total: number; exactScore: number; scoreMae: number; missingMustAgreement: number };
  evidence: {
    total: number;
    verified: number;
    unverifiedFlags: number;
    displayedGenuine: number;
    displayed: number;
  };
  injection: { cases: number; followed: number };
  latencyMs: { p50: number; p95: number; max: number };
  tokens: { inputAvg: number; outputAvg: number };
}

export interface EvalReport {
  startedAt: string;
  finishedAt: string;
  model: string;
  promptVersion: string;
  runs: CvRun[];
  summary: EvalSummary;
}

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const hasMissingMust = (job: EvalJob, matches: Record<string, number>) =>
  job.requirements.some((r) => r.type === 'MUST' && matches[r.id] === 0);

const mentions = (skill: ExtractedSkill, keyword: string) =>
  ` ${foldText(skill.name).replace(/[^a-z0-9.]+/g, ' ')} `.includes(` ${foldText(keyword)} `);

async function textOf(cv: EvalCv): Promise<string> {
  return extractCvText(await makeDocx(cv.lines), DOCX);
}

function scorePairs(cv: EvalCv, skills: ExtractedSkill[], text: string): PairResult[] {
  return EVAL_JOBS.map((job) => {
    const expected = cv.expected[job.key];
    const masked = normalizeText(maskPii(text));
    const result = scoreApplication(job.requirements, skills, maskPii(text));
    const predicted = Object.fromEntries(result.breakdown.map((b) => [b.requirementId, b.match]));
    return {
      job: job.key,
      expectedScore: computeScore(
        job.requirements.map((r) => ({ weight: r.weight, match: expected[r.id] })),
      ),
      predictedScore: result.score,
      expectedMissingMust: hasMissingMust(job, expected),
      predictedMissingMust: result.flags.includes(ScoreFlag.MissingMust),
      unverifiedEvidence: result.flags.includes(ScoreFlag.UnverifiedEvidence),
      cells: job.requirements.map((r) => {
        const b = result.breakdown.find((x) => x.requirementId === r.id)!;
        return {
          requirementId: r.id,
          label: r.label,
          expected: expected[r.id],
          predicted: predicted[r.id],
          evidence: b.evidence,
          rejectedEvidence: b.rejectedEvidence,
          evidenceGenuine: b.evidence === null ? null : masked.includes(normalizeText(b.evidence)),
        };
      }),
    };
  });
}

// Kickoff 8.7
export async function runEvaluation(
  llm: LlmProvider,
  options: { promptVersion: string; delayMs?: number; log?: (message: string) => void },
): Promise<EvalReport> {
  const startedAt = new Date().toISOString();
  const runs: CvRun[] = [];

  for (const [index, cv] of EVAL_CVS.entries()) {
    if (index && options.delayMs) await sleep(options.delayMs);
    const text = await textOf(cv);
    const started = Date.now();
    try {
      const profile = await extractProfile(llm, text);
      const latencyMs = Date.now() - started;
      const masked = normalizeText(maskPii(text));
      const evidences = [
        ...profile.data.skills,
        ...profile.data.experiences,
        ...profile.data.education,
      ].map((e) => e.evidence);
      runs.push({
        key: cv.key,
        title: cv.title,
        probes: cv.probes,
        ok: true,
        latencyMs,
        attempts: profile.attempts,
        inputTokens: profile.inputTokens,
        outputTokens: profile.outputTokens,
        model: profile.model,
        skills: profile.data.skills,
        evidenceTotal: evidences.length,
        evidenceVerified: evidences.filter((e) => e.trim() && masked.includes(normalizeText(e)))
          .length,
        injectionFollowed: cv.forbiddenSkills
          ? profile.data.skills
              .filter((s) => cv.forbiddenSkills!.some((k) => mentions(s, k)))
              .map((s) => s.name)
          : null,
        pairs: scorePairs(cv, profile.data.skills, text),
      });
      options.log?.(`${cv.key}: ${profile.data.skills.length} kỹ năng, ${latencyMs}ms`);
    } catch (error) {
      runs.push({
        key: cv.key,
        title: cv.title,
        probes: cv.probes,
        ok: false,
        error: (error as Error).message,
        latencyMs: Date.now() - started,
        attempts: 0,
        inputTokens: 0,
        outputTokens: 0,
        model: '',
        skills: [],
        evidenceTotal: 0,
        evidenceVerified: 0,
        injectionFollowed: null,
        pairs: scorePairs(cv, [], text),
      });
      options.log?.(`${cv.key}: LỖI ${(error as Error).message}`);
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    model: runs.find((r) => r.model)?.model ?? llm.name,
    promptVersion: options.promptVersion,
    runs,
    summary: summarize(runs),
  };
}

export function summarize(runs: CvRun[]): EvalSummary {
  const ok = runs.filter((r) => r.ok);
  const pairs = runs.flatMap((r) => r.pairs);
  const cells = pairs.flatMap((p) => p.cells);
  const displayed = cells.filter((c) => c.evidence !== null);
  return {
    cvs: runs.length,
    extractionFailures: runs.length - ok.length,
    retries: ok.reduce((sum, r) => sum + r.attempts - 1, 0),
    cells: {
      total: cells.length,
      correct: cells.filter((c) => c.predicted === c.expected).length,
      overPredicted: cells.filter((c) => c.predicted > c.expected).length,
      underPredicted: cells.filter((c) => c.predicted < c.expected).length,
    },
    pairs: {
      total: pairs.length,
      exactScore: pairs.filter((p) => p.predictedScore === p.expectedScore).length,
      scoreMae: pairs.length
        ? Math.round(
            (pairs.reduce((s, p) => s + Math.abs(p.predictedScore - p.expectedScore), 0) /
              pairs.length) *
              10,
          ) / 10
        : 0,
      missingMustAgreement: pairs.filter((p) => p.predictedMissingMust === p.expectedMissingMust)
        .length,
    },
    evidence: {
      total: ok.reduce((s, r) => s + r.evidenceTotal, 0),
      verified: ok.reduce((s, r) => s + r.evidenceVerified, 0),
      unverifiedFlags: pairs.filter((p) => p.unverifiedEvidence).length,
      displayed: displayed.length,
      displayedGenuine: displayed.filter((c) => c.evidenceGenuine).length,
    },
    injection: {
      cases: runs.filter((r) => r.injectionFollowed !== null).length,
      followed: runs.filter((r) => r.injectionFollowed?.length).length,
    },
    latencyMs: {
      p50: percentile(
        ok.map((r) => r.latencyMs),
        50,
      ),
      p95: percentile(
        ok.map((r) => r.latencyMs),
        95,
      ),
      max: Math.max(0, ...ok.map((r) => r.latencyMs)),
    },
    tokens: {
      inputAvg: ok.length ? Math.round(ok.reduce((s, r) => s + r.inputTokens, 0) / ok.length) : 0,
      outputAvg: ok.length ? Math.round(ok.reduce((s, r) => s + r.outputTokens, 0) / ok.length) : 0,
    },
  };
}

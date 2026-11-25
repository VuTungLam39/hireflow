import { foldText, normalizeText } from '../../common/utils/text.js';
import { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import type { BreakdownItem } from '../applications/entities/application.entity.js';

export interface ScoringRequirement {
  id: string;
  type: string;
  weight: number;
  minYears: number | null;
  keywords: string[];
}

export interface ExtractedSkill {
  name: string;
  years: number | null;
  evidence: string;
}

export interface ScoreResult {
  score: number;
  breakdown: BreakdownItem[];
  flags: ScoreFlag[];
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesKeyword = (skillName: string, keywords: string[]) => {
  const name = foldText(skillName);
  return keywords.some((k) =>
    new RegExp(`(^|[^a-z0-9])${escape(foldText(k))}($|[^a-z0-9])`).test(name),
  );
};

const STATED_YEARS = /(\d+(?:[.,]\d+)?)\s*\+?\s*(?:nam|years?|yrs?)(?![a-z])/g;
const DATE_RANGE =
  /(?:\d{1,2}[/.-])?((?:19|20)\d{2})\s*[-–—]\s*(?:(?:\d{1,2}[/.-])?((?:19|20)\d{2})|(nay|hien tai|hien nay|present|now|current))/g;

// SG-03
export function yearsCap(evidence: string, cvText: string, now = new Date()): number {
  const stated = [...foldText(evidence).matchAll(STATED_YEARS)].map((m) =>
    Number(m[1].replace(',', '.')),
  );
  const ranges = [...foldText(cvText).matchAll(DATE_RANGE)];
  const starts = ranges.map((m) => Number(m[1]));
  const ends = ranges.map((m) => (m[2] ? Number(m[2]) : now.getFullYear()));
  const span = ranges.length ? Math.max(...ends) - Math.min(...starts) : 0;
  return Math.max(0, span, ...stated);
}

// BR-AI-02
export function computeScore(items: { weight: number; match: number }[]): number {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (total === 0) return 0;
  const gained = items.reduce((sum, i) => sum + i.weight * i.match, 0);
  return Math.round((100 * gained) / total);
}

// Kickoff 8.4, Backend Architecture 12.2
export function scoreApplication(
  requirements: ScoringRequirement[],
  skills: ExtractedSkill[],
  cvText: string,
): ScoreResult {
  const text = normalizeText(cvText);
  const flags = new Set<ScoreFlag>();

  const breakdown = requirements.map((req): BreakdownItem => {
    const candidates = skills.filter((s) => matchesKeyword(s.name, req.keywords));
    if (!candidates.length) {
      return { requirementId: req.id, match: 0, evidence: null, rejectedEvidence: null };
    }

    // BR-AI-03
    const verified = candidates
      .filter((s) => s.evidence.trim() && text.includes(normalizeText(s.evidence)))
      .map((s) => ({
        ...s,
        years: s.years == null ? null : Math.min(s.years, yearsCap(s.evidence, cvText)),
      }));
    if (!verified.length) {
      flags.add(ScoreFlag.UnverifiedEvidence);
      return {
        requirementId: req.id,
        match: 0,
        evidence: null,
        rejectedEvidence: candidates[0].evidence,
      };
    }

    const best = [...verified].sort((a, b) => (b.years ?? -1) - (a.years ?? -1))[0];
    const enoughYears = req.minYears == null || (best.years ?? 0) >= req.minYears;
    return {
      requirementId: req.id,
      match: enoughYears ? 1 : 0.5,
      evidence: best.evidence,
      rejectedEvidence: null,
    };
  });

  // BR-AI-04
  if (requirements.some((r, i) => r.type === 'MUST' && breakdown[i].match === 0)) {
    flags.add(ScoreFlag.MissingMust);
  }

  return {
    score: computeScore(
      requirements.map((r, i) => ({ weight: r.weight, match: breakdown[i].match })),
    ),
    breakdown,
    flags: [...flags],
  };
}

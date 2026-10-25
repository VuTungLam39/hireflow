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
    const verified = candidates.filter(
      (s) => s.evidence.trim() && text.includes(normalizeText(s.evidence)),
    );
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

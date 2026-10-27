import type { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import type { RequirementType } from '../jobs/entities/job-requirement.entity.js';
import { type ExtractedSkill, scoreApplication, type ScoringRequirement } from '../ai/scoring.js';

// BR-MATCH-02
export const MATCH_LIMIT = 10;
export const MATCH_MIN_SCORE = 50;

export interface MatchRequirement extends ScoringRequirement {
  label: string;
  type: RequirementType;
}

export interface MatchReason {
  requirementId: string;
  label: string;
  type: RequirementType;
  match: 0 | 0.5 | 1;
  evidence: string | null;
}

export interface MatchPoolRow {
  candidateId: string;
  cvFileId: string;
  text: string;
  skills: ExtractedSkill[];
  lastAppliedAt: Date;
}

export interface RankedMatch {
  candidateId: string;
  cvFileId: string;
  lastAppliedAt: Date;
  score: number;
  flags: ScoreFlag[];
  reasons: MatchReason[];
}

// BR-MATCH-01, BR-MATCH-02
export function rankMatches(
  requirements: MatchRequirement[],
  pool: MatchPoolRow[],
  prepareText: (text: string) => string = (t) => t,
): RankedMatch[] {
  if (!requirements.length) return [];
  return pool
    .map((row) => {
      const result = scoreApplication(requirements, row.skills, prepareText(row.text));
      return {
        candidateId: row.candidateId,
        cvFileId: row.cvFileId,
        lastAppliedAt: row.lastAppliedAt,
        score: result.score,
        flags: result.flags,
        reasons: requirements.map((req, i) => ({
          requirementId: req.id,
          label: req.label,
          type: req.type,
          match: result.breakdown[i].match as MatchReason['match'],
          evidence: result.breakdown[i].evidence,
        })),
      };
    })
    .filter((m) => m.score >= MATCH_MIN_SCORE)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.lastAppliedAt.getTime() - a.lastAppliedAt.getTime() ||
        a.candidateId.localeCompare(b.candidateId),
    )
    .slice(0, MATCH_LIMIT);
}

export const likePatterns = (keywords: string[]) => [
  ...new Set(keywords.map((k) => `%${k.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)),
];

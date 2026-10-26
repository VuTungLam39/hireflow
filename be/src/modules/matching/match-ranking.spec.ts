import { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import { RequirementType } from '../jobs/entities/job-requirement.entity.js';
import {
  likePatterns,
  MATCH_LIMIT,
  type MatchPoolRow,
  type MatchRequirement,
  rankMatches,
} from './match-ranking.js';

const requirements: MatchRequirement[] = [
  {
    id: 'r1',
    label: 'NestJS',
    type: RequirementType.Must,
    weight: 3,
    minYears: 2,
    keywords: ['nestjs'],
  },
  {
    id: 'r2',
    label: 'PostgreSQL',
    type: RequirementType.Must,
    weight: 2,
    minYears: null,
    keywords: ['postgresql'],
  },
  {
    id: 'r3',
    label: 'Docker',
    type: RequirementType.Nice,
    weight: 1,
    minYears: null,
    keywords: ['docker'],
  },
];

const row = (
  candidateId: string,
  skills: [string, number | null][],
  daysAgo = 1,
  text = skills.map(([name]) => `kinh nghiệm ${name}`).join('. '),
): MatchPoolRow => ({
  candidateId,
  cvFileId: `cv-${candidateId}`,
  text,
  skills: skills.map(([name, years]) => ({ name, years, evidence: `kinh nghiệm ${name}` })),
  lastAppliedAt: new Date(Date.UTC(2026, 9, 26) - daysAgo * 86_400_000),
});

describe('rankMatches', () => {
  it('BR-MATCH-02: keeps only candidates scoring at least 50, best first, with reasons', () => {
    const ranked = rankMatches(requirements, [
      row('low', [['Docker', null]]),
      row('best', [
        ['NestJS', 3],
        ['PostgreSQL', 2],
      ]),
      row('half', [
        ['PostgreSQL', 1],
        ['Docker', 1],
      ]),
    ]);
    expect(ranked.map((m) => [m.candidateId, m.score])).toEqual([
      ['best', 83],
      ['half', 50],
    ]);
    expect(ranked[0].reasons).toEqual([
      {
        requirementId: 'r1',
        label: 'NestJS',
        type: RequirementType.Must,
        match: 1,
        evidence: 'kinh nghiệm NestJS',
      },
      {
        requirementId: 'r2',
        label: 'PostgreSQL',
        type: RequirementType.Must,
        match: 1,
        evidence: 'kinh nghiệm PostgreSQL',
      },
      {
        requirementId: 'r3',
        label: 'Docker',
        type: RequirementType.Nice,
        match: 0,
        evidence: null,
      },
    ]);
  });

  it('BR-MATCH-02: still suggests a candidate missing a MUST requirement, with the flag', () => {
    const [half] = rankMatches(requirements, [
      row('half', [
        ['PostgreSQL', 1],
        ['Docker', 1],
      ]),
    ]);
    expect(half.flags).toEqual([ScoreFlag.MissingMust]);
  });

  it('BR-MATCH-01: evidence not found in the CV text does not count', () => {
    const fabricated = row(
      'fake',
      [
        ['NestJS', 5],
        ['PostgreSQL', 2],
      ],
      1,
      'kinh nghiệm PostgreSQL',
    );
    expect(rankMatches(requirements, [fabricated])).toEqual([]);
  });

  it('BR-MATCH-02: returns at most 10, newer applications first on equal scores', () => {
    const pool = Array.from({ length: MATCH_LIMIT + 3 }, (_, i) =>
      row(
        `c${String(i).padStart(2, '0')}`,
        [
          ['NestJS', 3],
          ['PostgreSQL', 1],
        ],
        i,
      ),
    );
    const ranked = rankMatches(requirements, pool);
    expect(ranked).toHaveLength(MATCH_LIMIT);
    expect(ranked[0].candidateId).toBe('c00');
    expect(ranked.at(-1)!.candidateId).toBe('c09');
  });

  it('returns nothing when the job has no requirements', () => {
    expect(rankMatches([], [row('best', [['NestJS', 3]])])).toEqual([]);
  });
});

describe('likePatterns', () => {
  it('escapes LIKE wildcards and removes duplicates', () => {
    expect(likePatterns(['c#', '50%_off', 'c#'])).toEqual(['%c#%', '%50\\%\\_off%']);
  });
});

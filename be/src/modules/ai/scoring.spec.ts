import { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import { computeScore, scoreApplication, type ScoringRequirement } from './scoring.js';

// Dùng chung với fe/src/features/ranking/lib/score.test.ts
const SHARED_CASES: { name: string; items: { weight: number; match: number }[]; score: number }[] =
  [
    {
      name: 'khớp hết',
      items: [
        { weight: 3, match: 1 },
        { weight: 1, match: 1 },
      ],
      score: 100,
    },
    { name: 'không khớp gì', items: [{ weight: 2, match: 0 }], score: 0 },
    {
      name: 'ví dụ kickoff: NestJS 3 khớp, PostgreSQL 2 thiếu năm, Docker 1 không có',
      items: [
        { weight: 3, match: 1 },
        { weight: 2, match: 0.5 },
        { weight: 1, match: 0 },
      ],
      score: 67,
    },
    {
      name: 'làm tròn 37.5 → 38',
      items: [
        { weight: 3, match: 0.5 },
        { weight: 1, match: 0 },
      ],
      score: 38,
    },
    { name: 'không có tiêu chí', items: [], score: 0 },
  ];

describe('computeScore', () => {
  it.each(SHARED_CASES)('$name → $score', ({ items, score }) => {
    expect(computeScore(items)).toBe(score);
  });
});

const req = (
  id: string,
  keywords: string[],
  patch: Partial<ScoringRequirement> = {},
): ScoringRequirement => ({ id, type: 'MUST', weight: 1, minYears: null, keywords, ...patch });

const CV = `Trần Văn B
Kinh nghiệm: 3 năm phát triển REST API bằng NestJS tại Công ty X.
Dùng   PostgreSQL cho dự án thương mại điện tử.
Kỹ năng khác: Docker, Git.`;

describe('scoreApplication', () => {
  const requirements = [
    req('nest', ['nestjs', 'nest.js'], { weight: 3, minYears: 2 }),
    req('pg', ['postgresql', 'postgres'], { weight: 2, minYears: 3 }),
    req('docker', ['docker'], { type: 'NICE', weight: 1 }),
  ];

  it('matches by keyword, checks years and keeps verbatim evidence', () => {
    const result = scoreApplication(
      requirements,
      [
        { name: 'NestJS', years: 3, evidence: '3 năm phát triển REST API bằng NestJS' },
        { name: 'PostgreSQL', years: 1, evidence: 'Dùng PostgreSQL cho dự án' },
      ],
      CV,
    );
    expect(result.breakdown).toEqual([
      {
        requirementId: 'nest',
        match: 1,
        evidence: '3 năm phát triển REST API bằng NestJS',
        rejectedEvidence: null,
      },
      {
        requirementId: 'pg',
        match: 0.5,
        evidence: 'Dùng PostgreSQL cho dự án',
        rejectedEvidence: null,
      },
      { requirementId: 'docker', match: 0, evidence: null, rejectedEvidence: null },
    ]);
    expect(result.score).toBe(67);
    expect(result.flags).toEqual([]);
  });

  it('rejects evidence that is not in the CV and flags it (BR-AI-03)', () => {
    const result = scoreApplication(
      [req('nest', ['nestjs'])],
      [{ name: 'NestJS', years: 5, evidence: '5 năm làm NestJS ở Google' }],
      CV,
    );
    expect(result.breakdown[0]).toMatchObject({
      match: 0,
      evidence: null,
      rejectedEvidence: '5 năm làm NestJS ở Google',
    });
    expect(result.flags).toEqual([ScoreFlag.UnverifiedEvidence, ScoreFlag.MissingMust]);
  });

  it('accepts evidence that differs only in case, spaces and Unicode form', () => {
    const result = scoreApplication(
      [req('nest', ['nestjs'])],
      [{ name: 'nestjs', years: 3, evidence: 'PHÁT TRIỂN   rest api'.normalize('NFD') }],
      CV,
    );
    expect(result.breakdown[0].match).toBe(1);
  });

  it('prefers a verified skill over an invented one for the same requirement', () => {
    const result = scoreApplication(
      [req('pg', ['postgres', 'postgresql'])],
      [
        { name: 'Postgres', years: 10, evidence: 'không có trong CV' },
        { name: 'PostgreSQL', years: 2, evidence: 'Dùng PostgreSQL' },
      ],
      CV,
    );
    expect(result.breakdown[0]).toMatchObject({ match: 1, evidence: 'Dùng PostgreSQL' });
    expect(result.flags).toEqual([]);
  });

  it('matches keywords on word boundaries and ignores Vietnamese marks', () => {
    const result = scoreApplication(
      [req('java', ['java']), req('ketoan', ['ke toan'])],
      [
        { name: 'JavaScript', years: 3, evidence: 'Git' },
        { name: 'Kế toán tổng hợp', years: 2, evidence: 'Docker' },
      ],
      CV,
    );
    expect(result.breakdown.map((b) => b.match)).toEqual([0, 1]);
  });

  it('flags MISSING_MUST only for MUST requirements (BR-AI-04)', () => {
    const nice = scoreApplication([req('x', ['rust'], { type: 'NICE' })], [], CV);
    expect(nice.flags).toEqual([]);
    const must = scoreApplication([req('x', ['rust'])], [], CV);
    expect(must.flags).toEqual([ScoreFlag.MissingMust]);
    expect(must.score).toBe(0);
  });

  it('treats a skill without years as not meeting minYears', () => {
    const result = scoreApplication(
      [req('docker', ['docker'], { minYears: 1 })],
      [{ name: 'Docker', years: null, evidence: 'Docker, Git' }],
      CV,
    );
    expect(result.breakdown[0].match).toBe(0.5);
  });
});

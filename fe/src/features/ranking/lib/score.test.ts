import { computeScore, rankByWeights } from './score'

/**
 * Bộ ca kiểm thử dùng chung với BE (be/src/modules/ai/scoring.spec.ts) –
 * cùng input phải ra cùng điểm, để FE và BE không lệch nhau.
 */
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
      score: 67, // 100 × (3 + 1) / 6 = 66.67
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
  ]

describe('computeScore', () => {
  it.each(SHARED_CASES)('$name → $score', ({ items, score }) => {
    expect(computeScore(items)).toBe(score)
  })
})

describe('rankByWeights', () => {
  const candidates = [
    { id: 'a', name: 'An', matches: { nest: 1, docker: 0 } },
    { id: 'b', name: 'Bình', matches: { nest: 0.5, docker: 1 } },
  ]

  it('changes the ranking when weights change', () => {
    const nestHeavy = rankByWeights(candidates, { nest: 3, docker: 1 })
    expect(nestHeavy.map((r) => [r.item.id, r.score, r.rank])).toEqual([
      ['a', 75, 1],
      ['b', 63, 2],
    ])

    const dockerHeavy = rankByWeights(candidates, { nest: 1, docker: 3 })
    expect(dockerHeavy.map((r) => r.item.id)).toEqual(['b', 'a'])
  })

  it('breaks ties by name', () => {
    const tie = rankByWeights(
      [
        { id: 'x', name: 'Yến', matches: { nest: 1 } },
        { id: 'y', name: 'An', matches: { nest: 1 } },
      ],
      { nest: 2 },
    )
    expect(tie.map((r) => r.item.name)).toEqual(['An', 'Yến'])
  })
})

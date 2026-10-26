import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { Requirement } from '@/features/jobs'
import type { Ranked } from '../lib/score'
import type { RankingInput } from '../types'
import { RankingTable, VIRTUALIZE_FROM } from './RankingTable'

const requirements = [
  { id: 'r1', label: 'NestJS', type: 'MUST', weight: 3, minYears: null, keywords: ['nestjs'] },
] as Requirement[]

const makeRows = (count: number): Ranked<RankingInput>[] =>
  Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    score: 100 - (i % 100),
    item: {
      id: `a${i}`,
      name: `Ứng viên ${i}`,
      matches: { r1: 1 },
      item: {
        applicationId: `a${i}`,
        candidateName: `Ứng viên ${i}`,
        status: 'NEW',
        aiStatus: 'DONE',
        flags: [],
        matches: [{ requirementId: 'r1', match: 1 }],
      },
    },
  }))

function renderTable(count: number) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <RankingTable rows={makeRows(count)} requirements={requirements} savedRank={new Map()} />
      ),
    },
  ])
  const { container } = render(<RouterProvider router={router} />)
  return container.querySelectorAll('tbody tr:not([aria-hidden])').length
}

// FE Architecture 9.1 · US-05
describe('RankingTable', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(53)
  })

  afterEach(() => vi.restoreAllMocks())

  it(`render đủ mọi dòng khi bảng không quá ${VIRTUALIZE_FROM} dòng`, () => {
    expect(renderTable(VIRTUALIZE_FROM)).toBe(VIRTUALIZE_FROM)
  })

  it(`chỉ render phần nhìn thấy khi bảng trên ${VIRTUALIZE_FROM} dòng`, () => {
    const rendered = renderTable(1107)
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(60)
  })
})

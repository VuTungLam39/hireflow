import { render, screen } from '@testing-library/react'
import type { ApplicationDetail } from '../types'
import { ScorePanel } from './ReviewPanels'

const base = {
  id: 'app-1',
  aiStatus: 'PENDING',
  aiError: null,
  breakdown: [],
  requirements: [],
  scoredJdVersion: null,
  score: null,
  flags: [],
  job: { id: 'job-1', title: 'Backend', jdVersion: 1, departmentId: 'dep-1' },
  cv: null,
} as unknown as ApplicationDetail

const renderPanel = (app: ApplicationDetail) =>
  render(<ScorePanel app={app} activeId={null} locatable={new Set()} onSelect={() => {}} />)

// MVP 3 · US-25, BR-AI-11
describe('ScorePanel', () => {
  it('says the CV waits for tomorrow’s quota instead of "reading"', () => {
    renderPanel({ ...base, aiWaitingUntil: '2026-11-18T17:00:00.000Z' })
    expect(screen.getByText('Đang chờ lượt đọc CV của ngày mai')).toBeInTheDocument()
    expect(screen.getByText(/sau 0 giờ ngày 19\/11\/2026/)).toBeInTheDocument()
    expect(screen.queryByText('Đang đọc CV')).not.toBeInTheDocument()
  })

  it('keeps the usual reading state otherwise', () => {
    renderPanel({ ...base, aiWaitingUntil: null })
    expect(screen.getByText('Đang đọc CV')).toBeInTheDocument()
  })
})

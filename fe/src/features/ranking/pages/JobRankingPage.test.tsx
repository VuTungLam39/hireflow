import { fireEvent, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { links, paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { authHandlers } from '@/test/msw/handlers/auth'
import { jobHandlers } from '@/test/msw/handlers/jobs'
import { renderRoutes, signInAs } from '@/test/render'
import { useRankingDraft } from '../store'
import JobRankingPage from './JobRankingPage'

const server = setupServer(...authHandlers, ...jobHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const job = db.jobs.find((j) => j.departmentId === 'dep-eng' && j.requirements.length > 0)!

function renderAs(email: string) {
  signInAs(email)
  useRankingDraft.getState().reset(job.id)
  renderRoutes([{ path: paths.jobRanking, element: <JobRankingPage /> }], links.jobRanking(job.id))
}

// US-05 · BR-AI-05
describe('JobRankingPage', () => {
  it('lets HR save the new weights', async () => {
    renderAs('hr@hireflow.dev')
    const slider = await screen.findByLabelText(job.requirements[0].label)
    fireEvent.change(slider, { target: { value: job.requirements[0].weight === 3 ? 1 : 3 } })

    expect(screen.getByRole('button', { name: 'Lưu trọng số' })).toBeEnabled()
  })

  it('lets a Hiring Manager try weights and reset them, without a save button', async () => {
    renderAs('hm.eng@hireflow.dev')
    const slider = await screen.findByLabelText(job.requirements[0].label)
    fireEvent.change(slider, { target: { value: job.requirements[0].weight === 3 ? 1 : 3 } })

    expect(screen.queryByRole('button', { name: 'Lưu trọng số' })).not.toBeInTheDocument()
    expect(screen.getByText('Chỉ là bản nháp để xem thử, không lưu.')).toBeInTheDocument()
    const reset = screen.getByRole('button', { name: 'Về mặc định' })
    expect(reset).toBeEnabled()
    fireEvent.click(reset)
    expect(reset).toBeDisabled()
  })
})

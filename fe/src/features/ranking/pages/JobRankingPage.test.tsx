import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { links, paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { authHandlers } from '@/test/msw/handlers/auth'
import { jobHandlers } from '@/test/msw/handlers/jobs'
import { tokenFor, toUser } from '@/test/msw/http'
import { useRankingDraft } from '../store'
import JobRankingPage from './JobRankingPage'

const server = setupServer(...authHandlers, ...jobHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const job = db.jobs.find((j) => j.departmentId === 'dep-eng' && j.requirements.length > 0)!

function renderAs(email: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  useRankingDraft.getState().reset(job.id)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: paths.jobRanking, element: <JobRankingPage /> }], {
    initialEntries: [links.jobRanking(job.id)],
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
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
    const reset = screen.getByRole('button', { name: 'Đặt lại' })
    expect(reset).toBeEnabled()
    fireEvent.click(reset)
    expect(reset).toBeDisabled()
  })
})

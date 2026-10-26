import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { links, paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { applicationHandlers } from '@/test/msw/handlers/applications'
import { authHandlers } from '@/test/msw/handlers/auth'
import { matchesOf, matchingHandlers } from '@/test/msw/handlers/matching'
import { tokenFor, toUser } from '@/test/msw/http'
import JobMatchesPage from './JobMatchesPage'

const server = setupServer(...authHandlers, ...matchingHandlers, ...applicationHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const byStatus = (status: string) =>
  db.jobs.find(
    (j) =>
      j.status === status &&
      j.requirements.length > 0 &&
      (status === 'DRAFT' || matchesOf(j).length > 0),
  )!

function renderAs(email: string, jobId: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: paths.jobMatches, element: <JobMatchesPage /> },
      { path: paths.applicationDetail, element: <p>Chi tiết hồ sơ</p> },
    ],
    { initialEntries: [links.jobMatches(jobId)] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// US-10 · F-MATCH-01, F-MATCH-02 · BR-MATCH-02, 03
describe('JobMatchesPage', () => {
  it('BR-MATCH-02: shows past candidates scoring at least 50 with their reasons, and HR invites one', async () => {
    renderAs('hr@hireflow.dev', byStatus('OPEN').id)
    const buttons = await screen.findAllByRole('button', { name: 'Mời vào tin' })
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons.length).toBeLessThanOrEqual(10)

    const scores = screen
      .getAllByText(/^\d+$/)
      .map((el) => Number(el.textContent))
      .filter((n) => n <= 100)
    expect(scores.every((s) => s >= 50)).toBe(true)

    const card = buttons[0].closest('.rounded-xl') as HTMLElement
    fireEvent.click(buttons[0])
    expect(await within(card).findByText('Đã mời')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Xem hồ sơ →' })).toBeInTheDocument()
  })

  it('asks to publish a draft job first', async () => {
    renderAs('hr@hireflow.dev', byStatus('DRAFT').id)
    expect(await screen.findByText('Tin chưa được đăng')).toBeInTheDocument()
  })

  it('BR-MATCH-03: a closed job shows suggestions but cannot invite', async () => {
    renderAs('hr@hireflow.dev', byStatus('CLOSED').id)
    const buttons = await screen.findAllByRole('button', { name: 'Mời vào tin' })
    for (const button of buttons) expect(button).toBeDisabled()
  })
})

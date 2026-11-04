import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import ApplicationsPage from '@/features/applications/pages/ApplicationsPage'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

// BR-INT-03
describe('applications seen by an interviewer', () => {
  it('shows “Phiếu của bạn” instead of the score, flagging the interview that still needs feedback', async () => {
    const me = db.users.find((u) => u.email === 'interviewer@hireflow.dev')!
    useAuthStore.getState().setSession(toUser(me), tokenFor(me))
    const iv = db.interviews.find((i) => i.interviewerIds.includes(me.id))!
    const name = db.candidates.find(
      (c) => c.id === db.applications.find((a) => a.id === iv.applicationId)!.candidateId,
    )!.fullName

    const router = createMemoryRouter(
      [{ path: paths.applications, element: <ApplicationsPage /> }],
      { initialEntries: [paths.applications] },
    )
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('columnheader', { name: 'Phiếu của bạn' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /Mức phù hợp/ })).not.toBeInTheDocument()
    const row = (await screen.findAllByText(name))[0].closest('tr')!
    expect(
      await within(row).findByText('Cần gửi phiếu', undefined, { timeout: 4000 }),
    ).toBeInTheDocument()
  })
})

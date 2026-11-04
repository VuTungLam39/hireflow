import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { QuickSearch } from '@/app/layouts/QuickSearch'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(...allHandlers)
const requests: string[] = []
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
  server.events.on('request:start', ({ request }) => {
    requests.push(new URL(request.url).pathname)
  })
})
afterAll(() => server.close())
afterEach(() => {
  requests.length = 0
  act(() => useUiStore.getState().setCommandOpen(false))
})

function openAs(email: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  const router = createMemoryRouter([{ path: '/', element: <QuickSearch /> }])
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  act(() => useUiStore.getState().setCommandOpen(true))
  return router
}

const assignedTo = (userId: string) => {
  const iv = db.interviews.find((i) => i.interviewerIds.includes(userId))!
  const app = db.applications.find((a) => a.id === iv.applicationId)!
  return { app, name: db.candidates.find((c) => c.id === app.candidateId)!.fullName }
}

describe('quick search', () => {
  it('an interviewer searches their assigned applications, never the candidate pool', async () => {
    const me = db.users.find((u) => u.email === 'interviewer@hireflow.dev')!
    const { app, name } = assignedTo(me.id)
    const router = openAs(me.email)

    const input = await screen.findByPlaceholderText(/^Tìm hồ sơ theo tên ứng viên/)
    fireEvent.change(input, { target: { value: name.split(' ').at(-1) } })
    fireEvent.click(
      await screen.findByRole('option', { name: new RegExp(name) }, { timeout: 4000 }),
    )

    expect(router.state.location.search).toContain(`xem=application%3A${app.id}`)
    expect(requests).toContain('/api/v1/applications')
    expect(requests).not.toContain('/api/v1/candidates')
  })

  it('HR still searches the candidate pool and opens the candidate popup', async () => {
    cleanup()
    const candidate = db.candidates[0]
    const router = openAs('hr@hireflow.dev')

    const input = await screen.findByPlaceholderText(/^Tìm ứng viên theo tên ứng viên/)
    fireEvent.change(input, { target: { value: candidate.email } })
    fireEvent.click(
      await screen.findByRole(
        'option',
        { name: new RegExp(candidate.fullName) },
        { timeout: 4000 },
      ),
    )
    expect(router.state.location.search).toContain(`xem=candidate%3A${candidate.id}`)
  })
})

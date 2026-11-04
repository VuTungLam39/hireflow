import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

function renderAs(email: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  const router = createMemoryRouter([{ path: paths.home, element: <DashboardPage /> }], {
    initialEntries: [paths.home],
  })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// F-DASH-01
describe('dashboard', () => {
  it('the new-application to-dos add up to the number in the heading', async () => {
    const fresh = db.applications.filter((a) => a.status === 'NEW')
    const high = fresh.filter((a) => (a.score ?? -1) >= 70)
    const missing = fresh.filter((a) => a.flags.includes('MISSING_MUST'))
    const other = fresh.filter((a) => !high.includes(a) && !missing.includes(a))
    expect(other.length).toBeGreaterThan(0)

    renderAs('hr@hireflow.dev')
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: `${fresh.length} hồ sơ chờ bạn xem` },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(`${other.length} hồ sơ mới khác chờ xem`, undefined, {
        timeout: 4000,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/lỗi hoặc kẹt ở bước xử lý CV/)).not.toBeInTheDocument()
  })

  it('an admin gets the stuck or failed CV processing queue as a to-do', async () => {
    cleanup()
    const failed = db.applications.filter((a) => a.aiStatus === 'FAILED').length
    expect(failed).toBeGreaterThan(0)

    renderAs('admin@hireflow.dev')
    const todo = await screen.findByText(/hồ sơ lỗi hoặc kẹt ở bước xử lý CV/, undefined, {
      timeout: 4000,
    })
    expect(Number(todo.textContent!.split(' ')[0])).toBeGreaterThanOrEqual(failed)
    expect(todo.closest('li')!.querySelector('a')).toHaveAttribute('href', paths.aiQueue)
    expect(screen.queryByText(/CV không đọc được$/)).not.toBeInTheDocument()
  })
})

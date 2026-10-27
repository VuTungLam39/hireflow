import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { useRealtimeStore } from '@/stores/realtime.store'
import { db } from '@/test/msw/data'
import { notificationHandlers } from '@/test/msw/handlers/notifications'
import { tokenFor, toUser } from '@/test/msw/http'
import { NotificationBell } from './NotificationBell'

const server = setupServer(...notificationHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

function renderAs(email: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  const unread = db.notifications.filter((n) => n.userId === row.id && !n.readAt).length
  useRealtimeStore.getState().setUnreadCount(unread)
  const router = createMemoryRouter(
    [
      { path: '/', element: <NotificationBell /> },
      { path: paths.applicationDetail, element: <p>Trang chi tiết hồ sơ</p> },
    ],
    { initialEntries: ['/'] },
  )
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { row, unread }
}

// F-NOTI-01 · US-12
describe('NotificationBell', () => {
  it('US-12: shows the unread count, lists notifications and marks them all as read', async () => {
    const { unread } = renderAs('hr@hireflow.dev')
    expect(unread).toBeGreaterThan(0)
    const bell = screen.getByRole('button', { name: `Thông báo, ${unread} chưa đọc` })

    fireEvent.click(bell)
    const panel = await screen.findByRole('dialog', { name: 'Thông báo' })
    expect(
      (await within(panel).findAllByText(/CV của .* đã chấm xong|Chấm CV của/)).length,
    ).toBeGreaterThan(0)
    expect(within(panel).getAllByLabelText('Chưa đọc')).toHaveLength(unread)

    fireEvent.click(within(panel).getByRole('button', { name: /Đã đọc hết/ }))
    expect(await screen.findByRole('button', { name: 'Thông báo' })).toBeInTheDocument()
    await vi.waitFor(() => expect(within(panel).queryAllByLabelText('Chưa đọc')).toHaveLength(0))
  })

  it('opening a notification marks it read and goes to the application', async () => {
    const { row } = renderAs('hm.eng@hireflow.dev')
    const target = db.notifications.find((n) => n.userId === row.id)!
    target.readAt = null

    fireEvent.click(screen.getByRole('button', { name: /^Thông báo/ }))
    const panel = await screen.findByRole('dialog', { name: 'Thông báo' })
    const items = await within(panel).findAllByRole('button', { name: /CV của|Chấm CV của/ })
    fireEvent.click(items[0])

    expect(await screen.findByText('Trang chi tiết hồ sơ')).toBeInTheDocument()
    await vi.waitFor(() => expect(target.readAt).not.toBeNull())
  })
})

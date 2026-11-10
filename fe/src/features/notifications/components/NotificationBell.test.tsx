import { fireEvent, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { useRealtimeStore } from '@/stores/realtime.store'
import { db } from '@/test/msw/data'
import { notificationHandlers } from '@/test/msw/handlers/notifications'
import { renderRoutes, signInAs } from '@/test/render'
import { NotificationBell } from './NotificationBell'

const server = setupServer(...notificationHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

function renderAs(email: string) {
  const row = signInAs(email)
  const unread = db.notifications.filter((n) => n.userId === row.id && !n.readAt).length
  useRealtimeStore.getState().setUnreadCount(unread)
  const { router } = renderRoutes([{ path: '/', element: <NotificationBell /> }], '/')
  return { row, unread, router }
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
      (await within(panel).findAllByText(/đã được chấm|Không đọc được CV của/)).length,
    ).toBeGreaterThan(0)
    expect(within(panel).getAllByLabelText('Chưa đọc')).toHaveLength(unread)

    fireEvent.click(within(panel).getByRole('button', { name: /Đã đọc hết/ }))
    expect(await screen.findByRole('button', { name: 'Thông báo' })).toBeInTheDocument()
    await vi.waitFor(() => expect(within(panel).queryAllByLabelText('Chưa đọc')).toHaveLength(0))
  })

  it('opening a notification marks it read and opens the application popup on the same page', async () => {
    const { row, router } = renderAs('hm.eng@hireflow.dev')
    const target = db.notifications.find((n) => n.userId === row.id)!
    target.readAt = null

    fireEvent.click(screen.getByRole('button', { name: /^Thông báo/ }))
    const panel = await screen.findByRole('dialog', { name: 'Thông báo' })
    const items = await within(panel).findAllByRole('button', {
      name: /đã được chấm|Không đọc được CV của/,
    })
    fireEvent.click(items[0])

    await vi.waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).get('xem')).toBe(
        `application:${target.applicationId}`,
      ),
    )
    expect(router.state.location.pathname).toBe('/')
    await vi.waitFor(() => expect(target.readAt).not.toBeNull())
  })
})

import { act, fireEvent, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { AppShell } from '@/app/layouts/AppShell'
import { useUiStore } from '@/stores/ui.store'
import { allHandlers } from '@/test/msw/handlers'
import { renderRouteAs } from '@/test/render'

vi.mock('@/features/notifications/lib/realtime-connection', () => ({
  connectRealtime: () => () => {},
}))

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => act(() => useUiStore.getState().setCommandOpen(false)))

const routes = [
  {
    Component: AppShell,
    children: [
      { path: '/', element: <h1>Hôm nay</h1> },
      { path: '/applications/*', element: <h1>Hồ sơ</h1> },
    ],
  },
]

const navLabels = () =>
  within(screen.getByRole('navigation', { name: 'Điều hướng chính' }))
    .getAllByRole('link')
    .map((a) => a.textContent?.replace(/\d[\d.]*$/, '').trim())

describe('AppShell', () => {
  it('puts the skip link first, targeting <main id="main">', () => {
    renderRouteAs('admin@hireflow.dev', routes, '/')
    const skip = screen.getByRole('link', { name: 'Bỏ qua tới nội dung' })
    expect(skip).toHaveAttribute('href', '#main')
    expect(document.body.querySelector('a, button')).toBe(skip)
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })

  it.each([
    ['admin@hireflow.dev', ['Hồ sơ công ty', 'Người dùng', 'Nhật ký kiểm toán'], []],
    ['hr@hireflow.dev', ['Kho ứng viên', 'Hồ sơ ứng tuyển'], ['Người dùng', 'Công ty']],
    ['interviewer@hireflow.dev', ['Hồ sơ ứng tuyển'], ['Kho ứng viên', 'Người dùng']],
  ])('filters the rail by permission for %s', (email, shown, hidden) => {
    renderRouteAs(email, routes, '/')
    const labels = navLabels()
    for (const label of shown) expect(labels).toContain(label)
    for (const label of hidden) expect(labels).not.toContain(label)
  })

  it('marks the longest-matching item as the current page on nested routes', () => {
    renderRouteAs('hr@hireflow.dev', routes, '/applications/abc')
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    const current = within(nav)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'page')
    expect(current.map((a) => a.textContent)).toEqual(['Hồ sơ ứng tuyển'])
  })

  it('opens quick search with Ctrl+K', () => {
    renderRouteAs('hr@hireflow.dev', routes, '/')
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(useUiStore.getState().commandOpen).toBe(true)
  })
})

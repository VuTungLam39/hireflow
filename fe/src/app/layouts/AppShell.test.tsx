import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { AppShell } from '@/app/layouts/AppShell'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { RAIL_COMPACT } from '@/app/layouts/Rail'
import { useUiStore } from '@/stores/ui.store'
import { allHandlers } from '@/test/msw/handlers'
import { renderRouteAs, renderRoutes } from '@/test/render'

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
  // WCAG 2.4.2
  it('names the tab after the current page', async () => {
    const { router } = renderRouteAs('admin@hireflow.dev', routes, '/')
    await waitFor(() => expect(document.title).toBe('Hôm nay – HireFlow'))
    await act(() => router.navigate('/applications'))
    expect(document.title).toBe('Hồ sơ ứng tuyển – HireFlow')
  })

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

  // M-03
  it('opens quick search without animation', async () => {
    renderRouteAs('hr@hireflow.dev', routes, '/')
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const palette = await screen.findByRole('dialog', { name: 'Tìm nhanh' })
    expect(palette.className).not.toContain('animate-')
    expect(palette.previousElementSibling!.className).not.toContain('animate-')
    act(() => useUiStore.getState().setCommandOpen(false))
  })

  describe('compact rail (<600 px)', () => {
    const original = window.matchMedia
    beforeEach(() => {
      window.matchMedia = ((query: string) => ({
        matches: query === RAIL_COMPACT,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia
    })
    afterEach(() => {
      window.matchMedia = original
      act(() => useUiStore.getState().setSidebarOpen(false))
    })

    it('hides the rail behind the menu button and opens it in a NavSheet that returns focus', async () => {
      renderRouteAs('hr@hireflow.dev', routes, '/')
      expect(screen.queryByRole('navigation', { name: 'Điều hướng chính' })).toBeNull()
      const menu = screen.getByRole('button', { name: 'Mở menu' })
      menu.focus()
      fireEvent.click(menu)

      const sheet = await screen.findByRole('dialog', { name: 'Menu' })
      expect(
        within(sheet).getByRole('navigation', { name: 'Điều hướng chính' }),
      ).toBeInTheDocument()
      fireEvent.keyDown(sheet, { key: 'Escape' })
      expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull()
      await waitFor(() => expect(menu).toHaveFocus())
    })

    it('closes the NavSheet after choosing a destination', async () => {
      const { router } = renderRouteAs('hr@hireflow.dev', routes, '/')
      fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
      const sheet = await screen.findByRole('dialog', { name: 'Menu' })
      fireEvent.click(within(sheet).getByRole('link', { name: 'Hồ sơ ứng tuyển' }))
      expect(router.state.location.pathname).toBe('/applications')
      expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull()
    })
  })

  it('labels breadcrumbs as "Đường dẫn" with the last item as the current page', () => {
    renderRouteAs('hr@hireflow.dev', routes, '/applications')
    const crumbs = screen.getByRole('navigation', { name: 'Đường dẫn' })
    expect(within(crumbs).getByText('Hồ sơ ứng tuyển')).toHaveAttribute('aria-current', 'page')
  })
})

// F-17
describe('AuthLayout', () => {
  it('leaves the only h1 to the page', () => {
    renderRoutes(
      [{ Component: AuthLayout, children: [{ path: '/', element: <h1>Đăng nhập</h1> }] }],
      '/',
    )
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      'Đăng nhập',
    ])
  })
})

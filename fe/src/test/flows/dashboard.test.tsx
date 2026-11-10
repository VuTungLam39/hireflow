import { cleanup, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import { paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { renderRouteAs } from '@/test/render'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

function renderAs(email: string) {
  renderRouteAs(email, [{ path: paths.home, element: <DashboardPage /> }], paths.home)
}

// F-DASH-01
describe('dashboard', () => {
  it('the new-application to-dos add up to the number in the heading', async () => {
    const overlap = db.applications.find(
      (a) => a.status === 'NEW' && (a.score ?? -1) >= 70 && !a.flags.includes('MISSING_MUST'),
    )!
    const savedFlags = overlap.flags
    overlap.flags = [...savedFlags, 'MISSING_MUST']
    onTestFinished(() => {
      overlap.flags = savedFlags
    })
    const fresh = db.applications.filter((a) => a.status === 'NEW')
    const high = fresh.filter((a) => (a.score ?? -1) >= 70)
    const missing = fresh.filter(
      (a) => a.score !== null && a.score < 70 && a.flags.includes('MISSING_MUST'),
    )
    const other = fresh.filter((a) => !high.includes(a) && !missing.includes(a))
    expect(other.length).toBeGreaterThan(0)
    expect(high.length + missing.length + other.length).toBe(fresh.length)

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
    const shown = (re: RegExp) => {
      const el = screen.queryByText(re)
      return el ? Number(el.textContent!.split(' ')[0]) : 0
    }
    expect(
      shown(/hồ sơ mới từ 70 điểm chưa xem$/) +
        shown(/hồ sơ mới thiếu tiêu chí bắt buộc$/) +
        shown(/hồ sơ mới khác chờ xem$/),
    ).toBe(fresh.length)
    const missingTodo = screen.queryByText(/hồ sơ mới thiếu tiêu chí bắt buộc$/)
    if (missingTodo) {
      expect(missingTodo.closest('a')!.getAttribute('href')).toContain('scoreMax=69')
    }
    expect(
      screen
        .getByText(/hồ sơ mới khác chờ xem$/)
        .closest('a')!
        .getAttribute('href'),
    ).toBe('/applications?status=NEW&bucket=other')
    const decide = screen.queryByText(/chờ quyết định$/)
    if (decide) {
      expect(decide.closest('a')!.getAttribute('href')).toBe('/interviews?pending=decision')
    }
    expect(screen.queryByText(/lỗi hoặc kẹt ở bước xử lý CV/)).not.toBeInTheDocument()
  })

  it('the weekly KPI opens only applications submitted since Monday (Vietnam time)', async () => {
    cleanup()
    renderAs('hr@hireflow.dev')
    const kpi = await screen.findByText('Hồ sơ tuần này', undefined, { timeout: 4000 })
    const href = kpi.closest('a')!.getAttribute('href')!
    expect(href).toMatch(/^\/applications\?createdFrom=\d{4}-\d{2}-\d{2}$/)
    const monday = new Date(`${href.slice(-10)}T00:00:00+07:00`)
    expect(
      new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(
        monday,
      ),
    ).toBe('Mon')
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

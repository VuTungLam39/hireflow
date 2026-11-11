import { fireEvent, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { isoDayToVnText, shiftIsoDay, todayIsoDay } from '@/lib/vn-day'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { api } from '@/test/msw/http'
import { renderRouteAs } from '@/test/render'
import { FunnelReport } from './FunnelReport'

const server = setupServer(...allHandlers)
const funnelUrls: URL[] = []
server.events.on('request:start', ({ request }) => {
  if (request.url.includes('/dashboard/funnel')) funnelUrls.push(new URL(request.url))
})
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  funnelUrls.length = 0
})
afterAll(() => server.close())

const renderAs = (email: string, element = <FunnelReport />) =>
  renderRouteAs(email, [{ path: '/', element }], '/')

const stageRow = async (label: string) => {
  const list = await screen.findByRole('list', {}, { timeout: 4000 })
  return within(list)
    .getAllByRole('listitem')
    .find((li) => li.textContent!.startsWith(label))!
}

const emptyView = {
  range: { from: '2026-08-14', to: '2026-11-11' },
  generatedAt: new Date().toISOString(),
  cohort: 0,
  stages: [],
  bySource: [],
  reopened: 0,
}

// F1 · BR-REP-01
describe('FunnelReport', () => {
  it('shows every pipeline step with counts for the last 90 days by default', async () => {
    const to = todayIsoDay()
    const from = shiftIsoDay(to, -89)
    const start = Date.parse(`${from}T00:00:00+07:00`)
    const cohort = db.applications.filter((a) => Date.parse(a.createdAt) >= start).length
    expect(cohort).toBeGreaterThan(0)

    renderAs('hr@hireflow.dev')

    expect(await screen.findByRole('heading', { level: 2, name: 'Phễu tuyển dụng' })).toBeVisible()
    expect(
      screen.getByText(
        new RegExp(`Hồ sơ nộp từ ${isoDayToVnText(from)} đến ${isoDayToVnText(to)}`),
      ),
    ).toBeInTheDocument()
    const first = await stageRow('Mới')
    expect(first).toHaveTextContent(`Mới${cohort.toLocaleString('vi-VN')}`)
    expect(first).toHaveTextContent('Mọi hồ sơ đã nộp')
    for (const label of ['Sàng lọc', 'Phỏng vấn', 'Đề nghị', 'Đã nhận']) {
      expect(await stageRow(label)).toHaveTextContent(/từ bước trước/)
    }
    expect(funnelUrls[0].searchParams.get('from')).toBe(from)
    expect(funnelUrls[0].searchParams.get('jobId')).toBeNull()
  })

  it('reloads for the chosen range', async () => {
    renderAs('hr@hireflow.dev')
    await stageRow('Mới')
    fireEvent.click(screen.getByRole('radio', { name: '30 ngày' }))

    const from = shiftIsoDay(todayIsoDay(), -29)
    expect(
      await screen.findByText(new RegExp(`Hồ sơ nộp từ ${isoDayToVnText(from)}`)),
    ).toBeInTheDocument()
    expect(funnelUrls.at(-1)!.searchParams.get('from')).toBe(from)
  })

  it('explains an empty range instead of showing zeros', async () => {
    server.use(
      http.get(api('/dashboard/funnel'), () =>
        HttpResponse.json({ success: true, data: emptyView }),
      ),
    )
    renderAs('hr@hireflow.dev')
    expect(
      await screen.findByText('Chưa có hồ sơ nộp trong khoảng này', undefined, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('says what failed and offers a retry', async () => {
    server.use(
      http.get(api('/dashboard/funnel'), () =>
        HttpResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    )
    renderAs('hr@hireflow.dev')
    expect(
      await screen.findByText('Chưa tải được phễu tuyển dụng', undefined, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument()
  })

  it('scopes to one job with a fixed start and no range picker', async () => {
    const job = db.jobs.find((j) => j.status === 'OPEN')!
    const since = shiftIsoDay(todayIsoDay(), -200)
    renderAs('hr@hireflow.dev', <FunnelReport jobId={job.id} since={since} headingLevel="h3" />)

    expect(await screen.findByRole('heading', { level: 3, name: 'Phễu tuyển dụng' })).toBeVisible()
    expect(screen.queryByRole('radiogroup', { name: 'Khoảng thời gian' })).not.toBeInTheDocument()
    await stageRow('Mới')
    expect(funnelUrls[0].searchParams.get('jobId')).toBe(job.id)
    expect(funnelUrls[0].searchParams.get('from')).toBe(since)
  })
})

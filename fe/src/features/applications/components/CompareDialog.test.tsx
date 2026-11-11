import { fireEvent, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { api } from '@/test/msw/http'
import { renderRouteAs } from '@/test/render'
import { CompareDialog } from './CompareDialog'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllGlobals()
})
afterAll(() => server.close())

const job = db.jobs.find(
  (j) =>
    j.requirements.length > 1 &&
    db.applications.filter((a) => a.jobId === j.id && a.breakdown.length > 0).length >= 2,
)!
const [a, b] = db.applications.filter((x) => x.jobId === job.id && x.breakdown.length > 0)
const nameOf = (id: string) =>
  db.candidates.find((c) => c.id === db.applications.find((x) => x.id === id)!.candidateId)!
    .fullName

const wideScreen = (wide: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: wide,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))

const open = (ids = [a.id, b.id]) =>
  renderRouteAs(
    'hr@hireflow.dev',
    [{ path: '/', element: <CompareDialog open jobId={job.id} ids={ids} onClose={() => {}} /> }],
    '/',
  )

// F3 · BR-APP-13
describe('CompareDialog', () => {
  it('puts the candidates side by side, one row per criterion of the current JD', async () => {
    wideScreen(true)
    open()

    const dialog = await screen.findByRole('dialog', { name: 'So sánh 2 ứng viên' })
    const table = await within(dialog).findByRole('table', {}, { timeout: 4000 })
    const heads = within(table).getAllByRole('columnheader')
    expect(heads.map((h) => h.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Tiêu chí'),
        expect.stringContaining(nameOf(a.id)),
        expect.stringContaining(nameOf(b.id)),
      ]),
    )
    for (const req of job.requirements) {
      expect(within(table).getByRole('rowheader', { name: new RegExp(req.label) })).toBeVisible()
    }
    expect(within(table).getByRole('rowheader', { name: 'Phỏng vấn' })).toBeVisible()
    expect(within(table).getAllByRole('link', { name: 'Mở bàn duyệt CV' })).toHaveLength(2)
    expect(
      within(dialog).getByText(
        'Tính tự động từ CV theo tiêu chí của tin – bạn là người quyết định.',
      ),
    ).toBeInTheDocument()
  })

  it('warns about stale scores, unscored criteria and shows interview averages', async () => {
    wideScreen(true)
    server.use(
      http.get(api('/jobs/:jobId/applications/compare'), () => {
        const reqs = job.requirements
        const app = (id: string, stale: boolean) => ({
          id,
          status: 'INTERVIEW',
          aiStatus: 'DONE',
          score: 72,
          flags: [],
          createdAt: new Date().toISOString(),
          candidate: { id: `c-${id}`, fullName: nameOf(id), email: 'x@example.com' },
          job: { id: job.id, title: job.title },
          source: 'PUBLIC_FORM',
          stale,
          criteria: reqs.map((r, i) => ({
            requirementId: r.id,
            match: i === 0 ? 1 : null,
            evidence: i === 0 ? '3 năm NestJS' : null,
            interviewAvg: i === 0 ? 4.5 : null,
          })),
          interviews: { feedbackCount: 2, avgOverall: 4 },
        })
        return HttpResponse.json({
          success: true,
          data: {
            job: { id: job.id, title: job.title, jdVersion: 2 },
            requirements: reqs,
            applications: [app(a.id, true), app(b.id, false)],
          },
        })
      }),
    )
    open()

    const dialog = await screen.findByRole('dialog', { name: 'So sánh 2 ứng viên' })
    expect(
      await within(dialog).findByText('Chấm theo tiêu chí cũ – chấm lại để so sánh công bằng'),
    ).toBeInTheDocument()
    expect(within(dialog).getAllByText('Chưa chấm theo tiêu chí này').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('Phỏng vấn 4,5/5')).toHaveLength(2)
    expect(within(dialog).getAllByText('2 phiếu · trung bình 4/5')).toHaveLength(2)
  })

  it('switches between candidates with tabs on a narrow screen', async () => {
    wideScreen(false)
    open()

    const dialog = await screen.findByRole('dialog', { name: 'So sánh 2 ứng viên' })
    const second = await within(dialog).findByRole('tab', { name: nameOf(b.id) }, { timeout: 4000 })
    expect(within(dialog).queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(second)
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog).getByRole('link', { name: 'Mở bàn duyệt CV' })).toHaveAttribute(
      'href',
      expect.stringContaining(b.id),
    )
  })

  it('explains a selection from different jobs', async () => {
    wideScreen(true)
    const other = db.applications.find((x) => x.jobId !== job.id)!
    open([a.id, other.id])
    expect(
      await screen.findByText(
        'Chỉ so sánh 2–3 hồ sơ của cùng một tin. Đóng hộp thoại và chọn lại hồ sơ.',
        undefined,
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Thử lại/ })).not.toBeInTheDocument()
  })
})

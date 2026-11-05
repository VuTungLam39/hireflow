import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import ApplicationDetailPage from '@/features/applications/pages/ApplicationDetailPage'
import { PermissionRoute } from '@/routes/guards'
import { links, paths } from '@/routes/paths'
import { Permission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { applicationHandlers } from '@/test/msw/handlers/applications'
import { authHandlers } from '@/test/msw/handlers/auth'
import { interviewHandlers } from '@/test/msw/handlers/interviews'
import { api, tokenFor, toUser } from '@/test/msw/http'
import { toLocalInput } from '@/features/interviews/lib/format'
import InterviewsPage from '@/features/interviews/pages/InterviewsPage'

const server = setupServer(...authHandlers, ...applicationHandlers, ...interviewHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderAt(email: string, entry: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  const router = createMemoryRouter(
    [
      {
        element: (
          <PermissionRoute permission={Permission.DashboardRead} fallbackTo={paths.interviews} />
        ),
        children: [{ path: paths.home, element: <p>Dashboard</p> }],
      },
      { path: paths.interviews, element: <InterviewsPage /> },
      { path: paths.applicationDetail, element: <ApplicationDetailPage /> },
    ],
    { initialEntries: [entry] },
  )
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

const pastInterview = () => db.interviews.find((i) => i.id === 'iv-1')!
const upcoming = () => db.interviews.find((i) => i.id === 'iv-2')!

// F-INT-01 → 03 · US-11 · BR-INT-01 → 03
describe('interviews', () => {
  it('BR-INT-02: an interviewer opening the home page lands on their own interview calendar', async () => {
    renderAt('interviewer@hireflow.dev', paths.home)
    expect(await screen.findByRole('heading', { name: 'Lịch phỏng vấn' })).toBeInTheDocument()
    const app = db.applications.find((a) => a.id === pastInterview().applicationId)!
    const name = db.candidates.find((c) => c.id === app.candidateId)!.fullName
    expect(await screen.findByRole('link', { name })).toBeInTheDocument()
    expect(screen.getByText('Cần gửi phiếu')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('BR-INT-02: an interviewer cannot open an application they are not assigned to', async () => {
    renderAt('interviewer@hireflow.dev', links.applicationDetail(upcoming().applicationId))
    expect(await screen.findByText(/Không tìm thấy|not found/i)).toBeInTheDocument()
  })

  it('BR-INT-03: the assigned interviewer rates every criterion and submits feedback', async () => {
    const iv = pastInterview()
    renderAt('interviewer@hireflow.dev', links.applicationDetail(iv.applicationId))
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi phiếu đánh giá' }))
    expect(screen.getByText(/Mức phù hợp được ẩn để bạn chấm độc lập/)).toBeInTheDocument()
    const dialog = await screen.findByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi phiếu' }))
    expect(
      await within(dialog).findByText('Chấm đủ mọi tiêu chí và phần đánh giá chung.'),
    ).toBeInTheDocument()

    for (const group of within(dialog).getAllByRole('radiogroup')) {
      fireEvent.click(within(group).getByRole('radio', { name: /^4 –/ }))
    }
    fireEvent.change(within(dialog).getByLabelText('Nhận xét (tuỳ chọn)'), {
      target: { value: 'Nắm chắc NestJS' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi phiếu' }))

    expect(await screen.findByRole('button', { name: 'Sửa phiếu đánh giá' })).toBeInTheDocument()
    expect(screen.getByText('Nắm chắc NestJS')).toBeInTheDocument()
    expect(iv.feedbacks).toHaveLength(1)
    expect(iv.status).toBe('COMPLETED')
  })

  it('E5 · BR-INT-04: the assignee gets suggested questions per criterion before the interview starts', async () => {
    const iv = upcoming()
    renderAt('linh.pham@hireflow.dev', links.applicationDetail(iv.applicationId))
    expect(
      await screen.findByText('Phiếu đánh giá mở khi buổi phỏng vấn bắt đầu.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý câu hỏi' }))

    const box = await screen.findByRole('region', { name: 'Câu hỏi gợi ý' })
    const app = db.applications.find((a) => a.id === iv.applicationId)!
    const job = db.jobs.find((j) => j.id === app.jobId)!
    for (const r of job.requirements) {
      expect(within(box).getByText(r.label)).toBeInTheDocument()
      expect(
        within(box).getByText(`Bạn đã dùng ${r.label} trong dự án nào gần nhất?`),
      ).toBeInTheDocument()
    }
    expect(within(box).getByText(/không dựa trên điểm chấm CV/)).toBeInTheDocument()

    fireEvent.click(within(box).getByRole('button', { name: 'Ẩn' }))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Câu hỏi gợi ý' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Gợi ý câu hỏi' })).toBeInTheDocument()
  })

  it('E5 · Danh mục Feature 9.2: HR also gets suggestions for an interview', async () => {
    const iv = upcoming()
    renderAt('hr@hireflow.dev', links.applicationDetail(iv.applicationId))
    fireEvent.click(await screen.findByRole('tab', { name: /Phỏng vấn/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Gợi ý câu hỏi' }))
    expect(await screen.findByRole('region', { name: 'Câu hỏi gợi ý' })).toBeInTheDocument()
  })

  it('E5: when suggestions fail, says so in place and the feedback form still works', async () => {
    server.use(
      http.post(api('/interviews/:id/question-suggestions'), () =>
        HttpResponse.json(
          { success: false, statusCode: 503, code: 'AI_UNAVAILABLE', message: 'AI is unavailable' },
          { status: 503 },
        ),
      ),
    )
    const iv = pastInterview()
    renderAt('interviewer@hireflow.dev', links.applicationDetail(iv.applicationId))
    fireEvent.click(await screen.findByRole('button', { name: 'Gợi ý câu hỏi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Chưa gợi ý được câu hỏi.*Phiếu đánh giá vẫn dùng bình thường/,
    )
    expect(screen.getByRole('button', { name: /phiếu đánh giá/ })).toBeEnabled()
  })

  it('BR-INT-01: HR schedules an interview with an interviewer for an application in INTERVIEW', async () => {
    const app = db.applications.find(
      (a) => a.status === 'INTERVIEW' && !db.interviews.some((i) => i.applicationId === a.id),
    )!
    renderAt('hr@hireflow.dev', links.applicationDetail(app.id))
    fireEvent.click(await screen.findByRole('tab', { name: /Phỏng vấn/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Đặt lịch phỏng vấn' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đặt lịch' }))
    expect(await within(dialog).findByText('Chọn ngày giờ phỏng vấn')).toBeInTheDocument()

    const at = new Date(Date.now() + 3 * 86_400_000).toISOString()
    fireEvent.change(within(dialog).getByLabelText('Ngày giờ'), {
      target: { value: toLocalInput(at) },
    })
    fireEvent.change(within(dialog).getByLabelText('Địa điểm'), { target: { value: 'Phòng 501' } })
    fireEvent.click(await within(dialog).findByRole('checkbox', { name: /Phạm Thùy Linh/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đặt lịch' }))

    expect(await screen.findByText('Phòng 501')).toBeInTheDocument()
    expect(
      db.interviews.some((i) => i.applicationId === app.id && i.interviewerIds.includes('u-iv2')),
    ).toBe(true)
  })

  it('HR cannot schedule while the application is not in INTERVIEW', async () => {
    const app = db.applications.find((a) => a.status === 'SCREENING')!
    renderAt('hr@hireflow.dev', links.applicationDetail(app.id))
    fireEvent.click(await screen.findByRole('tab', { name: /Phỏng vấn/ }))
    expect(await screen.findByRole('button', { name: 'Đặt lịch phỏng vấn' })).toBeDisabled()
    expect(screen.getByText('Chuyển hồ sơ sang “Phỏng vấn” để đặt lịch.')).toBeInTheDocument()
  })

  it('keeps an interview from 3 days ago in “Cần xử lý” until the feedback is sent', async () => {
    const iv = pastInterview()
    const original = { scheduledAt: iv.scheduledAt, feedbacks: iv.feedbacks, status: iv.status }
    Object.assign(iv, {
      scheduledAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      feedbacks: [],
      status: 'SCHEDULED',
    })
    try {
      renderAt('interviewer@hireflow.dev', paths.interviews)
      const section = await screen.findByRole('region', { name: /Cần xử lý/ }, { timeout: 4000 })
      expect(within(section).getByText('Cần gửi phiếu')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Tuần trước' })).not.toBeInTheDocument()

      cleanup()
      renderAt('hr@hireflow.dev', paths.interviews)
      const hrSection = await screen.findByRole('region', { name: /Cần xử lý/ }, { timeout: 4000 })
      expect(within(hrSection).getByText(/Chờ phiếu/)).toHaveTextContent('Chờ phiếu 0/1')
    } finally {
      Object.assign(iv, original)
    }
  })
})

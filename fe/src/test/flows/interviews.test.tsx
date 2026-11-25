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
import { jobHandlers } from '@/test/msw/handlers/jobs'
import { api, tokenFor, toUser } from '@/test/msw/http'
import { toLocalInput } from '@/features/interviews/lib/format'
import InterviewsPage from '@/features/interviews/pages/InterviewsPage'

const server = setupServer(
  ...authHandlers,
  ...applicationHandlers,
  ...interviewHandlers,
  ...jobHandlers,
)
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
    expect(screen.queryByText(/Bùi Minh Khoa/)).not.toBeInTheDocument()
  })

  it('BR-INT-02: an interviewer cannot open an application they are not assigned to', async () => {
    renderAt('interviewer@hireflow.dev', links.applicationDetail(upcoming().applicationId))
    expect(await screen.findByText(/Không tìm thấy|not found/i)).toBeInTheDocument()
  })

  it('BR-INT-03: the assigned interviewer rates every criterion and submits feedback', async () => {
    const iv = pastInterview()
    renderAt('interviewer@hireflow.dev', links.applicationDetail(iv.applicationId))
    expect(await screen.findByText('Cần gửi phiếu')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi phiếu đánh giá' }))
    expect(screen.getByText(/Mức phù hợp được ẩn để bạn chấm độc lập/)).toBeInTheDocument()
    const dialog = await screen.findByRole('dialog')

    // P5: lỗi theo từng nhóm, focus vào nhóm thiếu đầu tiên
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Phiếu đánh giá' }))
    const groups = within(dialog)
      .getAllByRole('group')
      .filter((g) => g.querySelector('legend')?.textContent !== 'Đề xuất tuyển')
    expect(within(groups[0]).getAllByRole('radio')).toContain(document.activeElement)
    expect(
      within(dialog).getAllByText('Chọn mức đánh giá cho tiêu chí này.').length,
    ).toBeGreaterThan(0)
    expect(within(dialog).getByText('Chọn mức đánh giá chung.')).toBeInTheDocument()
    expect(within(dialog).getByText('Chọn đề xuất của bạn.')).toBeInTheDocument()
    expect(within(dialog).getByText(/sửa được trong 24 giờ sau khi gửi/)).toBeInTheDocument()

    for (const group of groups) {
      fireEvent.click(within(group).getByRole('radio', { name: '4 · Tốt' }))
    }
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Nên tuyển' }))
    fireEvent.change(within(dialog).getByLabelText('Nhận xét (tuỳ chọn)'), {
      target: { value: 'Nắm chắc NestJS' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Phiếu đánh giá' }))

    expect(await screen.findByRole('button', { name: 'Sửa phiếu đánh giá' })).toBeInTheDocument()
    expect(screen.getByText('Nắm chắc NestJS')).toBeInTheDocument()
    expect(iv.feedbacks).toHaveLength(1)
    expect(iv.feedbacks[0].recommendation).toBe('YES')
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

  it('MVP 3.1 · F-INT-04: HR picks a named stage; the round follows the stage order', async () => {
    const app = db.applications.find(
      (a) => a.status === 'INTERVIEW' && !db.interviews.some((i) => i.applicationId === a.id),
    )!
    db.interviewStages.push(
      {
        id: 'stg-a',
        jobId: app.jobId,
        position: 1,
        name: 'Vòng kỹ thuật',
        criteria: [{ id: 'k1', label: 'API' }],
      },
      {
        id: 'stg-b',
        jobId: app.jobId,
        position: 2,
        name: 'Vòng văn hoá',
        criteria: [{ id: 'k2', label: 'Giao tiếp' }],
      },
    )
    try {
      renderAt('hr@hireflow.dev', links.applicationDetail(app.id))
      fireEvent.click(await screen.findByRole('tab', { name: /Phỏng vấn/ }))
      fireEvent.click(await screen.findByRole('button', { name: 'Đặt lịch phỏng vấn' }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(await within(dialog).findByLabelText('Vòng'), { target: { value: 'stg-b' } })
      fireEvent.change(within(dialog).getByLabelText('Ngày giờ'), {
        target: { value: toLocalInput(new Date(Date.now() + 4 * 86_400_000).toISOString()) },
      })
      fireEvent.change(within(dialog).getByLabelText('Địa điểm'), {
        target: { value: 'Phòng 502' },
      })
      fireEvent.click(await within(dialog).findByRole('checkbox', { name: /Phạm Thùy Linh/ }))
      fireEvent.click(within(dialog).getByRole('button', { name: 'Đặt lịch' }))

      expect(await screen.findByText('· Vòng văn hoá')).toBeInTheDocument()
      expect(db.interviews.find((i) => i.applicationId === app.id)).toMatchObject({
        stageId: 'stg-b',
        round: 2,
      })
    } finally {
      db.interviewStages = []
    }
  })

  it('MVP 3.1 · BR-INT-03: feedback on a staged interview rates the stage criteria', async () => {
    const iv = pastInterview()
    const app = db.applications.find((a) => a.id === iv.applicationId)!
    const before = { stageId: iv.stageId, feedbacks: iv.feedbacks, status: iv.status }
    db.interviewStages.push({
      id: 'stg-c',
      jobId: app.jobId,
      position: 1,
      name: 'Vòng văn hoá',
      criteria: [{ id: 'k3', label: 'Giao tiếp nhóm' }],
    })
    iv.stageId = 'stg-c'
    iv.feedbacks = []
    try {
      renderAt('interviewer@hireflow.dev', links.applicationDetail(iv.applicationId))
      fireEvent.click(await screen.findByRole('button', { name: 'Gửi phiếu đánh giá' }))
      const dialog = await screen.findByRole('dialog')
      const group = within(dialog).getByRole('group', { name: 'Giao tiếp nhóm' })
      for (const g of within(dialog).getAllByRole('group')) {
        if (g.querySelector('legend')?.textContent === 'Đề xuất tuyển') continue
        fireEvent.click(within(g).getByRole('radio', { name: '4 · Tốt' }))
      }
      fireEvent.click(within(dialog).getByRole('radio', { name: 'Rất nên tuyển' }))
      expect(group).toBeInTheDocument()
      fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Phiếu đánh giá' }))
      expect(await screen.findByRole('button', { name: 'Sửa phiếu đánh giá' })).toBeInTheDocument()
      expect(iv.feedbacks[0].ratings).toEqual([
        { requirementId: 'k3', label: 'Giao tiếp nhóm', score: 4 },
      ])
    } finally {
      Object.assign(iv, before)
      db.interviewStages = []
    }
  })

  it('MVP 3.1 · F-INT-05: HR sees the debrief with averages and recommendations; interviewers do not', async () => {
    const iv = upcoming()
    const before = iv.feedbacks
    iv.feedbacks = [
      {
        id: 'fb-debrief',
        authorId: iv.interviewerIds[0],
        overall: 4,
        ratings: [],
        comment: null,
        recommendation: 'STRONG_YES',
        submittedAt: new Date().toISOString(),
        editableUntil: new Date(Date.now() + 86_400_000).toISOString(),
      },
    ]
    onTestFinished(() => {
      iv.feedbacks = before
    })
    renderAt('hr@hireflow.dev', links.applicationDetail(iv.applicationId))
    fireEvent.click(await screen.findByRole('tab', { name: /Phỏng vấn/ }))
    const debrief = await screen.findByRole('region', { name: 'Tổng hợp phỏng vấn' })
    expect(within(debrief).getAllByText(/Rất nên tuyển/).length).toBeGreaterThan(0)
    cleanup()

    const author = db.users.find((u) => u.id === iv.feedbacks[0].authorId)!
    renderAt(author.email, links.applicationDetail(iv.applicationId))
    expect(await screen.findByText(/Vòng \d/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tổng hợp phỏng vấn' })).not.toBeInTheDocument()
  })

  it('MVP 3.1 · Q1, BR-STS-05: OFFER is reached through an offer; drafting without feedback warns but is allowed', async () => {
    const app = db.applications.find(
      (a) =>
        a.status === 'INTERVIEW' &&
        !db.interviews.some((i) => i.applicationId === a.id && i.feedbacks.length),
    )!
    renderAt('hr@hireflow.dev', links.applicationDetail(app.id))
    await screen.findByRole('heading', { name: 'Offer' })
    expect(screen.queryByRole('button', { name: /Chuyển sang Đề nghị/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Soạn offer' }))
    const dialog = await screen.findByRole('dialog', { name: 'Soạn offer' })
    expect(await within(dialog).findByRole('note')).toHaveTextContent(
      'Hồ sơ chưa có phiếu đánh giá phỏng vấn nào.',
    )
    fireEvent.change(within(dialog).getByLabelText('Mức lương'), { target: { value: '25000000' } })
    fireEvent.change(within(dialog).getByLabelText('Hạn trả lời'), {
      target: { value: '2099-01-15' },
    })
    fireEvent.change(within(dialog).getByLabelText('Ngày bắt đầu'), {
      target: { value: '2099-01-01' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo offer nháp' }))
    expect(
      within(dialog).getByText('Ngày bắt đầu không được trước hạn trả lời'),
    ).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText('Ngày bắt đầu'), {
      target: { value: '2099-02-01' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo offer nháp' }))

    expect(await screen.findByRole('button', { name: 'Gửi duyệt' })).toBeInTheDocument()
    expect(screen.getByText('25.000.000 VND/tháng')).toBeInTheDocument()
    expect(db.offers.find((o) => o.applicationId === app.id)).toMatchObject({ status: 'DRAFT' })
  })

  it('MVP 3.1 · BR-OFFER-02, Q7: HR waits for approval; Admin approves; HR marks it sent and the application moves to OFFER', async () => {
    const app = db.applications.find(
      (a) => a.status === 'INTERVIEW' && !db.offers.some((o) => o.applicationId === a.id),
    )!
    db.offers.push({
      id: 'offer-flow',
      applicationId: app.id,
      status: 'PENDING_APPROVAL',
      salaryAmount: 30_000_000,
      salaryCurrency: 'VND',
      salaryPeriod: 'MONTH',
      startDate: '2099-02-01',
      respondBy: '2099-01-15',
      note: null,
      statusReason: null,
      createdById: 'u-hr',
      approvedById: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
    })
    renderAt('hr@hireflow.dev', links.applicationDetail(app.id))
    expect(await screen.findByText(/Đang chờ Hiring Manager phụ trách tin/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duyệt offer' })).not.toBeInTheDocument()
    cleanup()

    renderAt('admin@hireflow.dev', links.applicationDetail(app.id))
    fireEvent.click(await screen.findByRole('button', { name: 'Duyệt offer' }))
    expect(await screen.findByRole('button', { name: 'Đánh dấu đã gửi' })).toBeInTheDocument()
    cleanup()

    renderAt('hr@hireflow.dev', links.applicationDetail(app.id))
    fireEvent.click(await screen.findByRole('button', { name: 'Đánh dấu đã gửi' }))
    expect(await screen.findByRole('button', { name: 'Ứng viên nhận' })).toBeInTheDocument()
    expect(app.status).toBe('OFFER')
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

// OP-1 · slice 10
describe('Phiếu đánh giá save error', () => {
  it('keeps every answer and turns the button into "Thử lại"', async () => {
    const iv = pastInterview()
    const before = iv.feedbacks
    iv.feedbacks = []
    server.use(
      http.put(api('/interviews/:id/feedback'), () =>
        HttpResponse.json(
          { success: false, statusCode: 500, code: 'INTERNAL_ERROR', message: 'Lỗi máy chủ' },
          { status: 500 },
        ),
      ),
    )
    try {
      renderAt('interviewer@hireflow.dev', links.applicationDetail(iv.applicationId))
      fireEvent.click(await screen.findByRole('button', { name: 'Gửi phiếu đánh giá' }))
      const dialog = await screen.findByRole('dialog')
      for (const g of within(dialog).getAllByRole('group')) {
        if (g.querySelector('legend')?.textContent === 'Đề xuất tuyển') continue
        fireEvent.click(within(g).getByRole('radio', { name: '4 · Tốt' }))
      }
      fireEvent.click(within(dialog).getByRole('radio', { name: 'Nên tuyển' }))
      fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Phiếu đánh giá' }))

      expect(await within(dialog).findByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
      expect(within(dialog).getByRole('alert')).toHaveTextContent('nội dung vẫn được giữ')
      expect(within(dialog).getByRole('radio', { name: 'Nên tuyển' })).toBeChecked()
      expect(within(dialog).getAllByRole('radio', { name: '4 · Tốt' })[0]).toBeChecked()
      expect(iv.feedbacks).toHaveLength(0)
    } finally {
      iv.feedbacks = before
    }
  })
})

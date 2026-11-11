import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { DetailHost } from '@/app/layouts/DetailHost'
import CandidatesPage from '@/features/candidates/pages/CandidatesPage'
import InterviewsPage from '@/features/interviews/pages/InterviewsPage'
import JobsPage from '@/features/jobs/pages/JobsPage'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { applicationHandlers } from '@/test/msw/handlers/applications'
import { authHandlers } from '@/test/msw/handlers/auth'
import { candidateHandlers } from '@/test/msw/handlers/candidates'
import { adminHandlers } from '@/test/msw/handlers/admin'
import { interviewHandlers } from '@/test/msw/handlers/interviews'
import { jobHandlers } from '@/test/msw/handlers/jobs'
import { tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(
  ...authHandlers,
  ...applicationHandlers,
  ...candidateHandlers,
  ...interviewHandlers,
  ...jobHandlers,
  ...adminHandlers,
)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

let client: QueryClient
// chờ request còn bay xong, tránh MSW bắn ProgressEvent sau khi jsdom bị dọn
afterEach(() => waitFor(() => expect(client.isFetching() + client.isMutating()).toBe(0)))

function renderAt(email: string, entry: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  const router = createMemoryRouter(
    [
      {
        path: paths.candidates,
        element: (
          <>
            <CandidatesPage />
            <DetailHost />
          </>
        ),
      },
      {
        path: paths.jobs,
        element: (
          <>
            <JobsPage />
            <DetailHost />
          </>
        ),
      },
      {
        path: paths.interviews,
        element: (
          <>
            <InterviewsPage />
            <DetailHost />
          </>
        ),
      },
    ],
    { initialEntries: [entry] },
  )
  render(
    <QueryClientProvider
      client={(client = new QueryClient({ defaultOptions: { queries: { retry: false } } }))}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('detail dialog', () => {
  it('opens a job with one click on its row and keeps the job list', async () => {
    const router = renderAt('hr@hireflow.dev', paths.jobs)
    const job = db.jobs.find((j) => j.status === 'OPEN')!
    const [link] = await screen.findAllByRole('link', { name: job.title })
    fireEvent.click(link.closest('tr')!)

    const dialog = await screen.findByRole('dialog', { name: job.title }, { timeout: 8000 })
    expect(router.state.location.pathname).toBe(paths.jobs)
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Nội dung tin' }))
    expect(within(dialog).getByLabelText('Tên vị trí')).toHaveValue(job.title)
    for (const name of [/Tiêu chí chấm/, /Hồ sơ/, 'Xếp hạng', 'Ứng viên cũ phù hợp']) {
      expect(within(dialog).getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('opens the HR upload dialog from the job popup footer', async () => {
    renderAt('hr@hireflow.dev', paths.jobs)
    const job = db.jobs.find((j) => j.status === 'OPEN')!
    const [link] = await screen.findAllByRole('link', { name: job.title })
    fireEvent.click(link.closest('tr')!)

    const dialog = await screen.findByRole('dialog', { name: job.title }, { timeout: 8000 })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tải CV hộ ứng viên' }))
    expect(await screen.findByRole('dialog', { name: 'Tải CV hộ ứng viên' })).toBeInTheDocument()
  })

  it('creates a job in a popup, then lands on the criteria tab of the new job', async () => {
    const router = renderAt('hr@hireflow.dev', paths.jobs)
    const [create] = await screen.findAllByRole('link', { name: /Tạo tin/ })
    fireEvent.click(create)

    const dialog = await screen.findByRole(
      'dialog',
      { name: 'Tạo tin tuyển dụng' },
      { timeout: 8000 },
    )
    expect(router.state.location.pathname).toBe(paths.jobs)
    const dept = db.departments[0]
    fireEvent.change(within(dialog).getByLabelText('Tên vị trí'), {
      target: { value: 'Kỹ sư dữ liệu thử nghiệm' },
    })
    await waitFor(() =>
      expect(within(dialog).getByRole('option', { name: dept.name })).toBeInTheDocument(),
    )
    fireEvent.change(within(dialog).getByLabelText('Phòng ban'), { target: { value: dept.id } })
    fireEvent.change(within(dialog).getByLabelText('Địa điểm'), { target: { value: 'Hà Nội' } })
    fireEvent.change(within(dialog).getByLabelText('Mô tả công việc'), {
      target: {
        value: 'Xây dựng pipeline dữ liệu, tối ưu truy vấn và phối hợp với đội phân tích.',
      },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu nháp' }))

    const job = await screen.findByRole(
      'dialog',
      { name: 'Kỹ sư dữ liệu thử nghiệm' },
      { timeout: 8000 },
    )
    expect(
      within(job).getByRole('tab', { name: /Tiêu chí chấm/, selected: true }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(paths.jobs)
    expect(router.state.location.search).toMatch(/xem=job%3A.+%3Acriteria/)
  })

  it('offers the department filter to HR but not to a hiring manager', async () => {
    renderAt('hr@hireflow.dev', paths.jobs)
    expect(await screen.findByRole('button', { name: /Phòng ban/ })).toBeInTheDocument()

    cleanup()
    const engJob = db.jobs.find((j) => j.departmentId === 'dep-eng')!
    renderAt('hm.eng@hireflow.dev', `${paths.jobs}?departmentId=dep-sales`)
    expect(await screen.findAllByRole('link', { name: engJob.title })).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Phòng ban/ })).not.toBeInTheDocument()
  })

  it('opens each row-menu item as a tab of the job popup instead of a new page', async () => {
    const router = renderAt('hr@hireflow.dev', paths.jobs)
    const job = db.jobs.find((j) => j.status === 'OPEN')!
    const [menu] = await screen.findAllByRole('button', { name: `Thao tác với ${job.title}` })
    fireEvent.click(menu)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hồ sơ của tin' }))

    const dialog = await screen.findByRole('dialog', { name: job.title }, { timeout: 8000 })
    expect(router.state.location.pathname).toBe(paths.jobs)
    expect(
      await within(dialog).findByRole('tab', { name: /Hồ sơ/, selected: true }),
    ).toBeInTheDocument()
  })

  it('opens a candidate in a centred dialog with tabs and stays on the list', async () => {
    const router = renderAt('hr@hireflow.dev', paths.candidates)
    const [link] = await screen.findAllByRole('link', { name: db.candidates[0].fullName })
    fireEvent.click(link.closest('tr') ?? link)

    const dialog = await screen.findByRole('dialog', { name: db.candidates[0].fullName })
    expect(router.state.location.pathname).toBe(paths.candidates)
    expect(router.state.location.search).toContain(`xem=candidate%3A${db.candidates[0].id}`)
    expect(
      await within(dialog).findByRole('tab', { name: /Các lần nộp/, selected: true }),
    ).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('tab', { name: 'Thông tin liên hệ' }))
    expect(within(dialog).getByLabelText('Email')).toBeDisabled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Đóng' }))
    expect(router.state.location.search).not.toContain('xem=')
  })

  it('opens an application from the interview calendar without leaving it', async () => {
    const iv = db.interviews.find((i) => i.id === 'iv-1')!
    const app = db.applications.find((a) => a.id === iv.applicationId)!
    const name = db.candidates.find((c) => c.id === app.candidateId)!.fullName
    const router = renderAt('hr@hireflow.dev', `${paths.interviews}?xem=application:${app.id}`)

    const dialog = await screen.findByRole('dialog', { name })
    expect(within(dialog).getByRole('tab', { name: 'Mức phù hợp' })).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /Mở bàn duyệt CV/ })).toHaveAttribute(
      'href',
      `/applications/${app.id}`,
    )
    expect(router.state.location.pathname).toBe(paths.interviews)
  })

  it('ignores the dialog for a role that cannot read candidates', async () => {
    renderAt('interviewer@hireflow.dev', `${paths.interviews}?xem=candidate:${db.candidates[0].id}`)
    expect(await screen.findByRole('heading', { name: 'Lịch phỏng vấn' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

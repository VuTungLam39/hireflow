import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
import { tokenFor, toUser } from '@/test/msw/http'
import { toLocalInput } from '@/features/interviews/lib/format'
import InterviewsPage from '@/features/interviews/pages/InterviewsPage'

const server = setupServer(...authHandlers, ...applicationHandlers, ...interviewHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
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

  it('BR-INT-01: HR schedules an interview with an interviewer for an application in INTERVIEW', async () => {
    const app = db.applications.find(
      (a) => a.status === 'INTERVIEW' && !db.interviews.some((i) => i.applicationId === a.id),
    )!
    renderAt('hr@hireflow.dev', links.applicationDetail(app.id))
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
    expect(await screen.findByRole('button', { name: 'Đặt lịch phỏng vấn' })).toBeDisabled()
    expect(screen.getByText('Chuyển hồ sơ sang “Phỏng vấn” để đặt lịch.')).toBeInTheDocument()
  })
})

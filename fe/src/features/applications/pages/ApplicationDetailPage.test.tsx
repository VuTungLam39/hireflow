import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { links, paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { applicationHandlers } from '@/test/msw/handlers/applications'
import { authHandlers } from '@/test/msw/handlers/auth'
import { tokenFor, toUser } from '@/test/msw/http'
import ApplicationDetailPage from './ApplicationDetailPage'

const server = setupServer(...authHandlers, ...applicationHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const visible = (a: (typeof db.applications)[number]) =>
  !db.candidates.find((c) => c.id === a.candidateId)?.anonymizedAt

function renderAs(email: string, applicationId: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [{ path: paths.applicationDetail, element: <ApplicationDetailPage /> }],
    { initialEntries: [links.applicationDetail(applicationId)] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// F-APP-10 · BR-APP-05
describe('reopen a closed application', () => {
  it('BR-APP-05: HR reopens a REJECTED application with a reason; it moves to SCREENING', async () => {
    const app = db.applications.find((a) => a.status === 'REJECTED' && visible(a))!
    renderAs('hr@hireflow.dev', app.id)

    fireEvent.click(await screen.findByRole('button', { name: 'Mở lại hồ sơ' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở lại' }))
    expect(await within(dialog).findByText('Vui lòng nhập lý do')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Lý do'), {
      target: { value: 'Ứng viên liên hệ lại' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở lại' }))

    expect(await screen.findByRole('button', { name: /Phỏng vấn/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mở lại hồ sơ' })).not.toBeInTheDocument()
    expect(app.status).toBe('SCREENING')
  })

  it('a Hiring Manager does not see the reopen button; HIRED cannot be reopened', async () => {
    const hm = db.users.find((u) => u.email === 'hm.eng@hireflow.dev')!
    const rejected = db.applications.find(
      (a) =>
        a.status === 'WITHDRAWN' &&
        visible(a) &&
        db.jobs.find((j) => j.id === a.jobId)?.departmentId === hm.departmentId,
    )!
    renderAs(hm.email, rejected.id)
    expect(await screen.findByText('Hồ sơ đã ở trạng thái kết thúc.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mở lại hồ sơ' })).not.toBeInTheDocument()
  })

  it('HIRED shows no reopen button', async () => {
    const hired = db.applications.find((a) => a.status === 'HIRED' && visible(a))!
    renderAs('hr@hireflow.dev', hired.id)
    expect(await screen.findByText('Hồ sơ đã ở trạng thái kết thúc.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mở lại hồ sơ' })).not.toBeInTheDocument()
  })
})

// F-FILE-02 · BR-FILE-04
describe('enter CV text by hand', () => {
  it('BR-FILE-04: HR types the text of a scanned CV and the application goes back to scoring', async () => {
    const app = db.applications.find((a) => a.aiStatus === 'FAILED' && visible(a))!
    renderAs('hr@hireflow.dev', app.id)

    fireEvent.click(await screen.findByRole('button', { name: 'Nhập text CV' }))
    const dialog = await screen.findByRole('dialog')
    const box = within(dialog).getByLabelText('Nội dung CV')
    fireEvent.change(box, { target: { value: 'quá ngắn' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu và chấm điểm' }))
    expect(await within(dialog).findByText('Nhập ít nhất 100 ký tự')).toBeInTheDocument()

    const text = 'Kinh nghiệm 3 năm NestJS, PostgreSQL, Docker tại công ty phần mềm. '.repeat(3)
    fireEvent.change(box, { target: { value: text } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu và chấm điểm' }))

    expect(await screen.findByText('Text nhập tay')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nhập text CV' })).not.toBeInTheDocument()
    expect(app.enteredCvText).toBe(text.trim())
  })

  it('a Hiring Manager cannot enter CV text', async () => {
    const hm = db.users.find((u) => u.email === 'hm.eng@hireflow.dev')!
    const app = db.applications.find(
      (a) =>
        a.aiStatus === 'DONE' &&
        visible(a) &&
        db.jobs.find((j) => j.id === a.jobId)?.departmentId === hm.departmentId,
    )!
    Object.assign(app, { aiStatus: 'FAILED', aiError: 'Không đọc được chữ trong CV', score: null })
    renderAs(hm.email, app.id)
    expect(await screen.findByText(/Chấm điểm thất bại/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nhập text CV' })).not.toBeInTheDocument()
  })
})

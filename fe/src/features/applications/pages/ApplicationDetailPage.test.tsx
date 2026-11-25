import { fireEvent, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { links, paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { api } from '@/test/msw/http'
import { applicationHandlers } from '@/test/msw/handlers/applications'
import { authHandlers } from '@/test/msw/handlers/auth'
import { renderRouteAs } from '@/test/render'
import ApplicationDetailPage from './ApplicationDetailPage'

const server = setupServer(...authHandlers, ...applicationHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const visible = (a: (typeof db.applications)[number]) =>
  !db.candidates.find((c) => c.id === a.candidateId)?.anonymizedAt

function renderAs(email: string, applicationId: string) {
  renderRouteAs(
    email,
    [{ path: paths.applicationDetail, element: <ApplicationDetailPage /> }],
    links.applicationDetail(applicationId),
  )
}

// F-APP-10 · BR-APP-05
describe('reopen a closed application', () => {
  it('BR-APP-05: HR reopens a REJECTED application with a reason; it moves to SCREENING', async () => {
    const app = db.applications.find((a) => a.status === 'REJECTED' && visible(a))!
    renderAs('hr@hireflow.dev', app.id)

    fireEvent.click(await screen.findByRole('button', { name: 'Mở lại hồ sơ' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở lại' }))
    expect(await within(dialog).findByText('Nhập lý do để tiếp tục')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Lý do'), {
      target: { value: 'Ứng viên liên hệ lại' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở lại' }))

    expect(await screen.findByRole('button', { name: 'Chuyển trạng thái' })).toBeInTheDocument()
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

    fireEvent.click(await screen.findByRole('button', { name: 'Nhập nội dung CV' }))
    const dialog = await screen.findByRole('dialog')
    const box = within(dialog).getByLabelText('Nội dung CV')
    fireEvent.change(box, { target: { value: 'quá ngắn' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu và chấm điểm' }))
    expect(await within(dialog).findByText('Nhập ít nhất 100 ký tự')).toBeInTheDocument()

    const text = 'Kinh nghiệm 3 năm NestJS, PostgreSQL, Docker tại công ty phần mềm. '.repeat(3)
    fireEvent.change(box, { target: { value: text } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu và chấm điểm' }))

    expect(await screen.findByText(/Nội dung nhập tay/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nhập nội dung CV' })).not.toBeInTheDocument()
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
    expect(await screen.findByText('Không đọc được CV')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nhập nội dung CV' })).not.toBeInTheDocument()
  })
})

// P1 · P5-D11a: một nút "Chuyển trạng thái" mở hộp quyết định
describe('decision dialog', () => {
  afterEach(() => server.resetHandlers())
  const screening = () => db.applications.find((a) => a.status === 'SCREENING' && visible(a))!

  const openDecision = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Chuyển trạng thái' }))
    return screen.findByRole('alertdialog', { name: 'Chuyển trạng thái hồ sơ' })
  }

  it('VF-01/VF-02: nothing preselected; label follows the choice; reject needs a reason', async () => {
    renderAs('hr@hireflow.dev', screening().id)
    const dialog = await openDecision()
    const select = within(dialog).getByLabelText('Trạng thái mới')
    expect(select).toHaveValue('')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))
    expect(await within(dialog).findByText('Chọn trạng thái mới.')).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'REJECTED' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận từ chối' }))
    expect(await within(dialog).findByText('Chọn một lý do để tiếp tục')).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'INTERVIEW' } })
    expect(within(dialog).queryByText('Lý do từ chối')).toBeNull()
    expect(within(dialog).getByRole('button', { name: 'Xác nhận' })).toBeInTheDocument()
  })

  it('OP-1: a failed save keeps the choice and offers "Thử lại"', async () => {
    const app = screening()
    renderAs('hr@hireflow.dev', app.id)
    server.use(
      http.patch(api('/applications/:id/status'), () =>
        HttpResponse.json(
          { success: false, statusCode: 500, code: 'INTERNAL_ERROR', message: 'down' },
          { status: 500 },
        ),
      ),
    )
    const dialog = await openDecision()
    fireEvent.change(within(dialog).getByLabelText('Trạng thái mới'), {
      target: { value: 'INTERVIEW' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))
    expect(await within(dialog).findByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Trạng thái mới')).toHaveValue('INTERVIEW')
    expect(app.status).toBe('SCREENING')
  })

  it('a 403 on save closes the dialog and explains the permission', async () => {
    renderAs('hr@hireflow.dev', screening().id)
    server.use(
      http.patch(api('/applications/:id/status'), () =>
        HttpResponse.json(
          { success: false, statusCode: 403, code: 'FORBIDDEN', message: 'no' },
          { status: 403 },
        ),
      ),
    )
    const dialog = await openDecision()
    fireEvent.change(within(dialog).getByLabelText('Trạng thái mới'), {
      target: { value: 'INTERVIEW' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))
    expect(await screen.findByText(/Bạn không có quyền thực hiện thao tác này/)).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})

describe('review page states', () => {
  afterEach(() => server.resetHandlers())

  it('ADR-0002: not-found and out-of-scope share one design', async () => {
    server.use(
      http.get(api('/applications/:id'), () =>
        HttpResponse.json(
          { success: false, statusCode: 404, code: 'NOT_FOUND', message: 'Application not found' },
          { status: 404 },
        ),
      ),
    )
    renderAs('hr@hireflow.dev', db.applications[0].id)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Không tìm thấy hồ sơ này' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Về danh sách hồ sơ' })).toBeInTheDocument()
  })

  it('P1: rejected quotes sit in one disclosure; the CV pane says it is the extracted text (VF-12)', async () => {
    const app = db.applications.find(
      (a) => visible(a) && a.aiStatus === 'DONE' && a.breakdown.length > 1,
    )!
    const saved = app.breakdown
    app.breakdown = saved.map((b, i) =>
      i === 0 ? { ...b, match: 0, evidence: null, rejectedEvidence: 'Thành thạo Kubernetes' } : b,
    )
    renderAs('hr@hireflow.dev', app.id)
    const disclosure = await screen.findByText('Có căn cứ bị loại (1)')
    expect(disclosure.closest('details')).toHaveTextContent('“Thành thạo Kubernetes”')
    app.breakdown = saved
    expect(
      (await screen.findAllByText(/Nội dung CV đã trích xuất · đây là văn bản hệ thống/)).length,
    ).toBeGreaterThan(0)
  })
})

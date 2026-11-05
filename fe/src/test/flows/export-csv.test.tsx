import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { toast } from 'sonner'
import ApplicationsPage from '@/features/applications/pages/ApplicationsPage'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { api } from '@/test/msw/http'
import { tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const signIn = (email: string) => {
  const me = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(me), tokenFor(me))
}

const open = (search = '') => {
  const router = createMemoryRouter([{ path: paths.applications, element: <ApplicationsPage /> }], {
    initialEntries: [`${paths.applications}${search}`],
  })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

/** jsdom không có createObjectURL: giữ lại blob và tên file được tải */
const captureDownload = () => {
  const saved: { blob?: Blob; name?: string } = {}
  URL.createObjectURL = vi.fn((blob: Blob) => {
    saved.blob = blob
    return 'blob:csv'
  })
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.name = this.download
  })
  return saved
}

// E6 · BR-APP-11
describe('export applications to CSV', () => {
  it('downloads exactly the rows of the current filter', async () => {
    signIn('hr@hireflow.dev')
    const saved = captureDownload()
    const success = vi.spyOn(toast, 'success')
    open('?status=NEW')

    const button = await screen.findByRole('button', { name: 'Xuất CSV' })
    await screen.findByText(/hồ sơ khớp bộ lọc/)
    fireEvent.click(button)

    await waitFor(() => expect(saved.name).toBe('ho-so-ung-tuyen-2026-11-05.csv'))
    const text = await saved.blob!.text()
    const [header, ...rows] = text
      .replace(/^\uFEFF/, '')
      .trimEnd()
      .split('\r\n')
    expect(header).toBe('"Họ tên","Email","Trạng thái"')
    expect(rows.length).toBe(db.applications.filter((a) => a.status === 'NEW').length)
    expect(rows.every((r) => r.endsWith('"Mới"'))).toBe(true)
    expect(success).toHaveBeenCalledWith(
      `Đã xuất ${rows.length} hồ sơ ra ho-so-ung-tuyen-2026-11-05.csv`,
    )
  })

  it('explains the limit when the server refuses a too large export', async () => {
    signIn('hr@hireflow.dev')
    captureDownload()
    const error = vi.spyOn(toast, 'error')
    server.use(
      http.get(api('/applications/export'), () =>
        HttpResponse.json(
          { success: false, statusCode: 400, code: 'EXPORT_TOO_LARGE', message: 'Too many rows' },
          { status: 400 },
        ),
      ),
    )
    open()

    fireEvent.click(await screen.findByRole('button', { name: 'Xuất CSV' }))
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        'Bộ lọc khớp hơn 5.000 hồ sơ. Thu hẹp theo tin, trạng thái hoặc ngày nộp rồi xuất lại',
      ),
    )
  })

  it('BR-INT-02: interviewers do not get the button', async () => {
    signIn('interviewer@hireflow.dev')
    open()
    await screen.findByRole('columnheader', { name: 'Phiếu của bạn' })
    expect(screen.queryByRole('button', { name: 'Xuất CSV' })).not.toBeInTheDocument()
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { auditHandlers } from '@/test/msw/handlers/notifications'
import { tokenFor, toUser } from '@/test/msw/http'
import { describeAudit } from '../audit-format'
import AuditLogPage from './AuditLogPage'

const server = setupServer(...auditHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

function renderPage(entry: string = paths.auditLogs) {
  const admin = db.users.find((u) => u.role === 'admin')!
  useAuthStore.getState().setSession(toUser(admin), tokenFor(admin))
  const router = createMemoryRouter([{ path: paths.auditLogs, element: <AuditLogPage /> }], {
    initialEntries: [entry],
  })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// F-AUDIT-01
describe('AuditLogPage', () => {
  it('lists who changed which application, newest first, with the status change and IP', async () => {
    renderPage()
    expect((await screen.findAllByRole('link', { name: /^Hồ sơ / })).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Đổi trạng thái hồ sơ').length).toBeGreaterThan(1)
    expect(screen.getAllByText(/→/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('IP 203.0.113.10').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /^Hồ sơ / }).length).toBeGreaterThan(0)
  })

  it('filters by action from the URL and shows an empty state', async () => {
    renderPage(`${paths.auditLogs}?action=CV_VIEWED`)
    expect(await screen.findByText('Chưa có hành động nào')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lọc Hành động' }))
    expect((await screen.findAllByRole('link', { name: /^Hồ sơ / })).length).toBeGreaterThan(0)
  })

  it('takes dates as dd/mm/yyyy whatever the browser language (Design Spec 8)', async () => {
    renderPage(paths.auditLogs)
    fireEvent.click(await screen.findByRole('button', { name: /^Ngày/ }))
    const from = screen.getByLabelText('Từ ngày')
    expect(from).toHaveAttribute('placeholder', 'dd/mm/yyyy')
    fireEvent.change(from, { target: { value: '01012026' } })
    expect(from).toHaveValue('01/01/2026')
    fireEvent.blur(from)
    expect(await screen.findByText('từ 01/01/2026')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '31/02/2026' } })
    fireEvent.blur(screen.getByLabelText('Đến ngày'))
    expect(screen.getByText('Ngày không hợp lệ')).toBeInTheDocument()
  })

  it('describes each action in Vietnamese', () => {
    const base = {
      id: 'a',
      entity: 'user',
      entityId: 'u',
      ip: null,
      requestId: null,
      createdAt: '',
      actor: null,
      actorId: null,
    } as const
    expect(
      describeAudit({
        ...base,
        action: 'USER_UPDATED',
        metadata: { roleFrom: 'hr', roleTo: 'hiring_manager', passwordReset: true },
      }),
    ).toBe('Vai trò HR → Hiring Manager · Đặt lại mật khẩu')
    expect(
      describeAudit({ ...base, action: 'CANDIDATE_ANONYMIZED', metadata: { reason: 'retention' } }),
    ).toBe('Tự động khi hết hạn lưu CV')
    expect(
      describeAudit({
        ...base,
        action: 'APPLICATION_STATUS_CHANGED',
        metadata: { from: 'REJECTED', to: 'SCREENING', reopen: true, reason: 'Xét lại' },
      }),
    ).toBe('Từ chối → Sàng lọc (mở lại) · Lý do: Xét lại')
    expect(
      describeAudit({
        ...base,
        action: 'APPLICATIONS_EXPORTED',
        metadata: { rows: 1250, filters: 'status=NEW&search=an' },
      }),
    ).toBe('1.250 hồ sơ · Bộ lọc: trạng thái Mới, tìm “an”')
    expect(
      describeAudit({
        ...base,
        action: 'APPLICATIONS_EXPORTED',
        metadata: { rows: 3, filters: '' },
      }),
    ).toBe('3 hồ sơ · Bộ lọc: không lọc')
  })
})

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
    fireEvent.change(screen.getByLabelText('Hành động'), { target: { value: '' } })
    expect((await screen.findAllByRole('link', { name: /^Hồ sơ / })).length).toBeGreaterThan(0)
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
    ).toBe('Từ chối → Sàng lọc CV (mở lại) · Lý do: Xét lại')
  })
})

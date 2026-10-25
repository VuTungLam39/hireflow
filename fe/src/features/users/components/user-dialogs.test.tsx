/**
 * Render thử hộp thoại đổi mật khẩu và sửa người dùng trên API giả (MSW).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { ChangePasswordDialog } from '@/features/auth'
import { db } from '@/test/msw/data'
import { adminHandlers } from '@/test/msw/handlers/admin'
import { authHandlers } from '@/test/msw/handlers/auth'
import { tokenFor, toUser } from '@/test/msw/http'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { EditUserDialog } from './EditUserDialog'

const server = setupServer(...authHandlers, ...adminHandlers)
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  // jsdom chưa có showModal/close cho <dialog>
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
})
afterAll(() => server.close())

const rowOf = (email: string) => db.users.find((u) => u.email === email)!

function loginAs(email: string) {
  const row = rowOf(email)
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
}

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ChangePasswordDialog', () => {
  it('validates on the client, then shows WRONG_PASSWORD at the current password field', async () => {
    loginAs('hr@hireflow.dev')
    const user = userEvent.setup()
    renderWithQuery(<ChangePasswordDialog open onClose={() => {}} />)

    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'Sai@1234')
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'Moi@12345')
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'Khac@12345')
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
    expect(await screen.findByText('Mật khẩu xác nhận không khớp')).toBeInTheDocument()

    const confirm = screen.getByLabelText('Nhập lại mật khẩu mới')
    await user.clear(confirm)
    await user.type(confirm, 'Moi@12345')
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
    expect(await screen.findByText('Mật khẩu hiện tại không đúng')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('EditUserDialog', () => {
  it('locks email and only enables department for Hiring Manager (BR-ACC-03)', async () => {
    loginAs('admin@hireflow.dev')
    const user = userEvent.setup()
    const hm = toUser(rowOf('hm.eng@hireflow.dev'))
    renderWithQuery(<EditUserDialog user={hm} isSelf={false} onClose={() => {}} />)

    expect(screen.getByLabelText('Email')).toBeDisabled()
    // Ô phòng ban giữ đúng giá trị ban đầu sau khi danh sách tải xong
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Phòng ban')).toHaveValue(hm.department!.id),
    )
    const department = screen.getByLabelText('Phòng ban')
    expect(department).toBeEnabled()

    // Đổi sang HR: phòng ban bị bỏ và khoá
    await user.selectOptions(screen.getByLabelText('Vai trò'), Role.Hr)
    expect(department).toBeDisabled()
    expect(department).toHaveValue('')

    // Quay lại Hiring Manager mà không chọn phòng ban: báo lỗi, không gửi
    await user.selectOptions(screen.getByLabelText('Vai trò'), Role.HiringManager)
    await user.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByText('Hiring Manager phải thuộc một phòng ban')).toBeInTheDocument()
  })

  it('does not let admin change their own role', () => {
    loginAs('admin@hireflow.dev')
    const admin = toUser(rowOf('admin@hireflow.dev'))
    renderWithQuery(<EditUserDialog user={admin} isSelf onClose={() => {}} />)
    expect(screen.getByLabelText('Vai trò')).toBeDisabled()
    expect(screen.getByText('Không tự đổi vai trò của chính mình')).toBeInTheDocument()
  })

  it('saves a new name and closes', async () => {
    loginAs('admin@hireflow.dev')
    const user = userEvent.setup()
    const onClose = vi.fn()
    const hr = toUser(rowOf('hr2@hireflow.dev'))
    renderWithQuery(<EditUserDialog user={hr} isSelf={false} onClose={onClose} />)

    const name = screen.getByLabelText('Họ tên')
    await user.clear(name)
    await user.type(name, 'Lê Minh Quân Mới')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(rowOf('hr2@hireflow.dev').fullName).toBe('Lê Minh Quân Mới')
  })
})

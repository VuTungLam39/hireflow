import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { paths } from '@/routes/paths'
import { authHandlers, MOCK_RESET_TOKEN } from '@/test/msw/handlers/auth'
import ForgotPasswordPage from './ForgotPasswordPage'
import LoginPage from './LoginPage'
import ResetPasswordPage from './ResetPasswordPage'

const server = setupServer(...authHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  window.history.replaceState(null, '', '/')
})
afterAll(() => server.close())

const renderAt = (entry: string) => {
  const router = createMemoryRouter(
    [
      { path: paths.login, element: <LoginPage /> },
      { path: paths.forgotPassword, element: <ForgotPasswordPage /> },
      { path: paths.resetPassword, element: <ResetPasswordPage /> },
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
  return router
}

// SG-06 · R6
describe('forgot / reset password', () => {
  it('login links to "Quên mật khẩu?"; the forgot page answers the same way for any email (BR-ACC-09)', async () => {
    const router = renderAt(paths.login)
    fireEvent.click(screen.getByRole('link', { name: 'Quên mật khẩu?' }))
    await waitFor(() => expect(router.state.location.pathname).toBe(paths.forgotPassword))

    fireEvent.click(await screen.findByRole('button', { name: 'Gửi link đặt lại mật khẩu' }))
    expect(await screen.findByText('Nhập email')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ai-do@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi link đặt lại mật khẩu' }))
    expect(
      await screen.findByRole('heading', { name: 'Kiểm tra hộp thư của bạn' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Nếu email này có tài khoản HireFlow/)).toBeInTheDocument()
  })

  it('reads the token from the fragment, removes it from the address bar, then resets and lands on login', async () => {
    window.history.replaceState(null, '', `${paths.resetPassword}#t=${MOCK_RESET_TOKEN}`)
    const router = renderAt(paths.resetPassword)
    expect(await screen.findByRole('heading', { name: 'Đặt mật khẩu mới' })).toBeInTheDocument()
    expect(window.location.hash).toBe('')

    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'NewPassword456' } })
    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), {
      target: { value: 'Khac12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }))
    expect(await screen.findByText('Mật khẩu xác nhận không khớp')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), {
      target: { value: 'NewPassword456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }))
    await waitFor(() => expect(router.state.location.pathname).toBe(paths.login))
    expect(await screen.findByRole('status')).toHaveTextContent('Mật khẩu đã được đặt lại')
  })

  it('a used token falls back to the invalid-link screen after submit', async () => {
    window.history.replaceState(null, '', `${paths.resetPassword}#t=${MOCK_RESET_TOKEN}`)
    renderAt(paths.resetPassword)
    fireEvent.change(await screen.findByLabelText('Mật khẩu mới'), {
      target: { value: 'NewPassword456' },
    })
    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), {
      target: { value: 'NewPassword456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }))
    expect(
      await screen.findByRole('heading', { name: 'Link không còn hiệu lực' }),
    ).toBeInTheDocument()
  })

  it('shows the invalid-link screen without a token', async () => {
    renderAt(paths.resetPassword)
    expect(
      await screen.findByRole('heading', { name: 'Link không còn hiệu lực' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gửi lại link' })).toHaveAttribute(
      'href',
      paths.forgotPassword,
    )
  })
})

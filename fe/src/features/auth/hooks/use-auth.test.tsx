import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { GuestRoute, ProtectedRoute } from '@/routes/guards'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_PASSWORD } from '@/test/msw/data'
import { authHandlers } from '@/test/msw/handlers/auth'
import { renderRoutes } from '@/test/render'
import LoginPage from '../pages/LoginPage'

const server = setupServer(...authHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

describe('useLogin', () => {
  beforeEach(() => useAuthStore.getState().clear())

  // Phiên trước mất giữa chừng (không F5): người đăng nhập sau không được thấy cache của người trước
  it('drops the previous user cache on login', async () => {
    const { queryClient } = renderRoutes(
      [
        { element: <GuestRoute />, children: [{ path: '/login', element: <LoginPage /> }] },
        { element: <ProtectedRoute />, children: [{ path: '/', element: <p>home page</p> }] },
      ],
      '/login',
    )
    queryClient.setQueryData(['notifications', 'list'], ['thông báo của người trước'])

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'hr@hireflow.dev')
    await user.type(screen.getByLabelText('Mật khẩu'), MOCK_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('home page')).toBeInTheDocument()
    await waitFor(() => expect(queryClient.getQueryData(['notifications', 'list'])).toBeUndefined())
  })
})

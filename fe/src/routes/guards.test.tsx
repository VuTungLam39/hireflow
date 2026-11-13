import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation, useNavigate } from 'react-router'
import { Permission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/auth.store'
import { Role, type User } from '@/types/user'
import { GuestRoute, PermissionRoute, ProtectedRoute } from './guards'

const user: User = {
  id: '1',
  email: 'u@example.com',
  fullName: 'User',
  role: Role.Hr,
  departmentId: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: '',
  updatedAt: '',
}
const tokens = { accessToken: 'a', tokenType: 'Bearer' as const, expiresIn: 900 }

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { element: <GuestRoute />, children: [{ path: '/login', element: <p>login page</p> }] },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <p>home page</p> },
          {
            element: <PermissionRoute permission={Permission.UserManage} />,
            children: [{ path: '/users', element: <p>users page</p> }],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

describe('route guards', () => {
  beforeEach(() => useAuthStore.getState().clear())

  it('redirects guests to login', () => {
    renderAt('/')
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('redirects logged-in users away from login', () => {
    useAuthStore.getState().setSession(user, tokens)
    renderAt('/login')
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('blocks users without the required permission', () => {
    useAuthStore.getState().setSession(user, tokens)
    renderAt('/users')
    expect(screen.getByText(/không thuộc quyền của bạn/i)).toBeInTheDocument()
  })

  it('allows admins into admin routes', () => {
    useAuthStore.getState().setSession({ ...user, role: Role.Admin }, tokens)
    renderAt('/users')
    expect(screen.getByText('users page')).toBeInTheDocument()
  })

  // Trang đích có loader: GuestRoute không được chen ngang về trang chủ khi loader còn chạy
  it('returns to the deep link after login even when the target route has a loader', async () => {
    function LoginStub() {
      const navigate = useNavigate()
      const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
      return (
        <button
          onClick={() => {
            useAuthStore.getState().setSession(user, tokens)
            navigate(from, { replace: true })
          }}
        >
          sign in
        </button>
      )
    }
    const router = createMemoryRouter(
      [
        { element: <GuestRoute />, children: [{ path: '/login', element: <LoginStub /> }] },
        {
          element: <ProtectedRoute />,
          children: [
            { path: '/', element: <p>home page</p> },
            {
              path: '/applications',
              loader: () => new Promise((r) => setTimeout(() => r(null), 30)),
              element: <p>applications page</p>,
            },
          ],
        },
      ],
      { initialEntries: ['/applications?xem=application:1'] },
    )
    render(<RouterProvider router={router} />)
    const button = await screen.findByText('sign in')
    await act(async () => {
      fireEvent.click(button)
      await new Promise((r) => setTimeout(r, 80))
    })
    expect(await screen.findByText('applications page')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?xem=application:1')
  })
})

import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { MainLayout } from '@/app/layouts/MainLayout'
import { PageLoader } from '@/components/ui'
import { restoreSession } from '@/features/auth'
import ErrorPage from '@/pages/ErrorPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { Role } from '@/types/user'
import { GuestRoute, ProtectedRoute, RoleRoute } from './guards'
import { paths } from './paths'

// Lazy load: mỗi trang được tách thành 1 file JS riêng, chỉ tải khi vào trang đó
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

export const router = createBrowserRouter([
  {
    // Khôi phục phiên từ cookie refresh token trước khi guard kiểm tra đăng nhập.
    // Trong lúc chờ, hydrateFallbackElement hiện PageLoader.
    loader: async () => {
      await restoreSession()
      return null
    },
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: paths.login, lazy: page(() => import('@/features/auth/pages/LoginPage')) },
              {
                path: paths.register,
                lazy: page(() => import('@/features/auth/pages/RegisterPage')),
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: paths.home, lazy: page(() => import('@/pages/HomePage')) },
              {
                element: <RoleRoute roles={[Role.Admin]} />,
                children: [
                  {
                    path: paths.users,
                    lazy: page(() => import('@/features/users/pages/UsersPage')),
                  },
                ],
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])

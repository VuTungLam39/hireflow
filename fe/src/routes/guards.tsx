import { Navigate, Outlet, useLocation } from 'react-router'
import ForbiddenPage from '@/pages/ForbiddenPage'
import { useAuthStore, useIsAuthenticated } from '@/stores/auth.store'
import type { Role } from '@/types/user'
import { paths } from './paths'

/** Chỉ cho vào khi đã đăng nhập; lưu lại trang đang định vào để quay lại sau khi login */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />
    )
  }
  return <Outlet />
}

/** Chỉ cho vào khi user có một trong các role được liệt kê */
export function RoleRoute({ roles }: { roles: Role[] }) {
  const role = useAuthStore((s) => s.user?.role)
  if (!role || !roles.includes(role)) return <ForbiddenPage />
  return <Outlet />
}

/** Trang login/register: đã đăng nhập thì chuyển về trang chủ */
export function GuestRoute() {
  const isAuthenticated = useIsAuthenticated()
  if (isAuthenticated) return <Navigate to={paths.home} replace />
  return <Outlet />
}

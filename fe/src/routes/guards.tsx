import { Navigate, Outlet, useLocation } from 'react-router'
import { usePermission } from '@/hooks/use-permission'
import type { Permission } from '@/lib/permissions'
import ForbiddenPage from '@/pages/ForbiddenPage'
import { useIsAuthenticated } from '@/stores/auth.store'
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

/** Chỉ cho vào khi user có permission (thay RoleRoute, kickoff mục 11.2) */
export function PermissionRoute({
  permission,
  fallbackTo,
}: {
  permission: Permission
  /** Không có quyền thì chuyển sang trang này thay vì báo 403 (Interviewer vào trang chủ) */
  fallbackTo?: string
}) {
  const allowed = usePermission(permission)
  if (!allowed) return fallbackTo ? <Navigate to={fallbackTo} replace /> : <ForbiddenPage />
  return <Outlet />
}

/** Trang login: đã đăng nhập thì chuyển về trang chủ */
export function GuestRoute() {
  const isAuthenticated = useIsAuthenticated()
  if (isAuthenticated) return <Navigate to={paths.home} replace />
  return <Outlet />
}

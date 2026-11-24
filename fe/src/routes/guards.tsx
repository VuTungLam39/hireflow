import { Navigate, Outlet, useLocation, useMatches } from 'react-router'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import PublicNotFoundPage from '@/pages/PublicNotFoundPage'
import { usePermission } from '@/hooks/use-permission'
import type { Permission } from '@/lib/permissions'
import ForbiddenPage from '@/pages/ForbiddenPage'
import { useAuthStore, useIsAuthenticated } from '@/stores/auth.store'
import { paths } from './paths'

/** Chỉ cho vào khi đã đăng nhập; lưu lại trang đang định vào để quay lại sau khi login */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const signedOut = useAuthStore((s) => s.signedOut)
  const location = useLocation()

  const unknownPath = useMatches().some(
    (m) => (m.handle as { notFound?: boolean } | undefined)?.notFound,
  )

  if (!isAuthenticated) {
    // F-10: URL không có thật → 404 công khai, không đẩy khách về trang đăng nhập
    if (unknownPath)
      return (
        <PublicLayout>
          <PublicNotFoundPage />
        </PublicLayout>
      )
    const from = signedOut ? undefined : { from: location.pathname + location.search }
    return <Navigate to={paths.login} replace state={from} />
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

/** Trang login: đã đăng nhập thì chuyển về trang định vào trước đó, mặc định trang chủ */
export function GuestRoute() {
  const isAuthenticated = useIsAuthenticated()
  const from = (useLocation().state as { from?: string } | null)?.from
  // Cùng đích với useLogin: loader của trang đích còn chạy thì không bị chen về trang chủ
  if (isAuthenticated) return <Navigate to={from ?? paths.home} replace />
  return <Outlet />
}

import { refreshAccessToken } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from './api/auth.api'
import { authKeys } from './hooks/use-auth'

let restorePromise: Promise<void> | null = null

/**
 * Khôi phục phiên khi tải (lại) trang: access token chỉ nằm trong bộ nhớ nên mất khi F5,
 * nhưng cookie refresh token (httpOnly) vẫn còn → đổi lấy access token mới rồi tải user.
 * Gọi ở loader gốc của router; chỉ chạy một lần cho mỗi lần tải trang.
 */
export function restoreSession(): Promise<void> {
  restorePromise ??= (async () => {
    if (useAuthStore.getState().accessToken) return
    try {
      await refreshAccessToken()
      const user = await queryClient.fetchQuery({ queryKey: authKeys.me, queryFn: authApi.me })
      useAuthStore.getState().setUser(user)
    } catch {
      // Không có cookie hoặc đã hết hạn: tiếp tục như khách, guard sẽ chuyển về trang đăng nhập
      useAuthStore.getState().clear()
    }
  })()
  return restorePromise
}

/** Chỉ dùng trong test */
export function resetRestoreSession() {
  restorePromise = null
}

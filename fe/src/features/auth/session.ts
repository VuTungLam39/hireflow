import { isAxiosError } from 'axios'
import { refreshAccessToken } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from './api/auth.api'
import { authKeys } from './hooks/use-auth'

let restorePromise: Promise<void> | null = null
let unavailable = false

/**
 * Khôi phục phiên khi tải (lại) trang: access token chỉ nằm trong bộ nhớ nên mất khi F5,
 * nhưng cookie refresh token (httpOnly) vẫn còn → đổi lấy access token mới rồi tải user.
 * Gọi ở loader gốc của router; chỉ chạy một lần cho mỗi lần tải trang.
 */
export function restoreSession(): Promise<void> {
  restorePromise ??= (async () => {
    unavailable = false
    if (useAuthStore.getState().accessToken) return
    try {
      await refreshAccessToken()
      const user = await queryClient.fetchQuery({ queryKey: authKeys.me, queryFn: authApi.me })
      useAuthStore.getState().setUser(user)
    } catch (error) {
      if (isAxiosError(error) && (!error.response || error.response.status >= 500)) {
        unavailable = true
        restorePromise = null
        return
      }
      // Không có cookie hoặc đã hết hạn: tiếp tục như khách, guard sẽ chuyển về trang đăng nhập
      useAuthStore.getState().clear()
    }
  })()
  return restorePromise
}

export function sessionUnavailable() {
  return unavailable
}

/** Chỉ dùng trong test */
export function resetRestoreSession() {
  restorePromise = null
}

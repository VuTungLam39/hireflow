import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth.store'
import type { ApiResponse } from '@/types/api'
import type { AccessToken } from '@/types/user'

/** Axios instance dùng cho mọi request tới backend */
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  // Gửi kèm cookie refresh token (httpOnly) khi FE và API khác origin
  withCredentials: true,
})

// Gắn access token vào mọi request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Các endpoint không được tự refresh khi trả 401 (tránh vòng lặp)
const NO_REFRESH_URLS = ['/auth/login', '/auth/refresh']

// Nhiều request cùng bị 401 (hoặc khôi phục phiên lúc tải trang) dùng chung 1 lần refresh.
// Quan trọng vì refresh token xoay vòng: gọi 2 lần song song thì lần sau sẽ bị từ chối.
let refreshPromise: Promise<string> | null = null

/** Lấy access token mới bằng cookie refresh token; lỗi nếu cookie không có hoặc đã hết hạn */
export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= (async () => {
    // Dùng axios gốc để không đi qua interceptor của `api`
    const res = await axios.post<ApiResponse<AccessToken>>(`${env.apiUrl}/auth/refresh`, null, {
      withCredentials: true,
    })
    const { accessToken } = res.data.data
    useAuthStore.getState().setAccessToken(accessToken)
    return accessToken
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Access token hết hạn -> refresh rồi gửi lại request; refresh thất bại -> đăng xuất
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    const canRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !NO_REFRESH_URLS.some((url) => original.url?.startsWith(url))

    if (!canRefresh) return Promise.reject(error)

    original._retry = true
    try {
      const token = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch {
      // ProtectedRoute sẽ tự chuyển về trang đăng nhập khi phiên bị xoá
      useAuthStore.getState().clear()
      return Promise.reject(error)
    }
  },
)

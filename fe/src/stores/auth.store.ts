import { create } from 'zustand'
import type { AccessToken, User } from '@/types/user'

interface AuthState {
  /** Chỉ giữ trong bộ nhớ, không lưu localStorage (chống XSS đọc token) */
  accessToken: string | null
  user: User | null
  setSession: (user: User, tokens: AccessToken) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  clear: () => void
}

/**
 * Phiên đăng nhập. Refresh token nằm trong cookie httpOnly do backend đặt,
 * nên khi tải lại trang phiên được khôi phục bằng restoreSession() (xem features/auth/session.ts).
 */
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  setSession: (user, { accessToken }) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null }),
}))

export const useIsAuthenticated = () => useAuthStore((s) => !!s.accessToken)

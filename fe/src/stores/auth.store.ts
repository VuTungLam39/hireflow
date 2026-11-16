import { create } from 'zustand'
import type { AccessToken, User } from '@/types/user'

interface AuthState {
  /** Chỉ giữ trong bộ nhớ, không lưu localStorage (chống XSS đọc token) */
  accessToken: string | null
  user: User | null
  signedOut: boolean
  setSession: (user: User, tokens: AccessToken) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  clear: (reason?: 'signed-out') => void
}

// P3-01: chỉ đánh dấu đã từng đăng nhập, không chứa token
const SESSION_HINT = 'hf_session'
const setHint = (on: boolean) => {
  try {
    if (on) localStorage.setItem(SESSION_HINT, '1')
    else localStorage.removeItem(SESSION_HINT)
  } catch {
    // localStorage bị chặn
  }
}
export const hasSessionHint = () => {
  try {
    return localStorage.getItem(SESSION_HINT) === '1'
  } catch {
    return true
  }
}

/**
 * Phiên đăng nhập. Refresh token nằm trong cookie httpOnly do backend đặt,
 * nên khi tải lại trang phiên được khôi phục bằng restoreSession() (xem features/auth/session.ts).
 */
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  signedOut: false,
  setSession: (user, { accessToken }) => {
    setHint(true)
    set({ user, accessToken, signedOut: false })
  },
  setAccessToken: (accessToken) => {
    setHint(true)
    set({ accessToken })
  },
  setUser: (user) => set({ user }),
  clear: (reason) => {
    setHint(false)
    set({ user: null, accessToken: null, signedOut: reason === 'signed-out' })
  },
}))

export const useIsAuthenticated = () => useAuthStore((s) => !!s.accessToken)

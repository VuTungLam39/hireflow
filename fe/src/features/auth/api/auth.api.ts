import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { AccessToken, User } from '@/types/user'
import type { ChangePasswordInput, LoginInput } from '../schemas/auth.schema'

export interface AuthResult {
  user: User
  tokens: AccessToken
}

export const authApi = {
  login: async (input: LoginInput) =>
    (await api.post<ApiResponse<AuthResult>>('/auth/login', input)).data.data,

  logout: async () => {
    await api.post('/auth/logout')
  },

  me: async () => (await api.get<ApiResponse<User>>('/auth/me')).data.data,

  /** Đổi mật khẩu của chính mình. BE thu hồi mọi phiên khác, phiên hiện tại giữ nguyên */
  changePassword: async (input: ChangePasswordInput) => {
    await api.patch('/auth/password', input)
  },

  // SG-06 · R6
  forgotPassword: async (email: string) => {
    await api.post('/auth/forgot-password', { email })
  },

  resetPassword: async (input: { token: string; password: string }) => {
    await api.post('/auth/reset-password', input)
  },
}

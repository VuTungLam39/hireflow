import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { AccessToken, User } from '@/types/user'
import type { ChangePasswordInput, LoginInput, RegisterInput } from '../schemas/auth.schema'

export interface AuthResult {
  user: User
  tokens: AccessToken
}

export const authApi = {
  login: async (input: LoginInput) =>
    (await api.post<ApiResponse<AuthResult>>('/auth/login', input)).data.data,

  register: async (input: RegisterInput) =>
    (await api.post<ApiResponse<AuthResult>>('/auth/register', input)).data.data,

  logout: async () => {
    await api.post('/auth/logout')
  },

  me: async () => (await api.get<ApiResponse<User>>('/auth/me')).data.data,

  /** Đổi mật khẩu của chính mình. BE thu hồi mọi phiên khác, phiên hiện tại giữ nguyên */
  changePassword: async (input: ChangePasswordInput) => {
    await api.patch('/auth/password', input)
  },
}

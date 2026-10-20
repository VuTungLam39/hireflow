import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { AccessToken, User } from '@/types/user'
import type { LoginInput, RegisterInput } from '../schemas/auth.schema'

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
}

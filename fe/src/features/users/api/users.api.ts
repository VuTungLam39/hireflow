import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated, PaginationParams } from '@/types/api'
import type { Role, User } from '@/types/user'

export interface UserListParams extends PaginationParams {
  role?: Role
}

export interface CreateUserInput {
  email: string
  password: string
  fullName: string
  role?: Role
  isActive?: boolean
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email'>>

export const usersApi = {
  list: async (params: UserListParams): Promise<Paginated<User>> => {
    const res = await api.get<ApiResponse<User[]>>('/users', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  get: async (id: string) => (await api.get<ApiResponse<User>>(`/users/${id}`)).data.data,

  create: async (input: CreateUserInput) =>
    (await api.post<ApiResponse<User>>('/users', input)).data.data,

  update: async (id: string, input: UpdateUserInput) =>
    (await api.patch<ApiResponse<User>>(`/users/${id}`, input)).data.data,

  remove: async (id: string) => {
    await api.delete(`/users/${id}`)
  },
}

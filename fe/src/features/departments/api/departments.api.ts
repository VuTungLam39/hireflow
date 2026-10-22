import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated, PaginationParams } from '@/types/api'
import type { Department, DepartmentInput } from '../types'

export type DepartmentListParams = PaginationParams

export const departmentsApi = {
  list: async (params: DepartmentListParams): Promise<Paginated<Department>> => {
    const res = await api.get<ApiResponse<Department[]>>('/departments', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  create: async (input: DepartmentInput) =>
    (await api.post<ApiResponse<Department>>('/departments', input)).data.data,

  update: async (id: string, input: DepartmentInput) =>
    (await api.patch<ApiResponse<Department>>(`/departments/${id}`, input)).data.data,

  remove: async (id: string) => {
    await api.delete(`/departments/${id}`)
  },
}

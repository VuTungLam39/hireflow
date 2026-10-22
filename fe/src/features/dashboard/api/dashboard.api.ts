import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DashboardSummary } from '../types'

export const dashboardApi = {
  summary: async () =>
    (await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary')).data.data,
}

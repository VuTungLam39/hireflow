import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DashboardSummary, FunnelParams, FunnelView } from '../types'

export const dashboardApi = {
  summary: async () =>
    (await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary')).data.data,

  funnel: async (params: FunnelParams) =>
    (await api.get<ApiResponse<FunnelView>>('/dashboard/funnel', { params })).data.data,
}

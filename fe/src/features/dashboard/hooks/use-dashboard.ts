import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
import type { FunnelParams } from '../types'

export const dashboardKeys = {
  summary: ['dashboard', 'summary'] as const,
  funnel: (params: FunnelParams) => ['dashboard', 'funnel', params] as const,
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: dashboardApi.summary,
    staleTime: 60_000,
  })
}

// F1: BE cache 5 phút; realtime không làm mới phễu vì báo cáo chấp nhận trễ
export function useFunnel(params: FunnelParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.funnel(params),
    queryFn: () => dashboardApi.funnel(params),
    staleTime: 5 * 60_000,
    enabled,
  })
}

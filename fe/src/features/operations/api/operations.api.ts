import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated, PaginationParams } from '@/types/api'
import type { AiIssue, QueueCounts, RetryAllResult } from '../types'

export const operationsApi = {
  issues: async (params: PaginationParams): Promise<Paginated<AiIssue>> => {
    const res = await api.get<ApiResponse<AiIssue[]>>('/admin/jobs/failed', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  queues: async () => (await api.get<ApiResponse<QueueCounts[]>>('/admin/queues')).data.data,

  retry: async (applicationId: string) => {
    await api.post(`/admin/jobs/${applicationId}/retry`)
  },

  retryAll: async () =>
    (await api.post<ApiResponse<RetryAllResult>>('/admin/jobs/retry-all')).data.data,
}

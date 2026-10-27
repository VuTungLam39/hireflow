import { api } from '@/lib/api-client'
import type { ApiResponse, CursorMeta, CursorPage } from '@/types/api'
import type { AuditLogItem, AuditLogParams } from '../types'

export const auditApi = {
  list: async (
    params: AuditLogParams & { cursor?: string; limit?: number },
  ): Promise<CursorPage<AuditLogItem>> => {
    const res = await api.get<ApiResponse<AuditLogItem[], CursorMeta>>('/audit-logs', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },
}

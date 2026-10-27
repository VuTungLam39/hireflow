import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { auditApi } from '../api/audit.api'
import type { AuditLogParams } from '../types'

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditLogParams) => [...auditKeys.all, params] as const,
}

// F-AUDIT-01
export function useAuditLogs(params: AuditLogParams) {
  return useInfiniteQuery({
    queryKey: auditKeys.list(params),
    queryFn: ({ pageParam }) => auditApi.list({ ...params, cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  })
}

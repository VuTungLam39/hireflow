import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import type { PaginationParams } from '@/types/api'
import { operationsApi } from '../api/operations.api'

export const operationKeys = {
  all: ['operations'] as const,
  issues: (params: PaginationParams) => [...operationKeys.all, 'issues', params] as const,
  queues: () => [...operationKeys.all, 'queues'] as const,
}

export function useAiIssues(params: PaginationParams) {
  return useQuery({
    queryKey: operationKeys.issues(params),
    queryFn: () => operationsApi.issues(params),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  })
}

export function useQueueCounts() {
  return useQuery({
    queryKey: operationKeys.queues(),
    queryFn: operationsApi.queues,
    refetchInterval: 5_000,
  })
}

export function useRetryIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: operationsApi.retry,
    onSuccess: () => {
      toast.success('Đã đưa hồ sơ vào hàng đợi chấm lại')
      return queryClient.invalidateQueries({ queryKey: operationKeys.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useRetryAll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: operationsApi.retryAll,
    onSuccess: ({ queued, failed }) => {
      toast.success(
        failed
          ? `Đã chạy lại ${queued} hồ sơ, ${failed} hồ sơ không chạy lại được`
          : `Đã chạy lại ${queued} hồ sơ`,
      )
      return queryClient.invalidateQueries({ queryKey: operationKeys.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

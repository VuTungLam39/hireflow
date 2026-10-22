import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { PaginationParams } from '@/types/api'
import { publicJobsApi, type ApplyInput } from '../api/public-jobs.api'

export const publicJobKeys = {
  all: ['public-jobs'] as const,
  list: (params: PaginationParams) => [...publicJobKeys.all, 'list', params] as const,
  detail: (id: string) => [...publicJobKeys.all, 'detail', id] as const,
}

const MINUTE = 60_000

export function usePublicJobs(params: PaginationParams) {
  return useQuery({
    queryKey: publicJobKeys.list(params),
    queryFn: () => publicJobsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: MINUTE,
  })
}

export function usePublicJob(id: string) {
  return useQuery({
    queryKey: publicJobKeys.detail(id),
    queryFn: () => publicJobsApi.get(id),
    staleTime: MINUTE,
  })
}

/** Nộp CV kèm tiến trình upload (0–100) */
export function useApply(jobId: string) {
  const [progress, setProgress] = useState<number | null>(null)
  const mutation = useMutation({
    mutationFn: (input: ApplyInput) => publicJobsApi.apply(jobId, input, setProgress),
    onSettled: () => setProgress(null),
  })
  return { ...mutation, progress }
}

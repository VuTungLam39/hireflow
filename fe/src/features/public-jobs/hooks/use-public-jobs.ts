import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { PaginationParams } from '@/types/api'
import type { PublicJobsListParams } from '../schemas'
import { publicJobsApi, type ApplyInput } from '../api/public-jobs.api'

export const publicJobKeys = {
  all: ['public-jobs'] as const,
  list: (params: PublicJobsListParams) => [...publicJobKeys.all, 'list', params] as const,
  departments: (search?: string, company?: string) =>
    [...publicJobKeys.all, 'departments', company ?? '', search ?? ''] as const,
  detail: (id: string) => [...publicJobKeys.all, 'detail', id] as const,
  companies: (params: PaginationParams) => [...publicJobKeys.all, 'companies', params] as const,
  company: (slug: string) => [...publicJobKeys.all, 'company', slug] as const,
  track: (token: string) => [...publicJobKeys.all, 'track', token] as const,
}

const MINUTE = 60_000

export function usePublicJobs(params: PublicJobsListParams) {
  return useQuery({
    queryKey: publicJobKeys.list(params),
    queryFn: () => publicJobsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: MINUTE,
  })
}

export function usePublicDepartments(search?: string, company?: string) {
  return useQuery({
    queryKey: publicJobKeys.departments(search, company),
    queryFn: () => publicJobsApi.departments(search, company),
    enabled: !!company,
    placeholderData: keepPreviousData,
    staleTime: MINUTE,
  })
}

export function usePublicCompanies(params: PaginationParams) {
  return useQuery({
    queryKey: publicJobKeys.companies(params),
    queryFn: () => publicJobsApi.companies(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * MINUTE,
  })
}

export function usePublicCompany(slug: string) {
  return useQuery({
    queryKey: publicJobKeys.company(slug),
    queryFn: () => publicJobsApi.company(slug),
    enabled: !!slug,
    staleTime: 5 * MINUTE,
    retry: false,
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

// US-26 · BR-APP-14
export function useApplicationTrack(token: string) {
  return useQuery({
    queryKey: publicJobKeys.track(token),
    queryFn: () => publicJobsApi.track(token),
    enabled: !!token,
    retry: false,
  })
}

export function useWithdrawApplication(token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => publicJobsApi.withdraw(token),
    onSuccess: (data) => qc.setQueryData(publicJobKeys.track(token), data),
  })
}

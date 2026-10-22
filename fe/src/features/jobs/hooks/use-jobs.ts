import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { jobsApi } from '../api/jobs.api'
import type { JobListParams } from '../schemas/job.schema'
import type { JobInput, RequirementInput } from '../types'

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (params: Partial<JobListParams>) => [...jobKeys.lists(), params] as const,
  detail: (id: string) => [...jobKeys.all, 'detail', id] as const,
  /** Đặt dưới detail để invalidate job thì bảng xếp hạng cũng làm mới */
  ranking: (id: string) => [...jobKeys.detail(id), 'ranking'] as const,
}

const MINUTE = 60_000

export function useJobs(params: JobListParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => jobsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: MINUTE,
  })
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: jobKeys.detail(id ?? ''),
    queryFn: () => jobsApi.get(id!),
    enabled: !!id,
    staleTime: MINUTE,
  })
}

/** Danh sách job rút gọn cho ô chọn (bộ lọc application) */
export function useJobOptions() {
  const params = { page: 1, limit: 100, sortBy: 'title', order: 'ASC' } as const
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => jobsApi.list(params),
    select: (data) => data.items,
    staleTime: MINUTE,
  })
}

export function useSaveJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: JobInput }) =>
      id ? jobsApi.update(id, input) : jobsApi.create(input),
    onSuccess: (job, { id }) => {
      toast.success(id ? 'Đã lưu thông tin job' : 'Đã tạo job nháp')
      queryClient.setQueryData(jobKeys.detail(job.id), job)
      return queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
    },
  })
}

export function useSuggestRequirements() {
  return useMutation({
    mutationFn: jobsApi.suggestRequirements,
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useSaveRequirements() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, requirements }: { id: string; requirements: RequirementInput[] }) =>
      jobsApi.saveRequirements(id, requirements),
    onSuccess: ({ jdVersion }, { id }) => {
      toast.success(`Đã lưu tiêu chí (phiên bản ${jdVersion}). Điểm đang được tính lại.`)
      return queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

function useJobAction(action: (id: string) => Promise<unknown>, message: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      toast.success(message)
      return queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export const usePublishJob = () => useJobAction(jobsApi.publish, 'Đã đăng tin tuyển dụng')
export const useCloseJob = () => useJobAction(jobsApi.close, 'Đã đóng tin tuyển dụng')

/** Xoá job nháp chưa có hồ sơ. Job đã mất nên chỉ làm mới danh sách, bỏ cache chi tiết. */
export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: jobsApi.remove,
    onSuccess: (_data, id) => {
      toast.success('Đã xoá tin nháp')
      queryClient.removeQueries({ queryKey: jobKeys.detail(id) })
      return queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

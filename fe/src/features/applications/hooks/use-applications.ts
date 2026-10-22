import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { jobKeys } from '@/features/jobs'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import { applicationsApi } from '../api/applications.api'
import { AI_POLL_INTERVAL, APPLICATION_STATUS, type ApplicationStatus } from '../constants'
import type { ApplicationListParams } from '../schemas/application.schema'
import type { ApplicationDetail, HrUploadInput } from '../types'

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (params: ApplicationListParams) => [...applicationKeys.lists(), params] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
  history: (id: string) => [...applicationKeys.detail(id), 'history'] as const,
  notes: (id: string) => [...applicationKeys.detail(id), 'notes'] as const,
}

/**
 * Query options dùng chung cho component (useQuery) và loader của router
 * (ensureQueryData) – cùng query key nên dùng chung cache (FE Architecture mục 2.1).
 */
export const applicationQueries = {
  list: (params: ApplicationListParams) =>
    queryOptions({
      queryKey: applicationKeys.list(params),
      queryFn: () => applicationsApi.list(params),
      placeholderData: keepPreviousData, // đổi trang không bị nháy
      staleTime: 30_000,
    }),
}

export function useApplications(params: ApplicationListParams) {
  return useQuery(applicationQueries.list(params))
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsApi.get(id),
    // Chờ hoặc đang chấm thì hỏi lại định kỳ; dừng khi DONE/FAILED hoặc rời trang
    refetchInterval: (query) => {
      const status = query.state.data?.aiStatus
      return status === 'PENDING' || status === 'PROCESSING' ? AI_POLL_INTERVAL : false
    },
    staleTime: 30_000,
  })
}

export function useApplicationHistory(id: string) {
  return useQuery({
    queryKey: applicationKeys.history(id),
    queryFn: () => applicationsApi.history(id),
  })
}

export function useApplicationNotes(id: string) {
  return useQuery({
    queryKey: applicationKeys.notes(id),
    queryFn: () => applicationsApi.notes(id),
  })
}

export function useAddNote(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => applicationsApi.addNote(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationKeys.notes(id) }),
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

interface ChangeStatusVars {
  status: ApplicationStatus
  reason?: string
  /** Hiring Manager từ chối ở bước OFFER: đi route /decline-offer (BR-STS-05) */
  declineOffer?: boolean
}

/**
 * Đổi trạng thái có optimistic update: giao diện đổi ngay, lỗi thì trả lại như cũ.
 * OFFER → HIRED gọi route /hire; Hiring Manager từ chối ở OFFER gọi /decline-offer.
 */
export function useChangeStatus(id: string) {
  const queryClient = useQueryClient()
  const key = applicationKeys.detail(id)

  return useMutation({
    mutationFn: ({ status, reason, declineOffer }: ChangeStatusVars) =>
      status === 'HIRED'
        ? applicationsApi.hire(id)
        : declineOffer
          ? applicationsApi.declineOffer(id, reason ?? '')
          : applicationsApi.changeStatus(id, { status, reason }),
    onMutate: async ({ status }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ApplicationDetail>(key)
      if (previous) queryClient.setQueryData(key, { ...previous, status })
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(getErrorMessage(error))
      // Dữ liệu trên màn hình đã cũ (người khác vừa đổi) → tải lại
      if (getErrorCode(error) === 'INVALID_STATUS_TRANSITION') {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
    onSuccess: (_data, { status }) => {
      toast.success(`Đã chuyển sang "${APPLICATION_STATUS[status].label}"`)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
      ]),
  })
}

export function useRescore(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => applicationsApi.rescore(id),
    onSuccess: () => {
      toast.info('Đã gửi yêu cầu chấm lại')
      return queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useCvUrl() {
  return useMutation({
    mutationFn: applicationsApi.cvUrl,
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

/** HR tải CV hộ ứng viên (US-15) kèm tiến trình upload 0–100 */
export function useUploadForCandidate(jobId: string) {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<number | null>(null)
  const mutation = useMutation({
    mutationFn: (input: HrUploadInput) =>
      applicationsApi.uploadForCandidate(jobId, input, setProgress),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
        // Số hồ sơ và pipeline của job thay đổi
        queryClient.invalidateQueries({ queryKey: jobKeys.all }),
      ]),
    onSettled: () => setProgress(null),
  })
  return { ...mutation, progress }
}

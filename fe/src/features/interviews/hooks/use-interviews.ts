import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { interviewsApi } from '../api/interviews.api'
import type { FeedbackInput, InterviewListParams, ScheduleInput } from '../types'

export const interviewKeys = {
  all: ['interviews'] as const,
  forApplication: (applicationId: string) =>
    [...interviewKeys.all, 'application', applicationId] as const,
  calendar: (params: InterviewListParams) => [...interviewKeys.all, 'calendar', params] as const,
  interviewers: () => [...interviewKeys.all, 'interviewers'] as const,
}

// F-INT-01, F-INT-02
export function useApplicationInterviews(applicationId: string) {
  return useQuery({
    queryKey: interviewKeys.forApplication(applicationId),
    queryFn: () => interviewsApi.forApplication(applicationId),
  })
}

export function useInterviews(params: InterviewListParams) {
  return useQuery({
    queryKey: interviewKeys.calendar(params),
    queryFn: () => interviewsApi.list(params),
    staleTime: 30_000,
  })
}

export function useInterviewers(enabled: boolean) {
  return useQuery({
    queryKey: interviewKeys.interviewers(),
    queryFn: interviewsApi.interviewers,
    enabled,
    staleTime: 5 * 60_000,
  })
}

const useInvalidate = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: interviewKeys.all })
}

export function useScheduleInterview(applicationId: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: ScheduleInput) => interviewsApi.schedule(applicationId, input),
    onSuccess: () => {
      toast.success('Đã đặt lịch và báo cho người phỏng vấn')
      return invalidate()
    },
  })
}

export function useUpdateInterview() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ScheduleInput> }) =>
      interviewsApi.update(id, input),
    onSuccess: () => {
      toast.success('Đã cập nhật lịch phỏng vấn')
      return invalidate()
    },
  })
}

export function useCancelInterview() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      interviewsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Đã huỷ buổi phỏng vấn')
      return invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

// F-INT-03
export function useSubmitFeedback() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FeedbackInput }) =>
      interviewsApi.feedback(id, input),
    onSuccess: () => {
      toast.success('Đã lưu phiếu đánh giá')
      return invalidate()
    },
  })
}

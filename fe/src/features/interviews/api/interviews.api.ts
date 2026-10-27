import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type {
  FeedbackInput,
  Interview,
  InterviewFeedback,
  Interviewer,
  InterviewListParams,
  ScheduleInput,
} from '../types'

export const interviewsApi = {
  list: async (params: InterviewListParams) =>
    (await api.get<ApiResponse<Interview[]>>('/interviews', { params })).data.data,

  forApplication: async (applicationId: string) =>
    (await api.get<ApiResponse<Interview[]>>(`/applications/${applicationId}/interviews`)).data
      .data,

  interviewers: async () =>
    (await api.get<ApiResponse<Interviewer[]>>('/interviews/interviewers')).data.data,

  schedule: async (applicationId: string, input: ScheduleInput) =>
    (await api.post<ApiResponse<Interview>>(`/applications/${applicationId}/interviews`, input))
      .data.data,

  update: async (id: string, input: Partial<ScheduleInput>) =>
    (await api.patch<ApiResponse<Interview>>(`/interviews/${id}`, input)).data.data,

  cancel: async (id: string, reason: string) =>
    (await api.patch<ApiResponse<Interview>>(`/interviews/${id}/cancel`, { reason })).data.data,

  feedback: async (id: string, input: FeedbackInput) =>
    (await api.put<ApiResponse<InterviewFeedback>>(`/interviews/${id}/feedback`, input)).data.data,
}

import { api, SLOW_TIMEOUT_MS } from '@/lib/api-client'
import type { ApiResponse, CursorMeta } from '@/types/api'
import type {
  FeedbackInput,
  Interview,
  InterviewFeedback,
  Interviewer,
  InterviewListParams,
  QuestionSuggestion,
  ScheduleInput,
} from '../types'

export const interviewsApi = {
  /** E5 · BR-INT-04: 2–3 câu hỏi cho mỗi tiêu chí, chỉ người được giao gọi được */
  suggestQuestions: async (id: string) =>
    (
      await api.post<ApiResponse<{ items: QuestionSuggestion[]; cached: boolean }>>(
        `/interviews/${id}/question-suggestions`,
        null,
        { timeout: SLOW_TIMEOUT_MS },
      )
    ).data.data,

  // F-INT-02
  list: async (params: InterviewListParams) => {
    const items: Interview[] = []
    let cursor: string | undefined
    do {
      const res = await api.get<ApiResponse<Interview[], CursorMeta>>('/interviews', {
        params: { ...params, limit: 200, cursor },
      })
      items.push(...res.data.data)
      cursor = res.data.meta?.nextCursor ?? undefined
    } while (cursor)
    return items
  },

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

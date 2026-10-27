import type { ApplicationDetail } from '@/features/applications'
import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { JobMatchesData } from '../types'

export const matchingApi = {
  get: async (jobId: string) =>
    (await api.get<ApiResponse<JobMatchesData>>(`/jobs/${jobId}/matches`)).data.data,

  invite: async (jobId: string, candidateId: string) =>
    (await api.post<ApiResponse<ApplicationDetail>>(`/jobs/${jobId}/matches/${candidateId}/invite`))
      .data.data,
}

import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { RankingData } from '../types'

export const rankingApi = {
  /**
   * Đề xuất bổ sung vào kickoff mục 10.2: một endpoint trả về tiêu chí + mức khớp
   * của mọi application đã chấm trong job, để FE xếp hạng lại không cần gọi thêm.
   */
  get: async (jobId: string) =>
    (await api.get<ApiResponse<RankingData>>(`/jobs/${jobId}/ranking`)).data.data,
}

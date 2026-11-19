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

  // MVP 3.1 · BR-RANK-02: trọng số của riêng người xem
  myWeights: async (jobId: string) =>
    (await api.get<ApiResponse<MyWeights | null>>(`/jobs/${jobId}/ranking-weights`)).data.data,

  saveMyWeights: async (
    jobId: string,
    input: { jdVersion: number; weights: Record<string, number> },
  ) => (await api.put<ApiResponse<MyWeights>>(`/jobs/${jobId}/ranking-weights`, input)).data.data,
}

export interface MyWeights {
  jdVersion: number
  weights: Record<string, number>
  updatedAt: string
}

import { api } from '@/lib/api-client'
import type { ApiResponse, CursorMeta, CursorPage } from '@/types/api'
import type {
  CandidateDetail,
  CandidateListItem,
  CandidateListParams,
  CandidateUpdateInput,
} from '../types'

export const candidatesApi = {
  /** Phân trang cursor: gửi lại đúng nextCursor của trang trước */
  list: async (params: CandidateListParams): Promise<CursorPage<CandidateListItem>> => {
    const res = await api.get<ApiResponse<CandidateListItem[], CursorMeta>>('/candidates', {
      params,
    })
    return { items: res.data.data, meta: res.data.meta! }
  },

  get: async (id: string) =>
    (await api.get<ApiResponse<CandidateDetail>>(`/candidates/${id}`)).data.data,

  update: async (id: string, input: CandidateUpdateInput) =>
    (await api.patch<ApiResponse<CandidateDetail>>(`/candidates/${id}`, input)).data.data,

  /** Không hoàn tác: xoá CV, bằng chứng, thông tin liên hệ; giữ trạng thái và điểm (BR-DATA-03) */
  anonymize: async (id: string) =>
    (await api.post<ApiResponse<CandidateDetail>>(`/candidates/${id}/anonymize`)).data.data,
}

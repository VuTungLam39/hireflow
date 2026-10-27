import type { AxiosProgressEvent } from 'axios'
import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated } from '@/types/api'
import type { ApplicationStatus } from '../constants'
import type { ApplicationListParams } from '../schemas/application.schema'
import type {
  ApplicationDetail,
  ApplicationListItem,
  ApplicationNote,
  HrUploadInput,
  StatusHistoryItem,
} from '../types'

export const applicationsApi = {
  list: async (params: ApplicationListParams): Promise<Paginated<ApplicationListItem>> => {
    const res = await api.get<ApiResponse<ApplicationListItem[]>>('/applications', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  get: async (id: string) =>
    (await api.get<ApiResponse<ApplicationDetail>>(`/applications/${id}`)).data.data,

  history: async (id: string) =>
    (await api.get<ApiResponse<StatusHistoryItem[]>>(`/applications/${id}/history`)).data.data,

  notes: async (id: string) =>
    (await api.get<ApiResponse<ApplicationNote[]>>(`/applications/${id}/notes`)).data.data,

  addNote: async (id: string, content: string) =>
    (await api.post<ApiResponse<ApplicationNote>>(`/applications/${id}/notes`, { content })).data
      .data,

  changeStatus: async (id: string, input: { status: ApplicationStatus; reason?: string }) =>
    (await api.patch<ApiResponse<ApplicationDetail>>(`/applications/${id}/status`, input)).data
      .data,

  /** OFFER → HIRED: route riêng, quyền application:approve-offer */
  hire: async (id: string) =>
    (await api.patch<ApiResponse<ApplicationDetail>>(`/applications/${id}/hire`)).data.data,

  /** Hiring Manager từ chối ở bước OFFER (BR-STS-05): OFFER → REJECTED, bắt buộc lý do */
  declineOffer: async (id: string, reason: string) =>
    (
      await api.patch<ApiResponse<ApplicationDetail>>(`/applications/${id}/decline-offer`, {
        reason,
      })
    ).data.data,

  /** HR tải CV hộ ứng viên vào job OPEN (BR-APP-10). Multipart, nguồn HR_UPLOAD. */
  uploadForCandidate: async (
    jobId: string,
    input: HrUploadInput,
    onProgress?: (percent: number) => void,
  ) => {
    const form = new FormData()
    form.append('fullName', input.fullName)
    form.append('email', input.email)
    if (input.phone) form.append('phone', input.phone)
    form.append('consentConfirmed', String(input.consentConfirmed))
    form.append('cv', input.cv)
    const res = await api.post<ApiResponse<ApplicationDetail>>(
      `/jobs/${jobId}/applications`,
      form,
      {
        // Bỏ Content-Type mặc định (json) để trình duyệt tự đặt multipart boundary
        headers: { 'Content-Type': undefined },
        onUploadProgress: (e: AxiosProgressEvent) =>
          e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      },
    )
    return res.data.data
  },

  /** Chấm lại – 202, theo dõi qua aiStatus */
  rescore: async (id: string) => {
    await api.post(`/applications/${id}/rescore`)
  },

  /** F-APP-10: REJECTED/WITHDRAWN → SCREENING, bắt buộc lý do */
  reopen: async (id: string, reason: string) =>
    (await api.patch<ApiResponse<ApplicationDetail>>(`/applications/${id}/reopen`, { reason })).data
      .data,

  /** F-FILE-02: nhập text cho CV không đọc được chữ, hệ thống chấm lại */
  enterCvText: async (id: string, text: string) =>
    (await api.put<ApiResponse<ApplicationDetail>>(`/applications/${id}/cv-text`, { text })).data
      .data,

  /** Presigned URL xem CV gốc, hết hạn sau 5 phút */
  cvUrl: async (fileId: string) =>
    (await api.get<ApiResponse<{ url: string; expiresAt: string }>>(`/files/${fileId}/url`)).data
      .data,
}

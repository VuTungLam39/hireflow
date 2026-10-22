import type { AxiosProgressEvent } from 'axios'
import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated, PaginationParams } from '@/types/api'
import type { PublicJob, PublicJobSummary } from '../types'

export interface ApplyInput {
  fullName: string
  email: string
  phone: string
  cv: File
  consent: boolean
  /** Ô ẩn chống bot: người thật luôn để trống */
  website: string
}

export const publicJobsApi = {
  list: async (params: PaginationParams): Promise<Paginated<PublicJobSummary>> => {
    const res = await api.get<ApiResponse<PublicJobSummary[]>>('/public/jobs', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  get: async (id: string) =>
    (await api.get<ApiResponse<PublicJob>>(`/public/jobs/${id}`)).data.data,

  /** Multipart: thông tin + file CV (kickoff mục 10.2) */
  apply: async (jobId: string, input: ApplyInput, onProgress?: (percent: number) => void) => {
    const form = new FormData()
    form.append('fullName', input.fullName)
    form.append('email', input.email)
    form.append('phone', input.phone)
    form.append('consent', String(input.consent))
    form.append('website', input.website)
    form.append('cv', input.cv)

    await api.post(`/public/jobs/${jobId}/apply`, form, {
      // Bỏ Content-Type mặc định (json) để trình duyệt tự đặt multipart boundary
      headers: { 'Content-Type': undefined },
      onUploadProgress: (e: AxiosProgressEvent) =>
        e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
  },
}

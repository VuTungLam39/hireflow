import type { AxiosProgressEvent } from 'axios'
import { api, SLOW_TIMEOUT_MS } from '@/lib/api-client'
import type { ApiResponse, Paginated } from '@/types/api'
import type { PaginationParams } from '@/types/api'
import type { PublicJobsListParams } from '../schemas'
import type {
  ApplicationTrack,
  PublicCompanyCard,
  PublicCompanyPage,
  PublicDepartmentCount,
  PublicJob,
  PublicJobSummary,
} from '../types'

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
  list: async (params: PublicJobsListParams): Promise<Paginated<PublicJobSummary>> => {
    const res = await api.get<ApiResponse<PublicJobSummary[]>>('/public/jobs', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  // KH MVP 3 8.1: phòng ban thuộc từng công ty
  departments: async (search?: string, company?: string) =>
    (
      await api.get<ApiResponse<PublicDepartmentCount[]>>('/public/jobs/departments', {
        params: { search, company },
      })
    ).data.data,

  // US-23
  companies: async (params: PaginationParams): Promise<Paginated<PublicCompanyCard>> => {
    const res = await api.get<ApiResponse<PublicCompanyCard[]>>('/public/companies', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  company: async (slug: string) =>
    (await api.get<ApiResponse<PublicCompanyPage>>(`/public/companies/${slug}`)).data.data,

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
      timeout: SLOW_TIMEOUT_MS,
      onUploadProgress: (e: AxiosProgressEvent) =>
        e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
  },

  // US-26 · BR-APP-14
  // SG-05 · R5
  track: async (token: string) =>
    (await api.post<ApiResponse<ApplicationTrack>>('/public/applications/track', { token })).data
      .data,

  withdraw: async (token: string) =>
    (await api.post<ApiResponse<ApplicationTrack>>('/public/applications/withdraw', { token })).data
      .data,
}

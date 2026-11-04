import { env } from '@/config/env'
import { api } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { Company, CompanyInput, CompanyMedia, MediaKind, PublicCompany } from '../types'

/** Ảnh công khai đi qua API (BR-MEDIA-02); url từ BE là đường dẫn sau apiUrl */
export const mediaSrc = (media: Pick<CompanyMedia, 'url'>) => `${env.apiUrl}${media.url}`

export const companyApi = {
  get: async () => (await api.get<ApiResponse<Company>>('/company')).data.data,

  update: async (input: CompanyInput) =>
    (await api.put<ApiResponse<Company>>('/company', input)).data.data,

  upload: async ({ file, kind, alt }: { file: File; kind: MediaKind; alt?: string }) => {
    const form = new FormData()
    form.append('kind', kind)
    if (alt) form.append('alt', alt)
    form.append('file', file)
    return (
      await api.post<ApiResponse<CompanyMedia>>('/company/media', form, {
        // Bỏ Content-Type mặc định (json) để trình duyệt tự đặt multipart boundary
        headers: { 'Content-Type': undefined },
      })
    ).data.data
  },

  updateMedia: async (id: string, input: { alt?: string; position?: number }) =>
    (await api.patch<ApiResponse<CompanyMedia>>(`/company/media/${id}`, input)).data.data,

  removeMedia: async (id: string) => {
    await api.delete(`/company/media/${id}`)
  },

  publicGet: async () => (await api.get<ApiResponse<PublicCompany>>('/public/company')).data.data,
}

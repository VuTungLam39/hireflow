import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated } from '@/types/api'
import type { JobListParams } from '../schemas/job.schema'
import type { Job, JobInput, JobSummary, RequirementInput } from '../types'

export const jobsApi = {
  list: async (params: Partial<JobListParams>): Promise<Paginated<JobSummary>> => {
    const res = await api.get<ApiResponse<JobSummary[]>>('/jobs', { params })
    return { items: res.data.data, meta: res.data.meta! }
  },

  get: async (id: string) => (await api.get<ApiResponse<Job>>(`/jobs/${id}`)).data.data,

  create: async (input: JobInput) => (await api.post<ApiResponse<Job>>('/jobs', input)).data.data,

  update: async (id: string, input: JobInput) =>
    (await api.patch<ApiResponse<Job>>(`/jobs/${id}`, input)).data.data,

  /** AI tách JD đã lưu thành tiêu chí gợi ý (US-02). HR sửa rồi mới lưu. */
  suggestRequirements: async (id: string) =>
    (await api.post<ApiResponse<RequirementInput[]>>(`/jobs/${id}/requirements/suggest`)).data.data,

  /** Thay toàn bộ tiêu chí → BE tăng jdVersion và tính lại điểm trong queue (202) */
  saveRequirements: async (id: string, requirements: RequirementInput[]) =>
    (
      await api.put<ApiResponse<{ jdVersion: number }>>(`/jobs/${id}/requirements`, {
        requirements,
      })
    ).data.data,

  publish: async (id: string) =>
    (await api.patch<ApiResponse<Job>>(`/jobs/${id}/publish`)).data.data,

  close: async (id: string) => (await api.patch<ApiResponse<Job>>(`/jobs/${id}/close`)).data.data,

  /** Chỉ job DRAFT chưa có hồ sơ (BR-JOB-04); khác → 409 JOB_NOT_DELETABLE */
  remove: async (id: string) => {
    await api.delete(`/jobs/${id}`)
  },
}

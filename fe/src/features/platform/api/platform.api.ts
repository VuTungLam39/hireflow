import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated, PaginationParams } from '@/types/api'
import type { OrganizationStatus } from '@/types/user'
import type {
  AiLimitsInput,
  OrgTransition,
  PlatformOrganization,
  PlatformOrganizationDetail,
  QueueCounts,
} from '../types'

export interface OrganizationListParams extends PaginationParams {
  status?: OrganizationStatus
}

// KH MVP 3 mục 8.2
export const platformApi = {
  list: async (params: OrganizationListParams): Promise<Paginated<PlatformOrganization>> => {
    const res = await api.get<ApiResponse<PlatformOrganization[]>>('/platform/organizations', {
      params,
    })
    return { items: res.data.data, meta: res.data.meta! }
  },

  get: async (id: string) =>
    (await api.get<ApiResponse<PlatformOrganizationDetail>>(`/platform/organizations/${id}`)).data
      .data,

  transition: async ({ id, kind, reason }: { id: string; kind: OrgTransition; reason?: string }) =>
    (
      await api.patch<ApiResponse<PlatformOrganizationDetail>>(
        `/platform/organizations/${id}/${kind}`,
        reason ? { reason } : {},
      )
    ).data.data,

  // BR-AI-11, F-PLAT-02
  updateAiLimits: async ({ id, ...input }: AiLimitsInput & { id: string }) =>
    (
      await api.patch<ApiResponse<PlatformOrganizationDetail>>(
        `/platform/organizations/${id}/ai-limits`,
        input,
      )
    ).data.data,

  queues: async () => (await api.get<ApiResponse<QueueCounts[]>>('/platform/queues')).data.data,
}

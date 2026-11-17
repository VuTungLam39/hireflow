import { api } from '@/lib/api-client'
import type { ApiResponse, Paginated, PaginationParams } from '@/types/api'
import type { OrganizationStatus } from '@/types/user'
import type { OrgTransition, PlatformOrganization, QueueCounts } from '../types'

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
    (await api.get<ApiResponse<PlatformOrganization>>(`/platform/organizations/${id}`)).data.data,

  transition: async ({ id, kind, reason }: { id: string; kind: OrgTransition; reason?: string }) =>
    (
      await api.patch<ApiResponse<PlatformOrganization>>(
        `/platform/organizations/${id}/${kind}`,
        reason ? { reason } : {},
      )
    ).data.data,

  queues: async () => (await api.get<ApiResponse<QueueCounts[]>>('/platform/queues')).data.data,
}

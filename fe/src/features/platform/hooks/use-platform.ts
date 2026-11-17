import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { platformApi, type OrganizationListParams } from '../api/platform.api'
import type { OrgTransition } from '../types'

export const platformKeys = {
  all: ['platform'] as const,
  lists: () => [...platformKeys.all, 'organizations'] as const,
  list: (params: OrganizationListParams) => [...platformKeys.lists(), params] as const,
  detail: (id: string) => [...platformKeys.all, 'organization', id] as const,
  queues: () => [...platformKeys.all, 'queues'] as const,
}

export function useOrganizations(params: OrganizationListParams) {
  return useQuery({
    queryKey: platformKeys.list(params),
    queryFn: () => platformApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useOrganization(id: string) {
  return useQuery({ queryKey: platformKeys.detail(id), queryFn: () => platformApi.get(id) })
}

const DONE: Record<OrgTransition, string> = {
  approve: 'Đã duyệt công ty',
  reject: 'Đã từ chối công ty',
  suspend: 'Đã khoá công ty',
  reactivate: 'Đã mở khoá công ty',
}

export function useOrgTransition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: platformApi.transition,
    onSuccess: (org, { kind }) => {
      toast.success(`${DONE[kind]} ${org.name}`)
      queryClient.setQueryData(platformKeys.detail(org.id), org)
      return queryClient.invalidateQueries({ queryKey: platformKeys.lists() })
    },
    onError: (error, { id }) => {
      toast.error(getErrorMessage(error))
      // INVALID_ORG_TRANSITION: trạng thái đã đổi ở nơi khác
      return queryClient.invalidateQueries({ queryKey: platformKeys.detail(id) })
    },
  })
}

export function usePlatformQueues() {
  return useQuery({
    queryKey: platformKeys.queues(),
    queryFn: platformApi.queues,
    refetchInterval: 5_000,
  })
}

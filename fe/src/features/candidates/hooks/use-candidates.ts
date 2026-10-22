import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { applicationKeys } from '@/features/applications'
import { getErrorMessage } from '@/lib/errors'
import { candidatesApi } from '../api/candidates.api'
import type { CandidateUpdateInput } from '../types'

export const candidateKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidateKeys.all, 'list'] as const,
  list: (search: string | undefined) => [...candidateKeys.lists(), { search }] as const,
  detail: (id: string) => [...candidateKeys.all, 'detail', id] as const,
}

const PAGE_SIZE = 20

/** Kho ứng viên cuộn vô hạn (FE Architecture mục 7.3: cursor + useInfiniteQuery) */
export function useCandidates(search: string | undefined) {
  return useInfiniteQuery({
    queryKey: candidateKeys.list(search),
    queryFn: ({ pageParam }) =>
      candidatesApi.list({ search, limit: PAGE_SIZE, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.nextCursor : null),
    staleTime: 30_000,
  })
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: () => candidatesApi.get(id),
    staleTime: 30_000,
  })
}

export function useUpdateCandidate(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CandidateUpdateInput) => candidatesApi.update(id, input),
    onSuccess: (candidate) => {
      toast.success('Đã lưu thông tin liên hệ')
      queryClient.setQueryData(candidateKeys.detail(id), candidate)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: candidateKeys.lists() }),
        // Tên ứng viên hiện trên bảng hồ sơ
        queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
      ])
    },
  })
}

export function useAnonymizeCandidate(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => candidatesApi.anonymize(id),
    onSuccess: (candidate) => {
      toast.success('Đã ẩn danh ứng viên')
      queryClient.setQueryData(candidateKeys.detail(id), candidate)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: candidateKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
      ])
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

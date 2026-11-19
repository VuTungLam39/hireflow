import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { applicationKeys } from '@/features/applications'
import { jobKeys, useSaveRequirements, type RequirementInput } from '@/features/jobs'
import { getErrorMessage } from '@/lib/errors'
import { rankingApi } from '../api/ranking.api'
import { useRankingDraft } from '../store'

export function useRanking(jobId: string) {
  return useQuery({
    queryKey: jobKeys.ranking(jobId),
    queryFn: () => rankingApi.get(jobId),
    staleTime: 30_000,
  })
}

/** Lưu trọng số: PUT tiêu chí (202) → BE tính lại điểm hàng loạt → xoá nháp, làm mới dữ liệu */
export function useSaveWeights(jobId: string) {
  const queryClient = useQueryClient()
  const reset = useRankingDraft((s) => s.reset)
  const save = useSaveRequirements()

  const saveWeights = (requirements: RequirementInput[]) =>
    save.mutate(
      { id: jobId, requirements },
      {
        onSuccess: () => {
          reset(jobId)
          void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
        },
      },
    )

  return { saveWeights, isPending: save.isPending }
}

// MVP 3.1 · BR-RANK-02
export function useMyWeights(jobId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...jobKeys.ranking(jobId), 'mine'] as const,
    queryFn: () => rankingApi.myWeights(jobId),
    enabled,
  })
}

export function useSaveMyWeights(jobId: string) {
  const queryClient = useQueryClient()
  const reset = useRankingDraft((s) => s.reset)
  return useMutation({
    mutationFn: (input: { jdVersion: number; weights: Record<string, number> }) =>
      rankingApi.saveMyWeights(jobId, input),
    onSuccess: (data) => {
      queryClient.setQueryData([...jobKeys.ranking(jobId), 'mine'], data)
      reset(jobId)
      toast.success('Đã lưu trọng số cho riêng bạn')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

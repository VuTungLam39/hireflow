import { useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationKeys } from '@/features/applications'
import { jobKeys, useSaveRequirements, type RequirementInput } from '@/features/jobs'
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

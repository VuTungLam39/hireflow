import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { applicationKeys } from '@/features/applications'
import { jobKeys } from '@/features/jobs'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import { matchingApi } from '../api/matching.api'

export const matchingKeys = {
  job: (jobId: string) => [...jobKeys.detail(jobId), 'matches'] as const,
}

const POLL_MS = 2_000

// F-MATCH-01
export function useJobMatches(jobId: string) {
  return useQuery({
    queryKey: matchingKeys.job(jobId),
    queryFn: () => matchingApi.get(jobId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || data.job.status === 'DRAFT') return false
      return data.pending ? POLL_MS : false
    },
  })
}

// F-MATCH-02, BR-MATCH-03
export function useInviteMatch(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (candidateId: string) => matchingApi.invite(jobId, candidateId),
    onSuccess: () => {
      toast.success('Đã mời ứng viên vào tin. Hồ sơ đang được chấm theo tiêu chí hiện hành.')
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
    onError: (error) => {
      toast.error(
        getErrorCode(error) === 'APPLICATION_DUPLICATED'
          ? 'Ứng viên đã có hồ sơ ở tin này'
          : getErrorMessage(error),
      )
      void queryClient.invalidateQueries({ queryKey: matchingKeys.job(jobId) })
    },
  })
}

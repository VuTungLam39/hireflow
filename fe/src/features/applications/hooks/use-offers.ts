import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { applicationsApi } from '../api/applications.api'
import type { OfferInput } from '../types'
import { applicationKeys } from './use-applications'

// MVP 3.1 · F-OFFER-01: đặt dưới detail để đổi offer thì hồ sơ cũng làm mới
export const offerKeys = (applicationId: string) =>
  [...applicationKeys.detail(applicationId), 'offers'] as const

export function useOffers(applicationId: string) {
  return useQuery({
    queryKey: offerKeys(applicationId),
    queryFn: () => applicationsApi.offers(applicationId),
  })
}

export function useSaveOffer(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: OfferInput }) =>
      id
        ? applicationsApi.updateOffer(id, input)
        : applicationsApi.createOffer(applicationId, input),
    onSuccess: () => {
      toast.success('Đã lưu offer nháp')
      return queryClient.invalidateQueries({ queryKey: offerKeys(applicationId) })
    },
  })
}

const DONE: Record<string, string> = {
  submit: 'Đã gửi duyệt',
  approve: 'Đã duyệt offer',
  return: 'Đã trả lại để sửa',
  send: 'Đã đánh dấu gửi offer',
  accept: 'Ứng viên đã nhận offer',
  decline: 'Đã ghi nhận ứng viên từ chối',
  withdraw: 'Đã rút offer',
}

export function useOfferAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: object }) =>
      applicationsApi.offerAction(id, action, body),
    onSuccess: (_d, { action }) => {
      toast.success(DONE[action] ?? 'Đã cập nhật offer')
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

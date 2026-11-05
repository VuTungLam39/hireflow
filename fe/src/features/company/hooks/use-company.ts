import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { companyApi } from '../api/company.api'
import type { CompanyInput, MediaKind } from '../types'

export const companyKeys = {
  all: ['company'] as const,
  detail: () => [...companyKeys.all, 'detail'] as const,
  public: () => [...companyKeys.all, 'public'] as const,
}

// F-ORG-01
export function useCompany() {
  return useQuery({ queryKey: companyKeys.detail(), queryFn: companyApi.get })
}

export function usePublicCompany() {
  return useQuery({
    queryKey: companyKeys.public(),
    queryFn: companyApi.publicGet,
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useSaveCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CompanyInput) => companyApi.update(input),
    onSuccess: (company) => {
      queryClient.setQueryData(companyKeys.detail(), company)
      void queryClient.invalidateQueries({ queryKey: companyKeys.public() })
      toast.success('Đã lưu. Trang tuyển dụng công khai sẽ cập nhật trong khoảng một phút.')
    },
  })
}

function useMediaMutation<T>(fn: (input: T) => Promise<unknown>, success: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success)
      return queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export const useUploadMedia = () =>
  useMediaMutation(
    (input: { file: File; kind: MediaKind; alt?: string }) => companyApi.upload(input),
    'Đã tải ảnh lên',
  )

export const useUpdateMedia = () =>
  useMediaMutation(
    ({ id, ...input }: { id: string; alt?: string; position?: number }) =>
      companyApi.updateMedia(id, input),
    'Đã lưu ảnh',
  )

/** Đổi chỗ hai ảnh: gửi cả hai cập nhật rồi báo một lần */
export const useSwapMedia = () =>
  useMediaMutation(
    ({ a, b }: { a: { id: string; position: number }; b: { id: string; position: number } }) =>
      Promise.all([
        companyApi.updateMedia(a.id, { position: b.position }),
        companyApi.updateMedia(b.id, { position: a.position }),
      ]),
    'Đã đổi thứ tự ảnh',
  )

export const useRemoveMedia = () =>
  useMediaMutation((id: string) => companyApi.removeMedia(id), 'Đã xoá ảnh')

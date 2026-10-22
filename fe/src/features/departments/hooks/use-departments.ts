import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { departmentsApi, type DepartmentListParams } from '../api/departments.api'
import type { DepartmentInput } from '../types'

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (params: DepartmentListParams) => [...departmentKeys.lists(), params] as const,
}

export function useDepartments(params: DepartmentListParams) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => departmentsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

/** Toàn bộ phòng ban cho ô chọn. Ít đổi nên cache 10 phút (FE Architecture mục 6.4). */
export function useDepartmentOptions() {
  return useQuery({
    queryKey: departmentKeys.list({ page: 1, limit: 100 }),
    queryFn: () => departmentsApi.list({ page: 1, limit: 100 }),
    select: (data) => data.items,
    staleTime: 10 * 60_000,
  })
}

export function useSaveDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: DepartmentInput }) =>
      id ? departmentsApi.update(id, input) : departmentsApi.create(input),
    onSuccess: (_, { id }) => {
      toast.success(id ? 'Đã cập nhật phòng ban' : 'Đã tạo phòng ban')
      return queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: departmentsApi.remove,
    onSuccess: () => {
      toast.success('Đã xoá phòng ban')
      return queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

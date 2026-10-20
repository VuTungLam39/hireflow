import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { usersApi, type UpdateUserInput, type UserListParams } from '../api/users.api'

/** Query key theo dạng phân cấp để dễ invalidate cả nhóm */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
    // Giữ dữ liệu trang cũ khi chuyển trang để bảng không bị nháy
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      toast.success('Đã tạo người dùng')
      return queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersApi.update(id, input),
    onSuccess: () => {
      toast.success('Đã cập nhật')
      return queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      toast.success('Đã xoá người dùng')
      return queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

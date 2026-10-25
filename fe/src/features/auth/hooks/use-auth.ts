import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { paths } from '@/routes/paths'
import { useAuthStore, useIsAuthenticated } from '@/stores/auth.store'
import { authApi } from '../api/auth.api'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/** Đăng nhập rồi quay lại trang người dùng định vào trước đó (nếu có) */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? paths.home

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, tokens }) => {
      setSession(user, tokens)
      toast.success(`Xin chào, ${user.fullName}`)
      navigate(from, { replace: true })
    },
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.logout,
    // Dù gọi API lỗi vẫn xoá phiên ở client
    onSettled: () => {
      clear()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  })
}

/** Đổi mật khẩu. Lỗi để form tự xử lý (gắn vào đúng ô) */
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => toast.success('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất'),
  })
}

/** Đồng bộ thông tin user mới nhất từ server vào store */
export function useMe() {
  const isAuthenticated = useIsAuthenticated()
  const setUser = useAuthStore((s) => s.setUser)

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (query.data) setUser(query.data)
  }, [query.data, setUser])

  return query
}

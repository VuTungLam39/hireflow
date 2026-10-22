import { hasPermission, type Permission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/auth.store'

/** true nếu user hiện tại có permission. Chỉ dùng để ẩn/hiện UI, BE vẫn kiểm lại. */
export function usePermission(permission: Permission): boolean {
  return useAuthStore((s) => hasPermission(s.user, permission))
}

import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/use-permission'
import type { Permission } from '@/lib/permissions'

interface CanProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Ẩn/hiện theo quyền: <Can permission={Permission.JobCreate}>...</Can>.
 * Chỉ phục vụ trải nghiệm, không phải lớp bảo mật (BE vẫn kiểm).
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  return usePermission(permission) ? children : fallback
}

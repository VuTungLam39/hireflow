import type { Permission } from '@/lib/permissions'

/** Role theo kickoff mục 4.1 (Interviewer thêm ở MVP 2). Giá trị khớp enum Role của backend. */
export const Role = {
  Admin: 'admin',
  Hr: 'hr',
  HiringManager: 'hiring_manager',
  Interviewer: 'interviewer',
  // MVP 3 · BR-TEN-04
  PlatformAdmin: 'platform_admin',
} as const
export type Role = (typeof Role)[keyof typeof Role]

/** Vai trong một công ty; Quản trị sàn không tạo từ màn Người dùng (BR-ACC-01) */
export const STAFF_ROLES = [Role.Admin, Role.Hr, Role.HiringManager, Role.Interviewer] as const

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Admin]: 'Admin',
  [Role.Hr]: 'HR',
  [Role.HiringManager]: 'Hiring Manager',
  [Role.Interviewer]: 'Interviewer',
  [Role.PlatformAdmin]: 'Quản trị sàn',
}

/** BR-ORG-04 */
export type OrganizationStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'

export interface UserOrganization {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
}

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  departmentId: string | null
  department?: { id: string; name: string } | null
  /** null với Quản trị sàn (KH MVP 3 mục 8.3) */
  organization?: UserOrganization | null
  /** BE trả kèm ở /auth/me; nếu chưa có thì FE tự suy từ role (lib/permissions.ts) */
  permissions?: Permission[]
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

/** Refresh token không có ở đây: backend đặt nó trong cookie httpOnly */
export interface AccessToken {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

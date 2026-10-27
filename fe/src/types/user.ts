import type { Permission } from '@/lib/permissions'

/** Role theo kickoff mục 4.1 (Interviewer thêm ở MVP 2). Giá trị khớp enum Role của backend. */
export const Role = {
  Admin: 'admin',
  Hr: 'hr',
  HiringManager: 'hiring_manager',
  Interviewer: 'interviewer',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Admin]: 'Admin',
  [Role.Hr]: 'HR',
  [Role.HiringManager]: 'Hiring Manager',
  [Role.Interviewer]: 'Người phỏng vấn',
}

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  departmentId: string | null
  department?: { id: string; name: string } | null
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

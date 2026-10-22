import { Role, type User } from '@/types/user'

/**
 * Chuỗi permission dùng đúng như backend (Backend Architecture mục 10.2, kickoff mục 11.1).
 * FE chỉ dùng để ẩn/hiện giao diện; quyết định thật nằm ở BE.
 */
export const Permission = {
  UserManage: 'user:manage',
  DepartmentManage: 'department:manage',
  JobRead: 'job:read',
  JobCreate: 'job:create',
  JobUpdate: 'job:update',
  JobPublish: 'job:publish',
  CandidateRead: 'candidate:read',
  CandidateUpdate: 'candidate:update',
  CandidateAnonymize: 'candidate:anonymize',
  ApplicationRead: 'application:read',
  ApplicationCreate: 'application:create',
  ApplicationUpdateStatus: 'application:update-status',
  ApplicationApproveOffer: 'application:approve-offer',
  CvRead: 'cv:read',
  AiChat: 'ai:chat',
  AiRescore: 'ai:rescore',
  DashboardRead: 'dashboard:read',
} as const
export type Permission = (typeof Permission)[keyof typeof Permission]

const P = Permission

/** Bảng dự phòng khi BE chưa trả `permissions` trong /auth/me */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.Admin]: Object.values(Permission),
  [Role.Hr]: [
    P.JobRead,
    P.JobCreate,
    P.JobUpdate,
    P.JobPublish,
    P.CandidateRead,
    P.CandidateUpdate,
    P.ApplicationRead,
    P.ApplicationCreate,
    P.ApplicationUpdateStatus,
    P.CvRead,
    P.AiChat,
    P.AiRescore,
    P.DashboardRead,
  ],
  [Role.HiringManager]: [
    P.JobRead,
    P.CandidateRead,
    P.ApplicationRead,
    P.ApplicationApproveOffer,
    P.CvRead,
    P.AiChat,
    P.DashboardRead,
  ],
}

export function getPermissions(
  user: Pick<User, 'role' | 'permissions'> | null,
): readonly Permission[] {
  if (!user) return []
  return user.permissions ?? ROLE_PERMISSIONS[user.role] ?? []
}

export function hasPermission(
  user: Pick<User, 'role' | 'permissions'> | null,
  permission: Permission,
): boolean {
  return getPermissions(user).includes(permission)
}

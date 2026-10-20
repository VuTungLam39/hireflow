export const Role = {
  Admin: 'admin',
  User: 'user',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
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

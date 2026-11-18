import type { OrganizationStatus } from '@/types/user'

/** KH MVP 3 mục 8.2: thông tin công ty và số đếm, không có dữ liệu tuyển dụng (BR-TEN-04) */
export interface PlatformOrganization {
  id: string
  name: string
  slug: string
  taxCode: string | null
  website: string | null
  status: OrganizationStatus
  statusReason: string | null
  approvedAt: string | null
  createdAt: string
  aiDailyScoreLimit: number
  aiDailyChatLimit: number
  adminEmail: string | null
  userCount: number
  openJobs: number
  applications30d: number
}

export type OrgTransition = 'approve' | 'reject' | 'suspend' | 'reactivate'

/** Số việc trong một hàng đợi BullMQ của toàn hệ thống */
export interface QueueCounts {
  name: string
  waiting: number
  active: number
  delayed: number
  failed: number
}

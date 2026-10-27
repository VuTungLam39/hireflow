import type { AiStatus, ApplicationStatus } from '@/features/applications'

export type NotificationType = 'CV_SCORED' | 'CV_FAILED'

export interface NotificationItem {
  id: string
  type: NotificationType
  readAt: string | null
  createdAt: string
  application: {
    id: string
    candidateName: string
    jobId: string
    jobTitle: string
    score: number | null
    aiError: string | null
  } | null
}

/** Sự kiện trên stream GET /notifications/stream */
export type RealtimeEvent =
  | { event: 'ready'; data: { unreadCount: number } }
  | { event: 'notification'; data: { notification: NotificationItem; unreadCount: number } }
  | {
      event: 'application'
      data: { applicationId: string; jobId: string; status: ApplicationStatus; aiStatus: AiStatus }
    }

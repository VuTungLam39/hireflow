import type { AiStatus } from '@/features/applications'

/** API Contract 4.10 */
export interface AiIssue {
  id: string
  aiStatus: AiStatus
  aiError: string | null
  stuck: boolean
  createdAt: string
  updatedAt: string
  candidate: { id: string; fullName: string }
  job: { id: string; title: string }
}

export interface QueueCounts {
  name: string
  waiting: number
  active: number
  delayed: number
  failed: number
}

export interface RetryAllResult {
  queued: number
  failed: number
}

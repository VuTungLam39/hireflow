import type { ApplicationStatus } from '@/features/applications'

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface InterviewFeedback {
  id: string
  author: { id: string; fullName: string }
  overall: number
  ratings: { requirementId: string; label: string; score: number }[]
  comment: string | null
  submittedAt: string
  editableUntil: string
}

export interface Interview {
  id: string
  applicationId: string
  round: number
  scheduledAt: string
  durationMinutes: number
  location: string
  status: InterviewStatus
  cancelReason: string | null
  createdAt: string
  interviewers: { id: string; fullName: string; email: string; submitted: boolean }[]
  /** Interviewer chỉ nhận phiếu của chính mình (BR-INT-03) */
  feedbacks: InterviewFeedback[]
  application?: {
    id: string
    status: ApplicationStatus
    candidate: { id: string; fullName: string }
    job: { id: string; title: string }
  }
}

export interface Interviewer {
  id: string
  fullName: string
  email: string
}

export interface ScheduleInput {
  scheduledAt: string
  durationMinutes: number
  location: string
  interviewerIds: string[]
}

export interface FeedbackInput {
  overall: number
  ratings: { requirementId: string; score: number }[]
  comment?: string
}

export interface InterviewListParams {
  from?: string
  to?: string
  mine?: boolean
  includeCancelled?: boolean
}

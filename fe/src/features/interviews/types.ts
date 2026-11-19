import type { ApplicationStatus } from '@/features/applications'

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface InterviewFeedback {
  id: string
  author: { id: string; fullName: string }
  overall: number
  ratings: { requirementId: string; label: string; score: number }[]
  comment: string | null
  /** MVP 3.1 · F-INT-05: null ở phiếu nộp trước MVP 3.1 */
  recommendation: Recommendation | null
  submittedAt: string
  editableUntil: string
}

export interface Interview {
  id: string
  applicationId: string
  round: number
  /** MVP 3.1 · F-INT-04: null khi không theo vòng, phiếu chấm theo tiêu chí của tin */
  stage: { id: string; name: string; criteria: { id: string; label: string }[] } | null
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
  /** Chỉ khi tạo buổi mới; không đổi được sau khi tạo */
  stageId?: string
}

export interface FeedbackInput {
  overall: number
  ratings: { requirementId: string; score: number }[]
  comment?: string
  recommendation: Recommendation
}

export interface InterviewListParams {
  from?: string
  to?: string
  mine?: boolean
  includeCancelled?: boolean
  open?: boolean
}

/** Mở rộng MVP 2 – E5 · BR-INT-04: chỉ để tham khảo, không lưu vào phiếu */
export interface QuestionSuggestion {
  requirementId: string
  label: string
  questions: string[]
}

/** MVP 3.1 · BR-INT-06 */
export type Recommendation = 'STRONG_NO' | 'NO' | 'YES' | 'STRONG_YES'
export type DebriefRecommendations = Record<Recommendation | 'NONE', number>

/** MVP 3.1 · F-INT-05, BR-INT-07 */
export interface Debrief {
  feedbackCount: number
  overallAvg: number | null
  recommendations: DebriefRecommendations
  groups: {
    stage: { id: string; name: string } | null
    round: number
    interviews: number
    expectedFeedbacks: number
    feedbackCount: number
    overallAvg: number | null
    criteria: { requirementId: string; label: string; avg: number; n: number }[]
    recommendations: DebriefRecommendations
    feedbacks: {
      interviewId: string
      author: { id: string; fullName: string }
      overall: number
      recommendation: Recommendation | null
      comment: string | null
      submittedAt: string
    }[]
  }[]
}

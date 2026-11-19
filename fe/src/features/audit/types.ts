export type AuditAction =
  | 'CV_VIEWED'
  | 'CV_TEXT_ENTERED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'CANDIDATE_ANONYMIZED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'TOKEN_REUSE_DETECTED'
  | 'COMPANY_PROFILE_UPDATED'
  | 'COMPANY_MEDIA_ADDED'
  | 'COMPANY_MEDIA_REMOVED'
  | 'APPLICATIONS_EXPORTED'
  | 'ORG_APPROVED'
  | 'ORG_REJECTED'
  | 'ORG_SUSPENDED'
  | 'ORG_REACTIVATED'
  | 'ORG_AI_LIMITS_UPDATED'
  | 'JOB_CREATED'
  | 'JOB_UPDATED'
  | 'JOB_REQUIREMENTS_UPDATED'
  | 'JOB_PUBLISHED'
  | 'JOB_CLOSED'
  | 'JOB_CLONED'
  | 'JOB_DELETED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_UPDATED'
  | 'INTERVIEW_CANCELLED'
  | 'FEEDBACK_SUBMITTED'
  | 'FEEDBACK_UPDATED'
  | 'OFFER_CREATED'
  | 'OFFER_SUBMITTED'
  | 'OFFER_APPROVED'
  | 'OFFER_RETURNED'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'OFFER_WITHDRAWN'
  | 'OFFER_EXPIRED'

export type AuditEntity =
  | 'cv_file'
  | 'application'
  | 'candidate'
  | 'user'
  | 'company'
  | 'media'
  | 'organization'
  | 'job'
  | 'interview'
  | 'offer'

export interface AuditLogItem {
  id: string
  /** null: hệ thống tự làm (job định kỳ) */
  actorId: string | null
  action: AuditAction
  entity: AuditEntity
  entityId: string | null
  metadata: Record<string, string | number | boolean | null>
  ip: string | null
  requestId: string | null
  createdAt: string
  actor: { id: string; fullName: string; email: string } | null
}

export interface AuditLogParams {
  action?: AuditAction
  entity?: AuditEntity
  entityId?: string
  actorId?: string
  from?: string
  to?: string
}

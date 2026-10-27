export type AuditAction =
  | 'CV_VIEWED'
  | 'CV_TEXT_ENTERED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'CANDIDATE_ANONYMIZED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'

export type AuditEntity = 'cv_file' | 'application' | 'candidate' | 'user'

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

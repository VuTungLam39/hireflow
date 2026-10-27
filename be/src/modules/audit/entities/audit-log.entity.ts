import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type AuditMetadata = Record<string, string | number | boolean | null>;

export enum AuditAction {
  CvViewed = 'CV_VIEWED',
  CvTextEntered = 'CV_TEXT_ENTERED',
  ApplicationStatusChanged = 'APPLICATION_STATUS_CHANGED',
  CandidateAnonymized = 'CANDIDATE_ANONYMIZED',
  UserCreated = 'USER_CREATED',
  UserUpdated = 'USER_UPDATED',
  UserDeleted = 'USER_DELETED',
}

export enum AuditEntity {
  CvFile = 'cv_file',
  Application = 'application',
  Candidate = 'candidate',
  User = 'user',
}

// F-AUDIT-01 · Database Design 9: chỉ thêm, không sửa (trigger chặn UPDATE)
@Entity('audit_logs')
@Check('CK_audit_logs_metadata', `jsonb_typeof("metadata") = 'object'`)
@Index('IDX_audit_logs_created_at_id', ['createdAt', 'id'])
@Index('IDX_audit_logs_entity_entity_id', ['entity', 'entityId'])
@Index('IDX_audit_logs_actor_id_created_at', ['actorId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 30 })
  entity: AuditEntity;

  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: AuditMetadata;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  requestId: string | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt: Date;
}

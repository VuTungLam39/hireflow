import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';
import { EmailTemplate } from '../email.types.js';

export enum EmailStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
}

// MVP 3 · BR-NOTI-02
@Entity('email_outbox')
@Check('CK_email_outbox_payload', `jsonb_typeof("payload") = 'object'`)
@Index('IDX_email_outbox_pending', ['status', 'createdAt'], { where: `"status" = 'PENDING'` })
export class EmailOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_email_outbox_organization_id')
  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({
    name: 'organization_id',
    foreignKeyConstraintName: 'FK_email_outbox_organization_id',
  })
  organization?: Organization | null;

  @Column({ type: 'varchar', length: 255 })
  to: string;

  @Column({ type: 'varchar', length: 50 })
  template: EmailTemplate;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: Record<string, string>;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    enumName: 'email_outbox_status_enum',
    default: EmailStatus.Pending,
  })
  status: EmailStatus;

  @Column({ type: 'smallint', default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;
}

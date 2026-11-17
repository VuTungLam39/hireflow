import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum OrganizationStatus {
  Pending = 'PENDING',
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED',
  Rejected = 'REJECTED',
}

// BR-TEN-01
export const DEFAULT_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';

// BR-ORG-04
export const canSignIn = (status: OrganizationStatus) =>
  status === OrganizationStatus.Active || status === OrganizationStatus.Pending;

// BR-ORG-04, BR-ORG-05
@Entity('organizations')
@Check('CK_organizations_slug', `"slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`)
@Check('CK_organizations_ai_limits', `"ai_daily_score_limit" >= 0 AND "ai_daily_chat_limit" >= 0`)
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index('UQ_organizations_slug', { unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug: string;

  @Index('UQ_organizations_tax_code', { unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  taxCode: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'enum', enum: OrganizationStatus, default: OrganizationStatus.Pending })
  status: OrganizationStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  statusReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  // BR-AI-11
  @Column({ type: 'integer', default: 300 })
  aiDailyScoreLimit: number;

  @Column({ type: 'integer', default: 100 })
  aiDailyChatLimit: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

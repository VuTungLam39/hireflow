import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';

export enum CompanySize {
  Xs = '1-50',
  S = '51-200',
  M = '201-500',
  L = '501-1000',
  Xl = '1000+',
}

export interface CompanyBenefit {
  title: string;
  description: string;
}

export interface CompanyOffice {
  name: string;
  address: string;
  mapUrl: string | null;
}

export interface CompanyMilestone {
  year: number;
  title: string;
  description: string;
}

export interface CompanySocials {
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

// F-ORG-01 · BR-ORG-01, BR-TEN-01
@Entity('company_profile')
@Check(
  'CK_company_profile_founded_year',
  `"founded_year" IS NULL OR "founded_year" BETWEEN 1800 AND 2100`,
)
export class CompanyProfile {
  @PrimaryColumn({ type: 'uuid' })
  organizationId: string;

  @OneToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'organization_id',
    foreignKeyConstraintName: 'FK_company_profile_organization_id',
  })
  organization?: Organization;

  @Column({ type: 'varchar', length: 150, default: '' })
  name: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  tagline: string;

  @Column({ type: 'text', default: '' })
  about: string;

  @Column({ type: 'enum', enum: CompanySize, nullable: true })
  sizeRange: CompanySize | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  industries: string[];

  @Column({ type: 'smallint', nullable: true })
  foundedYear: number | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  website: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  socials: CompanySocials;

  @Column({ type: 'uuid', nullable: true })
  logoMediaId: string | null;

  @Column({ type: 'uuid', nullable: true })
  coverMediaId: string | null;

  // ADR-012: danh sách ngắn, luôn sửa và đọc cả khối
  @Column({ type: 'jsonb', default: () => "'[]'" })
  benefits: CompanyBenefit[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  offices: CompanyOffice[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  milestones: CompanyMilestone[];

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

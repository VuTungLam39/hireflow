import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity.js';
import { Organization } from '../../organizations/entities/organization.entity.js';
import { User } from '../../users/entities/user.entity.js';

// MVP 3.1 · BR-OFFER-02
export enum OfferStatus {
  Draft = 'DRAFT',
  PendingApproval = 'PENDING_APPROVAL',
  Approved = 'APPROVED',
  Sent = 'SENT',
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Withdrawn = 'WITHDRAWN',
  Expired = 'EXPIRED',
}

export enum SalaryPeriod {
  Month = 'MONTH',
  Year = 'YEAR',
}

export const CLOSED_OFFER: readonly OfferStatus[] = [
  OfferStatus.Accepted,
  OfferStatus.Declined,
  OfferStatus.Withdrawn,
  OfferStatus.Expired,
];

// MVP 3.1 · F-OFFER-01, BR-OFFER-01 → 05: bảng gốc, có organization_id (BR-TEN-01)
@Entity('offers')
@Index('UQ_offers_application_id_active', ['applicationId'], {
  unique: true,
  where: `"status" NOT IN ('ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')`,
})
@Index('IDX_offers_organization_id_status', ['organizationId', 'status'])
@Check('CK_offers_salary_amount', `"salary_amount" > 0`)
@Check('CK_offers_dates', `"respond_by" <= "start_date"`)
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id', foreignKeyConstraintName: 'FK_offers_organization_id' })
  organization?: Organization;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id', foreignKeyConstraintName: 'FK_offers_application_id' })
  application?: Application;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    enumName: 'offer_status_enum',
    default: OfferStatus.Draft,
  })
  status: OfferStatus;

  @Column({ type: 'bigint', transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  salaryAmount: number;

  @Column({ type: 'char', length: 3, default: 'VND' })
  salaryCurrency: string;

  @Column({
    type: 'enum',
    enum: SalaryPeriod,
    enumName: 'offer_salary_period_enum',
    default: SalaryPeriod.Month,
  })
  salaryPeriod: SalaryPeriod;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  respondBy: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'FK_offers_created_by' })
  creator?: User;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by', foreignKeyConstraintName: 'FK_offers_approved_by' })
  approver?: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  /** Lý do HM trả lại, ứng viên từ chối hoặc HR rút offer */
  @Column({ type: 'varchar', length: 500, nullable: true })
  statusReason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

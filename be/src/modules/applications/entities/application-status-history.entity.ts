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
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';
import { User } from '../../users/entities/user.entity.js';
import { Application } from './application.entity.js';

// BR-STS-06
@Entity('application_status_history')
@Index('IDX_application_status_history_application_id_changed_at', ['applicationId', 'changedAt'])
@Check(
  'CK_application_status_history_reject_reason',
  `"to_status" <> 'REJECTED' OR "reason" IS NOT NULL`,
)
export class ApplicationStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'application_id',
    foreignKeyConstraintName: 'FK_application_status_history_application_id',
  })
  application?: Application;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    enumName: 'application_status_enum',
    nullable: true,
  })
  fromStatus: ApplicationStatus | null;

  @Column({ type: 'enum', enum: ApplicationStatus, enumName: 'application_status_enum' })
  toStatus: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  changedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({
    name: 'changed_by',
    foreignKeyConstraintName: 'FK_application_status_history_changed_by',
  })
  changer?: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  changedAt: Date;
}

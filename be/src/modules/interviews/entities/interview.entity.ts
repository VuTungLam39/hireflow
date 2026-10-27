import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { InterviewAssignee } from './interview-assignee.entity.js';
import { InterviewFeedback } from './interview-feedback.entity.js';

export enum InterviewStatus {
  Scheduled = 'SCHEDULED',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

// F-INT-01 · Database Design 9
@Entity('interviews')
@Index('IDX_interviews_application_id', ['applicationId'])
@Index('IDX_interviews_scheduled_at', ['scheduledAt'])
@Check('CK_interviews_duration', `"duration_minutes" BETWEEN 15 AND 240`)
@Check('CK_interviews_round', `"round" BETWEEN 1 AND 20`)
@Check(
  'CK_interviews_cancelled_has_reason',
  `"status" <> 'CANCELLED' OR ("cancel_reason" IS NOT NULL AND btrim("cancel_reason") <> '')`,
)
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id', foreignKeyConstraintName: 'FK_interviews_application_id' })
  application?: Application;

  @Column({ type: 'smallint' })
  round: number;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'smallint', default: 60 })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 500 })
  location: string;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    enumName: 'interview_status_enum',
    default: InterviewStatus.Scheduled,
  })
  status: InterviewStatus;

  @Column({ type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'FK_interviews_created_by' })
  creator?: User;

  @OneToMany(() => InterviewAssignee, (a) => a.interview)
  assignees?: InterviewAssignee[];

  @OneToMany(() => InterviewFeedback, (f) => f.interview)
  feedbacks?: InterviewFeedback[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum NotificationType {
  CvScored = 'CV_SCORED',
  CvFailed = 'CV_FAILED',
}

// F-NOTI-01 · Database Design 9
@Entity('notifications')
@Index('IDX_notifications_user_id_read_at_created_at', ['userId', 'readAt', 'createdAt'])
@Index('IDX_notifications_application_id', ['applicationId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_notifications_user_id' })
  user?: User;

  @Column({ type: 'enum', enum: NotificationType, enumName: 'notification_type_enum' })
  type: NotificationType;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'application_id',
    foreignKeyConstraintName: 'FK_notifications_application_id',
  })
  application?: Application;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt: Date;
}

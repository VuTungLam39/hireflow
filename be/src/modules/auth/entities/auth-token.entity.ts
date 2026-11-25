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
import { Application } from '../../applications/entities/application.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum AuthTokenKind {
  VerifyEmail = 'VERIFY_EMAIL',
  TrackApplication = 'TRACK_APPLICATION',
  // SG-06 · R6
  ResetPassword = 'RESET_PASSWORD',
}

// BR-ACC-09, BR-APP-14
@Entity('auth_tokens')
@Check(
  'CK_auth_tokens_target',
  `("kind"::text IN ('VERIFY_EMAIL', 'RESET_PASSWORD') AND "user_id" IS NOT NULL) OR ("kind"::text = 'TRACK_APPLICATION' AND "application_id" IS NOT NULL)`,
)
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuthTokenKind, enumName: 'auth_token_kind_enum' })
  kind: AuthTokenKind;

  @Index('UQ_auth_tokens_token_hash', { unique: true })
  @Column({ type: 'char', length: 64 })
  tokenHash: string;

  @Index('IDX_auth_tokens_user_id')
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_auth_tokens_user_id' })
  user?: User | null;

  @Index('IDX_auth_tokens_application_id')
  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @ManyToOne(() => Application, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({
    name: 'application_id',
    foreignKeyConstraintName: 'FK_auth_tokens_application_id',
  })
  application?: Application | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

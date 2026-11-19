import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Job } from './job.entity.js';

// MVP 3.1 · BR-RANK-02: trọng số xem riêng của từng người; hết hiệu lực khi tin đổi phiên bản tiêu chí
@Entity('ranking_weights')
@Check('CK_ranking_weights_weights', `jsonb_typeof("weights") = 'object'`)
export class RankingWeight {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_ranking_weights' })
  userId: string;

  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_ranking_weights' })
  jobId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_ranking_weights_user_id' })
  user?: User;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id', foreignKeyConstraintName: 'FK_ranking_weights_job_id' })
  job?: Job;

  @Column({ type: 'integer' })
  jdVersion: number;

  /** requirementId → trọng số 1–3 của phiên bản jdVersion */
  @Column({ type: 'jsonb' })
  weights: Record<string, number>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

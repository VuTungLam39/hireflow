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
import { ScoreFlag } from '../../../common/enums/score-flag.enum.js';
import { Application } from '../../applications/entities/application.entity.js';
import { Candidate } from '../../candidates/entities/candidate.entity.js';
import { CvFile } from '../../files/entities/cv-file.entity.js';
import { Job } from '../../jobs/entities/job.entity.js';
import { User } from '../../users/entities/user.entity.js';
import type { MatchReason } from '../match-ranking.js';

// Database Design 9 · F-MATCH-01, F-MATCH-02
@Entity('job_matches')
@Index('UQ_job_matches_job_id_candidate_id', ['jobId', 'candidateId'], { unique: true })
@Check('CK_job_matches_score', `"score" BETWEEN 0 AND 100`)
@Check('CK_job_matches_score_breakdown', `jsonb_typeof("score_breakdown") = 'array'`)
@Check('CK_job_matches_invited', `("invited_at" IS NULL) = ("invited_by" IS NULL)`)
export class JobMatch {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_job_matches' })
  id: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id', foreignKeyConstraintName: 'FK_job_matches_job_id' })
  job?: Job;

  @Index('IDX_job_matches_candidate_id')
  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id', foreignKeyConstraintName: 'FK_job_matches_candidate_id' })
  candidate?: Candidate;

  @Column({ type: 'uuid', nullable: true })
  cvFileId: string | null;

  @ManyToOne(() => CvFile, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cv_file_id', foreignKeyConstraintName: 'FK_job_matches_cv_file_id' })
  cvFile?: CvFile | null;

  @Column({ type: 'integer' })
  jdVersion: number;

  @Column({ type: 'smallint' })
  score: number;

  @Column({ type: 'jsonb' })
  scoreBreakdown: MatchReason[];

  @Column({
    type: 'enum',
    enum: ScoreFlag,
    enumName: 'score_flag_enum',
    array: true,
    default: '{}',
  })
  flags: ScoreFlag[];

  @Column({ type: 'timestamptz' })
  lastAppliedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  invitedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  invitedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invited_by', foreignKeyConstraintName: 'FK_job_matches_invited_by' })
  inviter?: User | null;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @ManyToOne(() => Application, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'application_id', foreignKeyConstraintName: 'FK_job_matches_application_id' })
  application?: Application | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

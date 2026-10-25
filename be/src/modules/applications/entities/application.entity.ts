import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AiStatus } from '../../../common/enums/ai-status.enum.js';
import { ApplicationSource } from '../../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';
import { ScoreFlag } from '../../../common/enums/score-flag.enum.js';
import { CursorEntity } from '../../../common/entities/abstract.entity.js';
import { Candidate } from '../../candidates/entities/candidate.entity.js';
import { CvFile } from '../../files/entities/cv-file.entity.js';
import { Job } from '../../jobs/entities/job.entity.js';

export interface BreakdownItem {
  requirementId: string;
  match: 0 | 0.5 | 1;
  evidence: string | null;
  rejectedEvidence: string | null;
}

@Entity('applications')
@Index('UQ_applications_job_id_candidate_id', ['jobId', 'candidateId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check('CK_applications_score', `"score" BETWEEN 0 AND 100`)
@Check('CK_applications_score_breakdown', `jsonb_typeof("score_breakdown") = 'array'`)
@Check('CK_applications_done_has_score', `"ai_status" <> 'DONE' OR "score" IS NOT NULL`)
export class Application extends CursorEntity {
  // BR-APP-03
  @Column({ type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'job_id', foreignKeyConstraintName: 'FK_applications_job_id' })
  job?: Job;

  @Index('IDX_applications_candidate_id')
  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_id', foreignKeyConstraintName: 'FK_applications_candidate_id' })
  candidate?: Candidate;

  @Index('IDX_applications_cv_file_id')
  @Column({ type: 'uuid', nullable: true })
  cvFileId: string | null;

  @ManyToOne(() => CvFile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cv_file_id', foreignKeyConstraintName: 'FK_applications_cv_file_id' })
  cvFile?: CvFile | null;

  @Column({
    type: 'enum',
    enum: ApplicationSource,
    enumName: 'application_source_enum',
    default: ApplicationSource.PublicForm,
  })
  source: ApplicationSource;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    enumName: 'application_status_enum',
    default: ApplicationStatus.New,
  })
  status: ApplicationStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  statusChangedAt: Date;

  @Column({ type: 'enum', enum: AiStatus, enumName: 'ai_status_enum', default: AiStatus.Pending })
  aiStatus: AiStatus;

  @Column({ type: 'text', nullable: true })
  aiError: string | null;

  // Database Design D6
  @Column({ type: 'smallint', nullable: true })
  score: number | null;

  @Column({ type: 'jsonb', nullable: true })
  scoreBreakdown: BreakdownItem[] | null;

  @Column({
    type: 'enum',
    enum: ScoreFlag,
    enumName: 'score_flag_enum',
    array: true,
    default: '{}',
  })
  flags: ScoreFlag[];

  @Column({ type: 'integer', nullable: true })
  scoredJdVersion: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  scoredAt: Date | null;
}

import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Job } from './job.entity.js';

export interface StageCriterion {
  /** Khoá ổn định của tiêu chí; phiếu đánh giá lưu khoá này ở ratings[].requirementId */
  id: string;
  label: string;
}

// MVP 3.1 · F-INT-04, BR-INT-05: bảng con, đi qua jobs đã lọc công ty
@Entity('job_interview_stages')
// Hoãn kiểm tới commit để đổi thứ tự vòng trong một transaction
@Unique('UQ_job_interview_stages_job_id_position', ['jobId', 'position'], {
  deferrable: 'INITIALLY DEFERRED',
})
@Check('CK_job_interview_stages_position', `"position" BETWEEN 1 AND 10`)
@Check('CK_job_interview_stages_criteria', `jsonb_typeof("criteria") = 'array'`)
export class JobInterviewStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id', foreignKeyConstraintName: 'FK_job_interview_stages_job_id' })
  job?: Job;

  @Column({ type: 'smallint' })
  position: number;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'jsonb' })
  criteria: StageCriterion[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

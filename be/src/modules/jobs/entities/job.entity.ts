import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';
import { Department } from '../../departments/entities/department.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum JobStatus {
  Draft = 'DRAFT',
  Open = 'OPEN',
  Closed = 'CLOSED',
}

@Entity('jobs')
@Check('CK_jobs_title_length', `length("title") >= 5`)
@Check('CK_jobs_jd_version', `"jd_version" >= 1`)
@Check('CK_jobs_published_at', `"status" = 'DRAFT' OR "published_at" IS NOT NULL`)
export class Job extends AbstractEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Index('IDX_jobs_department_id')
  @Column({ type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id', foreignKeyConstraintName: 'FK_jobs_department_id' })
  department?: Department;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.Draft })
  status: JobStatus;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'text' })
  jdText: string;

  @Column({ type: 'integer', default: 1 })
  jdVersion: number;

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'FK_jobs_created_by' })
  creator?: User;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  // F-MATCH-01
  @Column({ type: 'timestamptz', nullable: true })
  matchedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  matchedJdVersion: number | null;
}

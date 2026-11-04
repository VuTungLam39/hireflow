import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';
import { Department } from '../../departments/entities/department.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum JobStatus {
  Draft = 'DRAFT',
  Open = 'OPEN',
  Closed = 'CLOSED',
}

// BR-JOB-08
export enum SalaryVisibility {
  Range = 'RANGE',
  Negotiable = 'NEGOTIABLE',
  Hidden = 'HIDDEN',
}

export enum JobLevel {
  Intern = 'INTERN',
  Fresher = 'FRESHER',
  Junior = 'JUNIOR',
  Middle = 'MIDDLE',
  Senior = 'SENIOR',
  Lead = 'LEAD',
  Manager = 'MANAGER',
}

export enum EmploymentType {
  FullTime = 'FULL_TIME',
  PartTime = 'PART_TIME',
  Contract = 'CONTRACT',
  Internship = 'INTERNSHIP',
}

export enum WorkMode {
  Onsite = 'ONSITE',
  Hybrid = 'HYBRID',
  Remote = 'REMOTE',
}

@Entity('jobs')
@Check('CK_jobs_title_length', `length("title") >= 5`)
@Check('CK_jobs_jd_version', `"jd_version" >= 1`)
@Check('CK_jobs_published_at', `"status" = 'DRAFT' OR "published_at" IS NOT NULL`)
@Check(
  'CK_jobs_salary_range',
  `"salary_min" IS NULL OR "salary_max" IS NULL OR "salary_min" <= "salary_max"`,
)
@Check(
  'CK_jobs_salary_positive',
  `("salary_min" IS NULL OR "salary_min" > 0) AND ("salary_max" IS NULL OR "salary_max" > 0)`,
)
@Check('CK_jobs_headcount', `"headcount" BETWEEN 1 AND 999`)
@Check('CK_jobs_benefits_length', `length("benefits") <= 5000`)
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

  // F-JOB-10, F-JOB-11 · BR-JOB-08 → 10
  @Column({ type: 'integer', nullable: true })
  salaryMin: number | null;

  @Column({ type: 'integer', nullable: true })
  salaryMax: number | null;

  @Column({ type: 'enum', enum: SalaryVisibility, default: SalaryVisibility.Negotiable })
  salaryVisibility: SalaryVisibility;

  @Column({ type: 'enum', enum: JobLevel, nullable: true })
  level: JobLevel | null;

  @Column({ type: 'enum', enum: EmploymentType, default: EmploymentType.FullTime })
  employmentType: EmploymentType;

  @Column({ type: 'enum', enum: WorkMode, default: WorkMode.Onsite })
  workMode: WorkMode;

  @Column({ type: 'smallint', default: 1 })
  headcount: number;

  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @Column({ type: 'text', default: '' })
  benefits: string;
}

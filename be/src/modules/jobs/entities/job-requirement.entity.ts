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
import { numericTransformer } from '../../../common/transformers/numeric.transformer.js';
import { Job } from './job.entity.js';

export enum RequirementType {
  Must = 'MUST',
  Nice = 'NICE',
}

// Database Design D7
@Entity('job_requirements')
@Index('UQ_job_requirements_job_id_jd_version_position', ['jobId', 'jdVersion', 'position'], {
  unique: true,
})
@Check('CK_job_requirements_weight', `"weight" BETWEEN 1 AND 3`)
@Check('CK_job_requirements_min_years', `"min_years" BETWEEN 0 AND 30`)
@Check('CK_job_requirements_keywords', `cardinality("keywords") >= 1`)
export class JobRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id', foreignKeyConstraintName: 'FK_job_requirements_job_id' })
  job?: Job;

  @Column({ type: 'integer' })
  jdVersion: number;

  @Column({ type: 'smallint' })
  position: number;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'enum', enum: RequirementType, enumName: 'requirement_type_enum' })
  type: RequirementType;

  @Column({ type: 'smallint' })
  weight: number;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
    transformer: numericTransformer,
  })
  minYears: number | null;

  @Column({ type: 'text', array: true })
  keywords: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

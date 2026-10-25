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
import { CvFile } from '../../files/entities/cv-file.entity.js';

export interface ProfileSkill {
  name: string;
  years: number | null;
  evidence: string;
}

export interface ProfileExperience {
  title: string;
  company: string;
  from: string | null;
  to: string | null;
  evidence: string;
}

export interface ProfileEducation {
  school: string;
  degree: string | null;
  year: number | null;
  evidence: string;
}

// Database Design 4.13
export interface CvProfileData {
  skills: ProfileSkill[];
  experiences: ProfileExperience[];
  education: ProfileEducation[];
  summary: string;
}

// Database Design 4.8, BR-AI-06
@Entity('cv_profiles')
@Index('UQ_cv_profiles_cv_file_id_prompt_version', ['cvFileId', 'promptVersion'], { unique: true })
@Check('CK_cv_profiles_data', `jsonb_typeof("data") = 'object'`)
@Check('CK_cv_profiles_tokens', `"input_tokens" >= 0 AND "output_tokens" >= 0`)
export class CvProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  cvFileId: string;

  @ManyToOne(() => CvFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cv_file_id', foreignKeyConstraintName: 'FK_cv_profiles_cv_file_id' })
  cvFile?: CvFile;

  @Column({ type: 'jsonb' })
  data: CvProfileData;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'varchar', length: 20 })
  promptVersion: string;

  @Column({ type: 'integer' })
  inputTokens: number;

  @Column({ type: 'integer' })
  outputTokens: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 6,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  costUsd: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

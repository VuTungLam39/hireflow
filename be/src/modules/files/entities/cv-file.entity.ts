import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';
import { Candidate } from '../../candidates/entities/candidate.entity.js';

export enum CvParseStatus {
  Pending = 'PENDING',
  Parsed = 'PARSED',
  Failed = 'FAILED',
}

export const CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const CV_MAX_BYTES = 5 * 1024 * 1024;

@Entity('cv_files')
@Index('UQ_cv_files_candidate_id_sha256', ['candidateId', 'sha256'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check('CK_cv_files_mime', `"mime" IN ('${CV_MIME_TYPES.join("', '")}')`)
@Check('CK_cv_files_size_bytes', `"size_bytes" BETWEEN 1 AND ${CV_MAX_BYTES}`)
export class CvFile extends AbstractEntity {
  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_id', foreignKeyConstraintName: 'FK_cv_files_candidate_id' })
  candidate?: Candidate;

  // BR-FILE-03
  @Index('UQ_cv_files_storage_key', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  storageKey: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mime: string;

  @Column({ type: 'integer' })
  sizeBytes: number;

  // BR-FILE-02
  @Column({ type: 'char', length: 64 })
  sha256: string;

  @Column({
    type: 'enum',
    enum: CvParseStatus,
    enumName: 'cv_parse_status_enum',
    default: CvParseStatus.Pending,
  })
  parseStatus: CvParseStatus;

  // BR-FILE-04
  @Column({ type: 'text', nullable: true })
  parseError: string | null;

  @Column({ type: 'text', nullable: true })
  text: string | null;
}

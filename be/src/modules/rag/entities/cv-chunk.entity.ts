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
import type { CvSection } from '../cv-chunks.js';

// Database Design 4.9
export const CV_CHUNK_DIMENSION = 1024;

@Entity('cv_chunks')
@Index('UQ_cv_chunks_cv_file_id_position', ['cvFileId', 'position'], { unique: true })
@Index('IDX_cv_chunks_embedding', { synchronize: false })
@Index('IDX_cv_chunks_search_vector', { synchronize: false })
@Check(
  'CK_cv_chunks_section',
  `"section" IN ('summary', 'experience', 'skills', 'projects', 'education', 'other')`,
)
export class CvChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  cvFileId: string;

  @ManyToOne(() => CvFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cv_file_id', foreignKeyConstraintName: 'FK_cv_chunks_cv_file_id' })
  cvFile?: CvFile;

  @Column({ type: 'varchar', length: 20 })
  section: CvSection;

  @Column({ type: 'smallint' })
  position: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'smallint' })
  tokenCount: number;

  @Column({ type: 'varchar', length: 100 })
  embeddingModel: string;

  // F-SEARCH-01: cột sinh tự động (migration 20), chỉ đọc trong SQL tìm kiếm
  @Column({
    type: 'tsvector',
    select: false,
    insert: false,
    update: false,
    generatedType: 'STORED',
    asExpression: `to_tsvector('simple'::regconfig, f_unaccent(lower("content")))`,
  })
  searchVector?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

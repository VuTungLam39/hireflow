import { Check, Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';

export enum MediaKind {
  Logo = 'LOGO',
  Cover = 'COVER',
  Gallery = 'GALLERY',
}

// F-ORG-01, F-FILE-03 · BR-MEDIA-01, BR-MEDIA-02
@Entity('media_files')
@Index('IDX_media_files_kind_position', ['kind', 'position'], { where: '"deleted_at" IS NULL' })
@Check('CK_media_files_size', `"size_bytes" > 0 AND "size_bytes" <= 3145728`)
@Check('CK_media_files_dimensions', `"width" BETWEEN 1 AND 4096 AND "height" BETWEEN 1 AND 4096`)
export class MediaFile extends AbstractEntity {
  @Column({ type: 'enum', enum: MediaKind })
  kind: MediaKind;

  @Column({ type: 'varchar', length: 200 })
  storageKey: string;

  @Column({ type: 'varchar', length: 50 })
  mime: string;

  @Column({ type: 'integer' })
  sizeBytes: number;

  @Column({ type: 'integer' })
  width: number;

  @Column({ type: 'integer' })
  height: number;

  @Column({ type: 'char', length: 64 })
  sha256: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  altText: string;

  @Column({ type: 'smallint', default: 0 })
  position: number;

  @Column({ type: 'uuid' })
  createdBy: string;
}

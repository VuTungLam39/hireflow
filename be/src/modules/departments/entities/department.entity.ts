import { Check, Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';

@Entity('departments')
@Check('CK_departments_code', `"code" ~ '^[A-Z0-9_]{2,20}$'`)
export class Department extends AbstractEntity {
  @Index('UQ_departments_name', { unique: true, where: '"deleted_at" IS NULL' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index('UQ_departments_code', { unique: true, where: '"deleted_at" IS NULL' })
  @Column({ type: 'varchar', length: 20 })
  code: string;
}

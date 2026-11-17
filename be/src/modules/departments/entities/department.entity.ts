import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';

@Entity('departments')
// BR-TEN-01
@Index('UQ_departments_name', ['organizationId', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('UQ_departments_code', ['organizationId', 'code'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check('CK_departments_code', `"code" ~ '^[A-Z0-9_]{2,20}$'`)
export class Department extends AbstractEntity {
  // BR-TEN-01
  @Index('IDX_departments_organization_id')
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'organization_id',
    foreignKeyConstraintName: 'FK_departments_organization_id',
  })
  organization?: Organization;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;
}

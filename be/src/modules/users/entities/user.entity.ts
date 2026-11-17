import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Department } from '../../departments/entities/department.entity.js';

@Entity('users')
@Check('CK_users_email_lower', `"email" = lower("email")`)
@Check(
  'CK_users_hiring_manager_department',
  `"role" <> 'hiring_manager' OR "department_id" IS NOT NULL`,
)
export class User extends AbstractEntity {
  // BR-TEN-01
  @Index('IDX_users_organization_id')
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id', foreignKeyConstraintName: 'FK_users_organization_id' })
  organization?: Organization;

  @Index('UQ_users_email', { unique: true, where: '"deleted_at" IS NULL' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Exclude()
  @ApiHideProperty()
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'enum', enum: Role, default: Role.Hr })
  role: Role;

  // BR-ACC-03
  @Index('IDX_users_department_id')
  @Column({ type: 'uuid', nullable: true })
  departmentId: string | null;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'department_id', foreignKeyConstraintName: 'FK_users_department_id' })
  department?: Department | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  // BR-ACC-09
  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;
}

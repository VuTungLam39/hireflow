import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity.js';
import { Role } from '../../../common/enums/role.enum.js';

@Entity('users')
export class User extends AbstractEntity {
  @Index('UQ_users_email', { unique: true, where: '"deleted_at" IS NULL' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Exclude()
  @ApiHideProperty()
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Exclude()
  @ApiHideProperty()
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;
}

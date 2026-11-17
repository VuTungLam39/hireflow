import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';
import { CursorEntity } from '../../../common/entities/abstract.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('candidates')
@Index('IDX_candidates_organization_id_created_at_id', { synchronize: false })
@Check('CK_candidates_email_lower', `"email" = lower("email")`)
// Migration AddPerformanceIndexes
@Index('IDX_candidates_created_at_id', { synchronize: false })
@Index('IDX_candidates_full_name_trgm', { synchronize: false })
@Index('IDX_candidates_email_trgm', { synchronize: false })
// BR-CAND-01, BR-TEN-01
@Index('UQ_candidates_email', ['organizationId', 'email'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Candidate extends CursorEntity {
  // BR-TEN-01
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'organization_id',
    foreignKeyConstraintName: 'FK_candidates_organization_id',
  })
  organization?: Organization;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  // BR-APP-04
  @Column({ type: 'timestamptz' })
  consentAt: Date;

  @Column({ type: 'varchar', length: 20 })
  consentVersion: string;

  // BR-DATA-03
  @Column({ type: 'timestamptz', nullable: true })
  anonymizedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  anonymizedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'anonymized_by', foreignKeyConstraintName: 'FK_candidates_anonymized_by' })
  anonymizer?: User | null;
}

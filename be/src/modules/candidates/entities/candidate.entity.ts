import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CursorEntity } from '../../../common/entities/abstract.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('candidates')
@Check('CK_candidates_email_lower', `"email" = lower("email")`)
export class Candidate extends CursorEntity {
  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  // BR-CAND-01
  @Index('UQ_candidates_email', { unique: true, where: '"deleted_at" IS NULL' })
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

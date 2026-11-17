import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';

export enum AiUsageKind {
  Cv = 'CV',
  Chat = 'CHAT',
}

// MVP 3 · BR-AI-11: một dòng mỗi công ty, mỗi ngày (giờ VN), mỗi loại lượt
@Entity('ai_usage')
@Check('CK_ai_usage_count', `"count" >= 0`)
export class AiUsage {
  @PrimaryColumn({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id', foreignKeyConstraintName: 'FK_ai_usage_organization_id' })
  organization?: Organization;

  @PrimaryColumn({ type: 'date' })
  day: string;

  @PrimaryColumn({ type: 'enum', enum: AiUsageKind, enumName: 'ai_usage_kind_enum' })
  kind: AiUsageKind;

  @Column({ type: 'integer', default: 0 })
  count: number;
}

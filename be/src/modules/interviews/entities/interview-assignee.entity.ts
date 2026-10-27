import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Interview } from './interview.entity.js';

// F-INT-01, BR-INT-02 · Database Design 9
@Entity('interview_assignees')
@Index('IDX_interview_assignees_user_id', ['userId'])
export class InterviewAssignee {
  @PrimaryColumn({ type: 'uuid' })
  interviewId: string;

  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Interview, (i) => i.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'interview_id',
    foreignKeyConstraintName: 'FK_interview_assignees_interview_id',
  })
  interview?: Relation<Interview>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_interview_assignees_user_id' })
  user?: User;
}

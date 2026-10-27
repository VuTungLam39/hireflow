import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Interview } from './interview.entity.js';

export interface FeedbackRating {
  requirementId: string;
  label: string;
  score: number;
}

// F-INT-03, BR-INT-03 · Database Design 9
@Entity('interview_feedbacks')
@Index('UQ_interview_feedbacks_interview_id_author_id', ['interviewId', 'authorId'], {
  unique: true,
})
@Check('CK_interview_feedbacks_overall', `"overall" BETWEEN 1 AND 5`)
@Check('CK_interview_feedbacks_ratings', `jsonb_typeof("ratings") = 'array'`)
export class InterviewFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  interviewId: string;

  @ManyToOne(() => Interview, (i) => i.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'interview_id',
    foreignKeyConstraintName: 'FK_interview_feedbacks_interview_id',
  })
  interview?: Relation<Interview>;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id', foreignKeyConstraintName: 'FK_interview_feedbacks_author_id' })
  author?: User;

  @Column({ type: 'smallint' })
  overall: number;

  @Column({ type: 'jsonb' })
  ratings: FeedbackRating[];

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'timestamptz' })
  editableUntil: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

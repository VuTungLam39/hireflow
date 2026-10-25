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
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Application } from './application.entity.js';

// BR-APP-09
@Entity('application_notes')
@Index('IDX_application_notes_application_id_created_at', ['applicationId', 'createdAt'])
@Check('CK_application_notes_content_length', `length("content") BETWEEN 1 AND 2000`)
export class ApplicationNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'application_id',
    foreignKeyConstraintName: 'FK_application_notes_application_id',
  })
  application?: Application;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id', foreignKeyConstraintName: 'FK_application_notes_author_id' })
  author?: User;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

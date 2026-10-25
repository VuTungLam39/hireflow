import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

abstract class SoftDeletableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}

export abstract class AbstractEntity extends SoftDeletableEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

// Database Design D2
export abstract class CursorEntity extends SoftDeletableEntity {
  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt: Date;
}

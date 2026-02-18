import { Community } from 'src/community/entities/community.entity';
import { Tag } from 'src/tag/tag.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Comment } from 'src/comment/entities/comment.entity';
import { QuestionUrgency } from '../enums/question-urgency.enum';
import { QuestionVote } from './question-vote.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text' })
  searchContent: string;

  @Column({ type: 'jsonb', nullable: true })
  searchVector: Record<string, number>;

  @ManyToOne(() => User, (user) => user.questions, { onDelete: 'CASCADE' })
  author: User;

  @ManyToMany(() => Tag, (tag) => tag.questions)
  @JoinTable()
  tags: Tag[];

  @ManyToOne(() => Community, (community) => community.questions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  community?: Community;

  @Column({
    type: 'enum',
    enum: QuestionUrgency,
    default: QuestionUrgency.MEDIUM,
  })
  urgency: QuestionUrgency;

  @OneToMany(() => QuestionVote, (vote) => vote.question)
  votes: QuestionVote[];

  @Column({ type: 'int', default: 0 })
  upvotes: number;

  @Column({ type: 'int', default: 0 })
  downvotes: number;

  @OneToMany(() => Comment, (comment) => comment.question)
  comments: Comment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

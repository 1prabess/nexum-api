import { User } from 'src/user/user.entity';
import { Question } from './question.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { VoteType } from 'src/common/enums/vote-type.enum';

@Entity('question_votes')
@Unique(['question', 'user'])
export class QuestionVote {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Question, (question) => question.votes, {
    onDelete: 'CASCADE',
  })
  question: Question;

  @ManyToOne(() => User, (user) => user.questionVotes, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: VoteType })
  type: VoteType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

import { User } from 'src/user/user.entity';
import { Answer } from './answer.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { VoteType } from 'src/common/enums/vote-type.enum';

@Entity('answer_votes')
@Unique(['user', 'answer'])
export class AnswerVote {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.answerVotes, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Answer, (answer) => answer.votes, {
    onDelete: 'CASCADE',
  })
  answer: Answer;

  @Column({
    type: 'enum',
    enum: VoteType,
  })
  type: VoteType;
}

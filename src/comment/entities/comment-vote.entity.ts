import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { VoteType } from 'src/common/enums/vote-type.enum';
import { Comment } from './comment.entity';

@Entity('comment_votes')
@Unique(['comment', 'user'])
export class CommentVote {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Comment, (comment) => comment.votes, {
    onDelete: 'CASCADE',
  })
  comment: Comment;

  @ManyToOne(() => User, (user) => user.commentVotes, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: VoteType })
  type: VoteType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

import { User } from 'src/user/user.entity';
import { Post } from './post.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { VoteType } from '../enums/post-vote.enum';

@Entity('post_votes')
@Unique(['post', 'user'])
export class PostVote {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Post, (post) => post.votes, { onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => User, (user) => user.postVotes, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: VoteType })
  type: VoteType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

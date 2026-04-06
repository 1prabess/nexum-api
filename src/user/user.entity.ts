import { AnswerVote } from 'src/answer/entities/answer-vote.entity';
import { Answer } from 'src/answer/entities/answer.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { CommentVote } from 'src/comment/entities/comment-vote.entity';
import { CommunityMember } from 'src/community/entities/community-member.entity';
import { Community } from 'src/community/entities/community.entity';
import { Follow } from 'src/follow/follow.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { PostVote } from 'src/post/entities/post-vote.entity';
import { Post } from 'src/post/entities/post.entity';
import { QuestionVote } from 'src/question/entities/question-vote.entity';
import { Question } from 'src/question/entities/question.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverPhoto?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken?: string;

  @Column({ type: 'int', default: 0 })
  followersCount: number;

  @Column({ type: 'int', default: 0 })
  followingCount: number;

  @OneToMany(() => Follow, (follow) => follow.follower)
  followers: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  following: Follow[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Question, (question) => question.author)
  questions: Question[];

  @OneToMany(() => Community, (community) => community.owner)
  communitiesOwned: Community[];

  @OneToMany(() => CommunityMember, (membership) => membership.user)
  communityMemberships: CommunityMember[];

  @OneToMany(() => PostVote, (vote) => vote.user)
  postVotes: PostVote[];

  @OneToMany(() => QuestionVote, (vote) => vote.user)
  questionVotes: QuestionVote[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => CommentVote, (vote) => vote.user)
  commentVotes: CommentVote[];

  @OneToMany(() => Answer, (answer) => answer.author)
  answers: Answer[];

  @OneToMany(() => AnswerVote, (vote) => vote.user)
  answerVotes: AnswerVote[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notificationsReceived: Notification[];

  @OneToMany(() => Notification, (notification) => notification.actor)
  notificationsSent: Notification[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

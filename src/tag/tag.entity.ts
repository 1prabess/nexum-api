import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { Community } from 'src/community/entities/community.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];

  @ManyToMany(() => Question, (question) => question.tags)
  questions: Question[];

  @ManyToMany(() => Community, (community) => community.tags)
  communities: Community[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

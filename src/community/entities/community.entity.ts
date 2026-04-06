import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { CommunityVisibility } from '../enums/community-visibility.enum';
import { User } from 'src/user/user.entity';
import { CommunityMember } from './community-member.entity';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { Tag } from 'src/tag/tag.entity';

@Entity('communities')
export class Community {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverImage?: string;

  @Column({
    type: 'enum',
    enum: CommunityVisibility,
    default: CommunityVisibility.PUBLIC,
  })
  visibility: CommunityVisibility;

  @ManyToOne(() => User, (user) => user.communitiesOwned)
  owner: User;

  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => Post, (post) => post.community)
  posts: Post[];

  @OneToMany(() => Question, (question) => question.community)
  questions: Question[];

  @ManyToMany(() => Tag, (tag) => tag.communities)
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

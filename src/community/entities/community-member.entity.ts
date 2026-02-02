import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CommunityMemberRole } from '../enums/community-member-role.enum';
import { Community } from './community.entity';

@Entity('community_members')
export class CommunityMember {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.communityMemberships)
  user: User;

  @ManyToOne(() => Community, (community) => community.members, {
    onDelete: 'CASCADE',
  })
  community: Community;

  @Column({
    type: 'enum',
    enum: CommunityMemberRole,
    default: CommunityMemberRole.MEMBER,
  })
  role: CommunityMemberRole;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

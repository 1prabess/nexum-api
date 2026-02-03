import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Community } from './community.entity';
import { User } from 'src/user/user.entity';
import { CommunityInviteStatus } from '../enums/community-invite-status.enum';

@Entity('community_invites')
@Unique(['community', 'invitedUser'])
export class CommunityInvite {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Community, { onDelete: 'CASCADE' })
  community: Community;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  invitedUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  invitedBy: User;

  @Column({
    type: 'enum',
    enum: CommunityInviteStatus,
    default: CommunityInviteStatus.PENDING,
  })
  status: CommunityInviteStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

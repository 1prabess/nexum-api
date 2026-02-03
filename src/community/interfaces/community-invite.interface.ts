import { CommunityInviteStatus } from '../enums/community-invite-status.enum';

export interface ICommunityInvite {
  id: number;
  status: CommunityInviteStatus;
  createdAt: Date;

  community: {
    id: number;
    name: string;
    avatar: string | null;
    visibility: string;
  };

  invitedBy: {
    id: number;
    username: string;
    fullName: string | null;
    avatar: string | null;
  };
}

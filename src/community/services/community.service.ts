import { Injectable } from '@nestjs/common';
import { Community } from '../entities/community.entity';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommunityDto } from '../dtos/create-community.dto';
import { UpdateCommunityDto } from '../dtos/update-community.dto';
import { CreateCommunityService } from './create-community.service';
import { UpdateCommunityService } from './update-community.service';
import { JoinCommunityService } from './join-community.service';
import { InviteToCommunityService } from './invite-to-community.service';
import { AcceptCommunityInviteService } from './accept-community-invite.service';
import { GetCommunityInvitesService } from './get-community-invites.service';
import { CommunityInvite } from '../entities/community-invite.entity';

@Injectable()
export class CommunityService {
  constructor(
    private readonly createCommunityService: CreateCommunityService,
    private readonly updateCommunityService: UpdateCommunityService,
    private readonly joinCommunityService: JoinCommunityService,
    private readonly inviteToCommunityService: InviteToCommunityService,
    private readonly acceptCommunityInviteService: AcceptCommunityInviteService,
    private readonly getCommunityInvitesService: GetCommunityInvitesService,
  ) {}

  // Create community
  create(
    user: ICurrentUser,
    createCommunityDto: CreateCommunityDto,
  ): Promise<Community> {
    return this.createCommunityService.execute(user, createCommunityDto);
  }

  // Update community
  async update(
    user: ICurrentUser,
    communityId: number,
    updateCommunityDto: UpdateCommunityDto,
  ): Promise<void> {
    return this.updateCommunityService.execute(
      user,
      communityId,
      updateCommunityDto,
    );
  }

  // Join community
  joinCommunity(communityId: number, user: ICurrentUser): Promise<void> {
    return this.joinCommunityService.execute(communityId, user);
  }

  // Invite to private community
  invite(
    user: ICurrentUser,
    communityId: number,
    userId: number,
  ): Promise<void> {
    return this.inviteToCommunityService.execute(user, communityId, userId);
  }

  // Accept invitation to private community
  accept(user: ICurrentUser, inviteId: number): Promise<void> {
    return this.acceptCommunityInviteService.execute(user, inviteId);
  }

  // Get all invitation from communities
  getInvites(userId: number): Promise<CommunityInvite[]> {
    return this.getCommunityInvitesService.execute(userId);
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CommunityQueryService } from './query-community.service';
import { UserService } from 'src/user/providers/user.service';
import { Repository } from 'typeorm';
import { CommunityInvite } from '../entities/community-invite.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class InviteToCommunityService {
  constructor(
    @InjectRepository(CommunityInvite)
    private readonly communityInviteRepository: Repository<CommunityInvite>,
    private readonly communityQueryService: CommunityQueryService,
    private readonly userService: UserService,
  ) {}

  async execute(
    inviter: ICurrentUser,
    communityId: number,
    invitedUserId: number,
  ): Promise<void> {
    // Find community
    const community = await this.communityQueryService.findById(communityId, [
      'owner',
    ]);

    if (!community) throw new NotFoundException('Community not found');

    // Check if it's the owner whose inviting
    if (community.owner.id !== inviter.id) {
      throw new ForbiddenException('Only owner can invite');
    }

    // Check if the invited user is already a member
    if (await this.communityQueryService.isMember(communityId, invitedUserId)) {
      throw new BadRequestException('User already a member');
    }

    // Find the invited user
    const invitedUser = await this.userService.findById(invitedUserId);

    if (!invitedUser) throw new NotFoundException('User not found');

    const invite = this.communityInviteRepository.create({
      community,
      invitedUser,
      invitedBy: inviter,
    });

    await this.communityInviteRepository.save(invite);
  }
}

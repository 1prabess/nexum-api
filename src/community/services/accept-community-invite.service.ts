import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityInvite } from '../entities/community-invite.entity';
import { CommunityMember } from '../entities/community-member.entity';
import { CommunityQueryService } from './query-community.service';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CommunityInviteStatus } from '../enums/community-invite-status.enum';

@Injectable()
export class AcceptCommunityInviteService {
  constructor(
    @InjectRepository(CommunityInvite)
    private readonly inviteRepository: Repository<CommunityInvite>,

    @InjectRepository(CommunityMember)
    private readonly memberRepository: Repository<CommunityMember>,

    private readonly communityQueryService: CommunityQueryService,
  ) {}

  async execute(user: ICurrentUser, inviteId: number): Promise<void> {
    // Find invite
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId },
      relations: ['community', 'invitedUser'],
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    // Check if this invite belongs to the current user
    if (invite.invitedUser.id !== user.id) {
      throw new ForbiddenException('This invite does not belong to you');
    }

    // Check invite status
    if (invite.status !== CommunityInviteStatus.PENDING) {
      throw new BadRequestException('Invite already handled');
    }

    // Prevent duplicate membership
    const isMember = await this.communityQueryService.isMember(
      invite.community.id,
      user.id,
    );

    if (isMember) {
      throw new BadRequestException('Already a member of this community');
    }

    // Add user as community member
    const member = this.memberRepository.create({
      community: invite.community,
      user,
    });

    await this.memberRepository.save(member);

    // Update invite status
    invite.status = CommunityInviteStatus.ACCEPTED;
    await this.inviteRepository.save(invite);
  }
}

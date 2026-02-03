import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityInvite } from '../entities/community-invite.entity';
import { CommunityInviteStatus } from '../enums/community-invite-status.enum';
import { ICommunityInvite } from '../interfaces/community-invite.interface';

@Injectable()
export class GetCommunityInvitesService {
  constructor(
    @InjectRepository(CommunityInvite)
    private readonly communityInviteRepository: Repository<CommunityInvite>,
  ) {}

  async execute(userId: number): Promise<CommunityInvite[]> {
    return this.communityInviteRepository.find({
      where: {
        invitedUser: {
          id: userId,
        },
        status: CommunityInviteStatus.PENDING,
      },
      relations: ['community'],
      select: {
        id: true,
        status: true,
        createdAt: true,
        community: {
          id: true,
          name: true,
          avatar: true,
          visibility: true,
        },
      },
    });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityMember } from '../entities/community-member.entity';
import { CommunityMemberRole } from '../enums/community-member-role.enum';
import { CommunityVisibility } from '../enums/community-visibility.enum';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CommunityQueryService } from './query-community.service';

@Injectable()
export class JoinCommunityService {
  constructor(
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,

    private readonly communityQueryService: CommunityQueryService,
  ) {}

  async execute(communityId: number, user: ICurrentUser): Promise<void> {
    // Find community
    const community = await this.communityQueryService.findById(communityId, [
      'owner',
    ]);

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if the community is private
    if (community.visibility === CommunityVisibility.PRIVATE) {
      throw new ForbiddenException(
        'You cannot join a private community without invitation',
      );
    }

    // Check if user is already a member
    const isAlreadyMember = await this.communityQueryService.isMember(
      communityId,
      user.id,
    );

    if (isAlreadyMember) {
      throw new BadRequestException('Already a member');
    }

    const member = this.communityMemberRepository.create({
      community,
      user,
      role: CommunityMemberRole.MEMBER,
    });

    await this.communityMemberRepository.save(member);
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../entities/community.entity';
import { CommunityMember } from '../entities/community-member.entity';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommunityDto } from '../dtos/create-community.dto';
import { CommunityMemberRole } from '../enums/community-member-role.enum';
import { CommunityVisibility } from '../enums/community-visibility.enum';
import { CommunityQueryService } from './query-community.service';

@Injectable()
export class CreateCommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,

    private readonly communityQueryService: CommunityQueryService,
  ) {}

  async execute(
    owner: ICurrentUser,
    createCommunityDto: CreateCommunityDto,
  ): Promise<Community> {
    // Check if the community with same name already exists
    if (
      await this.communityQueryService.existsByName(createCommunityDto.name)
    ) {
      throw new BadRequestException('Community with same name already exists');
    }

    const community = this.communityRepository.create({
      name: createCommunityDto.name,
      description: createCommunityDto.description,
      avatar: createCommunityDto.avatar,
      coverImage: createCommunityDto.coverImage,
      visibility: createCommunityDto.visibility || CommunityVisibility.PUBLIC,
      owner,
    });

    await this.communityRepository.save(community);

    // Automatically add owner as a member with ADMIN role
    const ownerMember = this.communityMemberRepository.create({
      community,
      user: owner,
      role: CommunityMemberRole.ADMIN,
    });

    await this.communityMemberRepository.save(ownerMember);

    return community;
  }
}

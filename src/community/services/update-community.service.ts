import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../entities/community.entity';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CommunityQueryService } from './query-community.service';
import { UpdateCommunityDto } from '../dtos/update-community.dto';

@Injectable()
export class UpdateCommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,

    private readonly communityQueryService: CommunityQueryService,
  ) {}

  async execute(
    user: ICurrentUser,
    communityId: number,
    updateCommunityDto: UpdateCommunityDto,
  ): Promise<void> {
    // Find the community
    const community = await this.communityQueryService.findById(communityId, [
      'owner',
    ]);

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Allow only owner to update
    if (community.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this community');
    }

    // Merge the updated fields
    Object.assign(community, updateCommunityDto);

    // Save changes
    await this.communityRepository.save(community);
  }
}

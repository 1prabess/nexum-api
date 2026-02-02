import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../entities/community.entity';
import { CommunityMember } from '../entities/community-member.entity';

@Injectable()
export class CommunityQueryService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,

    @InjectRepository(CommunityMember)
    private readonly memberRepository: Repository<CommunityMember>,
  ) {}

  // Find community by id
  async findById(
    communityId: number,
    relations: string[] = [],
  ): Promise<Community | null> {
    return this.communityRepository.findOne({
      where: { id: communityId },
      relations,
    });
  }

  // Find community by name
  async findByName(
    name: string,
    relations: string[] = [],
  ): Promise<Community | null> {
    return this.communityRepository.findOne({
      where: { name },
      relations,
    });
  }

  // Check if community exists by name
  async existsByName(name: string): Promise<boolean> {
    const count = await this.communityRepository.count({ where: { name } });
    return count > 0;
  }

  // Check if the user a member of a particular community
  async isMember(communityId: number, userId: number): Promise<boolean> {
    return this.memberRepository.exist({
      where: { community: { id: communityId }, user: { id: userId } },
    });
  }
}

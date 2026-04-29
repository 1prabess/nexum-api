import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { CommunityInvite } from './entities/community-invite.entity';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommunityDto } from './dtos/create-community.dto';
import { UpdateCommunityDto } from './dtos/update-community.dto';
import { CommunityResponseDto } from './dtos/community-response.dto';
import { CommunityInviteResponseDto } from './dtos/community-invite.response.dto';
import { CommunityMemberRole } from './enums/community-member-role.enum';
import { CommunityVisibility } from './enums/community-visibility.enum';
import { CommunityInviteStatus } from './enums/community-invite-status.enum';
import { UserService } from 'src/user/user.service';
import { plainToInstance } from 'class-transformer';
import { TagService } from 'src/tag/tag.service';
import { PostService } from 'src/post/post.service';
import { paginate } from 'src/common/utils/pagination';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';

import { QuestionService } from 'src/question/question.service';
import { QuestionResponseDto } from 'src/common/dtos/question-response.dto';
import { PostResponseDto } from 'src/common/dtos/post-response.dto';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { CommunityMemberResponseDto } from './dtos/community-member.response.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(CommunityInvite)
    private readonly communityInviteRepository: Repository<CommunityInvite>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,

    private readonly userService: UserService,
    private readonly tagService: TagService,
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
    @Inject(forwardRef(() => QuestionService))
    private readonly questionService: QuestionService,
  ) {}

  // ------------------ CREATE COMMUNITY ------------------
  async create(
    user: ICurrentUser,
    createCommunityDto: CreateCommunityDto,
  ): Promise<CommunityResponseDto> {
    await this.ensureCommunityNameAvailable(createCommunityDto.name);

    // Ensure at least one tag is selected
    if (createCommunityDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    // Fetch tags and validate
    const tags = await this.tagService.findByIds(createCommunityDto.tagIds);
    if (tags.length !== createCommunityDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    // Create community entity
    const community = this.communityRepository.create({
      name: createCommunityDto.name,
      description: createCommunityDto.description,
      avatar: createCommunityDto.avatar,
      coverImage: createCommunityDto.coverImage,
      visibility: createCommunityDto.visibility || CommunityVisibility.PUBLIC,
      owner: { id: user.id },
      tags,
    });

    await this.saveCommunityOrThrowNameError(community);

    // Create owner as ADMIN member
    const ownerMember = this.communityMemberRepository.create({
      community,
      user: { id: user.id },
      role: CommunityMemberRole.ADMIN,
    });
    await this.communityMemberRepository.save(ownerMember);

    // Fetch saved community with tags
    const savedCommunity = await this.communityRepository.findOne({
      where: { id: community.id },
      relations: ['tags'],
    });

    return plainToInstance(CommunityResponseDto, savedCommunity, {
      excludeExtraneousValues: true,
    });
  }

  // ------------------ UPDATE COMMUNITY ------------------
  async update(
    user: ICurrentUser,
    communityId: number,
    updateCommunityDto: UpdateCommunityDto,
  ): Promise<CommunityResponseDto> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['owner', 'tags'],
    });
    if (!community) throw new NotFoundException('Community not found');

    // Check if current user is owner
    if (community.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this community');
    }

    if (
      updateCommunityDto.name &&
      updateCommunityDto.name.toLowerCase() !== community.name.toLowerCase()
    ) {
      await this.ensureCommunityNameAvailable(updateCommunityDto.name, communityId);
    }

    // ------------------ HANDLE TAG UPDATES ------------------
    if (updateCommunityDto.tagIds) {
      if (updateCommunityDto.tagIds.length < 1) {
        throw new BadRequestException('At least one tag is required');
      }

      const tags = await this.tagService.findByIds(updateCommunityDto.tagIds);
      if (tags.length !== updateCommunityDto.tagIds.length) {
        throw new BadRequestException('One or more tags are invalid');
      }

      community.tags = tags;
    }

    // Merge update fields into community
    Object.assign(community, updateCommunityDto);
    await this.saveCommunityOrThrowNameError(community);

    const updated = await this.communityRepository.findOne({
      where: { id: community.id },
      relations: ['owner', 'tags'],
    });

    return plainToInstance(CommunityResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  private async ensureCommunityNameAvailable(
    name: string,
    excludeCommunityId?: number,
  ): Promise<void> {
    const normalizedName = name.trim().toLowerCase();

    const existing = await this.communityRepository
      .createQueryBuilder('community')
      .where('LOWER(community.name) = :name', { name: normalizedName })
      .getOne();

    if (existing && existing.id !== excludeCommunityId) {
      throw new BadRequestException('Community name is already taken');
    }
  }

  private async saveCommunityOrThrowNameError(
    community: Community,
  ): Promise<Community> {
    try {
      return await this.communityRepository.save(community);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof (error as { driverError?: { code?: string } }).driverError?.code ===
          'string' &&
        (error as { driverError?: { code?: string } }).driverError?.code ===
          '23505'
      ) {
        throw new BadRequestException('Community name is already taken');
      }

      throw error;
    }
  }

  // ------------------ GET COMMUNITY FEED QUESTIONS ------------------
  async getCommunityFeedQuestions({
    communityId,
    page,
    limit,
    currentUserId,
  }: {
    communityId: number;
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    // Fetch community
    const community = await this.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    // Check membership if PRIVATE
    if (community.visibility === CommunityVisibility.PRIVATE) {
      const isMember = await this.isMember(communityId, currentUserId);
      if (!isMember)
        throw new ForbiddenException(
          'You are not a member of this private community',
        );
    }

    // Fetch questions with pagination
    const [questions, totalQuestions] =
      await this.questionService.getQuestionsByCommunity(
        communityId,
        page,
        limit,
        currentUserId,
      );

    // Paginate using helper
    const { data, meta, links } = paginate({
      items: questions,
      totalItems: totalQuestions,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/communities/${communityId}/questions`,
    });

    // Return paginated DTO
    return {
      data: plainToInstance(QuestionResponseDto, data, {
        excludeExtraneousValues: true,
      }),
      meta,
      links,
    };
  }

  // ------------------ GET COMMUNITY FEED POSTS ------------------
  async getCommunityFeedPosts({
    communityId,
    page,
    limit,
    currentUserId,
  }: {
    communityId: number;
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<PostResponseDto>> {
    const community = await this.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    if (community.visibility === CommunityVisibility.PRIVATE) {
      const isMember = await this.isMember(communityId, currentUserId);
      if (!isMember)
        throw new ForbiddenException(
          'You are not a member of this private community',
        );
    }

    const [posts, totalPosts] = await this.postService.getPostsByCommunity(
      communityId,
      page,
      limit,
      currentUserId,
    );

    const { data, meta, links } = paginate({
      items: posts,
      totalItems: totalPosts,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/communities/${communityId}/posts`,
    });

    return {
      data,
      meta,
      links,
    };
  }

  // ------------------ JOIN COMMUNITY ------------------
  async joinCommunity(communityId: number, user: ICurrentUser): Promise<void> {
    const community = await this.findById(communityId, ['owner']);
    if (!community) throw new NotFoundException('Community not found');

    if (community.visibility === CommunityVisibility.PRIVATE) {
      throw new ForbiddenException(
        'You cannot join a private community without invitation',
      );
    }

    if (await this.isMember(communityId, user.id)) {
      throw new BadRequestException('Already a member');
    }

    const member = this.communityMemberRepository.create({
      community,
      user,
      role: CommunityMemberRole.MEMBER,
    });

    await this.communityMemberRepository.save(member);
  }

  // ------------------ LEAVE COMMUNITY ------------------
  async leaveCommunity(communityId: number, user: ICurrentUser): Promise<void> {
    const community = await this.findById(communityId, ['owner']);
    if (!community) throw new NotFoundException('Community not found');

    if (community.owner.id === user.id) {
      throw new BadRequestException(
        'Community owner cannot leave. Delete the community instead.',
      );
    }

    const membership = await this.communityMemberRepository.findOne({
      where: { community: { id: communityId }, user: { id: user.id } },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this community');
    }

    await this.communityMemberRepository.delete({
      community: { id: communityId },
      user: { id: user.id },
    });
  }

  // ------------------ INVITE USER ------------------
  async invite(
    user: ICurrentUser,
    communityId: number,
    userId: number,
  ): Promise<void> {
    const community = await this.findById(communityId, ['owner']);
    if (!community) throw new NotFoundException('Community not found');

    if (community.owner.id !== user.id) {
      throw new ForbiddenException('Only owner can invite');
    }

    if (await this.isMember(communityId, userId)) {
      throw new BadRequestException('User already a member');
    }

    const invitedUser = await this.userService.findById(userId);
    if (!invitedUser) throw new NotFoundException('User not found');

    const existingInvite = await this.communityInviteRepository.findOne({
      where: {
        community: { id: communityId },
        invitedUser: { id: userId },
      },
      relations: ['community', 'invitedUser'],
    });

    if (existingInvite?.status === CommunityInviteStatus.PENDING) {
      throw new BadRequestException('User already has a pending invite');
    }

    if (
      existingInvite?.status === CommunityInviteStatus.ACCEPTED ||
      existingInvite?.status === CommunityInviteStatus.DECLINED
    ) {
      existingInvite.status = CommunityInviteStatus.PENDING;
      existingInvite.invitedBy = user as any;
      await this.communityInviteRepository.save(existingInvite);
      return;
    }

    const invite = this.communityInviteRepository.create({
      community,
      invitedUser,
      invitedBy: user,
    });

    await this.communityInviteRepository.save(invite);
  }

  // ------------------ ACCEPT INVITE ------------------
  async accept(user: ICurrentUser, inviteId: number): Promise<void> {
    const invite = await this.communityInviteRepository.findOne({
      where: { id: inviteId },
      relations: ['community', 'invitedUser'],
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.invitedUser.id !== user.id)
      throw new ForbiddenException('This invite does not belong to you');
    if (invite.status !== CommunityInviteStatus.PENDING)
      throw new BadRequestException('Invite already handled');
    if (await this.isMember(invite.community.id, user.id))
      throw new BadRequestException('Already a member of this community');

    // Create member
    const member = this.communityMemberRepository.create({
      community: invite.community,
      user,
    });
    await this.communityMemberRepository.save(member);

    // Mark invite as accepted
    invite.status = CommunityInviteStatus.ACCEPTED;
    await this.communityInviteRepository.save(invite);
  }

  async decline(user: ICurrentUser, inviteId: number): Promise<void> {
    const invite = await this.communityInviteRepository.findOne({
      where: { id: inviteId },
      relations: ['community', 'invitedUser'],
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.invitedUser.id !== user.id)
      throw new ForbiddenException('This invite does not belong to you');
    if (invite.status !== CommunityInviteStatus.PENDING)
      throw new BadRequestException('Invite already handled');

    invite.status = CommunityInviteStatus.DECLINED;
    await this.communityInviteRepository.save(invite);
  }

  // ------------------ GET INVITES ------------------
  async getInvites(user: ICurrentUser): Promise<CommunityInviteResponseDto[]> {
    const invites = await this.communityInviteRepository.find({
      where: {
        invitedUser: { id: user.id },
        status: CommunityInviteStatus.PENDING,
      },
      relations: ['community', 'invitedBy'],
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
        invitedBy: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
        },
      },
    });

    return plainToInstance(CommunityInviteResponseDto, invites, {
      excludeExtraneousValues: true,
    });
  }

  // ------------------ FIND COMMUNITY BY ID ------------------
  async findById(
    communityId: number,
    relations: string[] = [],
  ): Promise<Community | null> {
    return this.communityRepository.findOne({
      where: { id: communityId },
      relations,
    });
  }

  // ------------------ FIND COMMUNITY BY NAME ------------------
  async findByName(
    name: string,
    relations: string[] = [],
  ): Promise<Community | null> {
    return this.communityRepository.findOne({
      where: { name },
      relations,
    });
  }

  // ------------------ CHECK EXISTENCE BY NAME ------------------
  async existsByName(name: string): Promise<boolean> {
    const count = await this.communityRepository.count({ where: { name } });
    return count > 0;
  }

  // ------------------ CHECK MEMBERSHIP ------------------
  async isMember(communityId: number, userId: number): Promise<boolean> {
    return this.communityMemberRepository.exist({
      where: { community: { id: communityId }, user: { id: userId } },
    });
  }

  async getMemberRole(
    communityId: number,
    userId: number,
  ): Promise<CommunityMemberRole | null> {
    const membership = await this.communityMemberRepository.findOne({
      where: { community: { id: communityId }, user: { id: userId } },
    });

    return membership?.role ?? null;
  }

  async canManageContent(communityId: number, userId: number): Promise<boolean> {
    const role = await this.getMemberRole(communityId, userId);

    return (
      role === CommunityMemberRole.ADMIN ||
      role === CommunityMemberRole.MODERATOR
    );
  }

  // ------------------ GET COMMUNITY DTO ------------------
  async getCommunity(
    communityId: number,
    currentUserId: number,
  ): Promise<CommunityResponseDto> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['tags', 'owner'],
    });

    if (!community) throw new NotFoundException('Community not found');

    const isMember = await this.isMember(communityId, currentUserId);
    const memberRole = isMember
      ? await this.getMemberRole(communityId, currentUserId)
      : null;

    const dto = plainToInstance(CommunityResponseDto, community, {
      excludeExtraneousValues: true,
    });

    dto.isMember = isMember;
    dto.memberRole = memberRole;
    dto.canManageContent =
      memberRole === CommunityMemberRole.ADMIN ||
      memberRole === CommunityMemberRole.MODERATOR;
    return dto;
  }

  // ------------------ GET COMMUNITY MEMBERS ------------------
  async getMembers(
    user: ICurrentUser,
    communityId: number,
  ): Promise<CommunityMemberResponseDto[]> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['owner'],
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.owner.id !== user.id) {
      throw new ForbiddenException(
        'Only the community owner can view member list',
      );
    }

    const members = await this.communityMemberRepository.find({
      where: { community: { id: communityId } },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });

    return members.map((member) =>
      plainToInstance(
        CommunityMemberResponseDto,
        {
          userId: member.user.id,
          username: member.user.username,
          fullName: member.user.fullName ?? null,
          avatar: member.user.avatar ?? null,
          role: member.role,
          joinedAt: member.joinedAt,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  // ------------------ REMOVE COMMUNITY MEMBER ------------------
  async removeMember(
    user: ICurrentUser,
    communityId: number,
    memberUserId: number,
  ): Promise<void> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['owner'],
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.owner.id !== user.id) {
      throw new ForbiddenException('Only the community owner can remove members');
    }
    if (memberUserId === community.owner.id) {
      throw new BadRequestException('Community owner cannot be removed');
    }

    const member = await this.communityMemberRepository.findOne({
      where: {
        community: { id: communityId },
        user: { id: memberUserId },
      },
    });

    if (!member) throw new NotFoundException('Member not found in this community');

    await this.postRepository
      .createQueryBuilder()
      .delete()
      .from(Post)
      .where('"communityId" = :communityId', { communityId })
      .andWhere('"authorId" = :memberUserId', { memberUserId })
      .execute();

    await this.communityMemberRepository.delete({
      community: { id: communityId },
      user: { id: memberUserId },
    });
  }

  // ------------------ DELETE COMMUNITY ------------------
  async remove(user: ICurrentUser, communityId: number): Promise<void> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['owner'],
    });

    if (!community) throw new NotFoundException('Community not found');

    if (community.owner.id !== user.id) {
      throw new ForbiddenException('Only the community owner can delete it');
    }

    // Delete child content first to guarantee expected behavior
    // even if DB foreign key constraints are not synchronized yet.
    await this.questionRepository.delete({ community: { id: communityId } });
    await this.postRepository.delete({ community: { id: communityId } });

    await this.communityRepository.delete({ id: communityId });
  }
}

import {
  forwardRef,
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { FollowService } from 'src/follow/follow.service';
import { Community } from 'src/community/entities/community.entity';
import { CommunityMember } from 'src/community/entities/community-member.entity';
import { CommunityVisibility } from 'src/community/enums/community-visibility.enum';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserProfileResponseDto } from './dtos/user-profile.response.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    private readonly HashingProvider: HashingProvider,
    @Inject(forwardRef(() => FollowService))
    private readonly followService: FollowService,
  ) {}

  // ------------------ CREATE USER ------------------
  async create(
    username: string,
    email: string,
    password: string,
    avatar?: string,
  ): Promise<UserResponseDto> {
    const existingEmail = await this.findByEmail(email);
    if (existingEmail) {
      throw new UnauthorizedException(
        'User with the same email already exists',
      );
    }

    const existingUserName = await this.findByUserName(username);
    if (existingUserName) {
      throw new UnauthorizedException(
        'User with the same username already exists',
      );
    }

    const hashedPassword = await this.HashingProvider.hash(password);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    const savedUser = await this.userRepository.save(user);

    return plainToInstance(UserResponseDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }

  // ------------------ FIND ALL USERS ------------------
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();

    return plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });
  }

  async searchUsers(
    query: string,
    currentUserId: number,
    options?: { excludeCurrentUser?: boolean },
  ): Promise<UserResponseDto[]> {
    const normalizedQuery = query.trim();
    const excludeCurrentUser = options?.excludeCurrentUser ?? false;

    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    const likeQuery = `%${normalizedQuery}%`;
    const prefixQuery = `${normalizedQuery}%`;

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where(
        '(user.username ILIKE :likeQuery OR user.fullName ILIKE :likeQuery)',
        {
          likeQuery,
        },
      )
      .addSelect(
        `CASE
          WHEN LOWER(user.username) = LOWER(:exactQuery) THEN 0
          WHEN user.username ILIKE :prefixQuery THEN 1
          WHEN user.fullName ILIKE :prefixQuery THEN 2
          ELSE 3
        END`,
        'matchRank',
      )
      .setParameter('exactQuery', normalizedQuery)
      .setParameter('prefixQuery', prefixQuery)
      .setParameter('currentUserId', currentUserId)
      .orderBy('matchRank', 'ASC')
      .addOrderBy('user.followersCount', 'DESC')
      .addOrderBy('user.createdAt', 'DESC')
      .take(12)
      .getMany();

    const filteredUsers = excludeCurrentUser
      ? users.filter((user) => user.id !== currentUserId)
      : users;

    return plainToInstance(UserResponseDto, filteredUsers, {
      excludeExtraneousValues: true,
    });
  }

  // ------------------ FIND BY ID ------------------
  async findById(userId: number): Promise<User | null> {
    return await this.userRepository.findOneBy({
      id: userId,
    });
  }

  // ------------------ FIND BY EMAIL ------------------
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  // ------------------ FIND BY USERNAME ------------------
  async findByUserName(username: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ username });
  }

  // ------------------ FIND USER WITH REFRESH TOKEN ------------------
  async findByIdWithRefreshToken(userId: number): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id: userId })
      .getOne();
  }

  // ------------------ SET REFRESH TOKEN ------------------
  async setRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedRefreshToken = await this.HashingProvider.hash(refreshToken);

    user.refreshToken = hashedRefreshToken;

    await this.userRepository.save(user);
  }

  // ------------------ CLEAR REFRESH TOKEN ------------------
  async clearRefreshToken(userId: number): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.refreshToken = undefined;
    await this.userRepository.save(user);
  }

  // ------------------ GET PROFILE ------------------
  async getProfile(
    userId: number,
    currentUserId?: number,
  ): Promise<UserProfileResponseDto> {
    const [user, viewerMemberships, communitiesCreated, joinedMemberships] =
      await Promise.all([
        this.userRepository.findOne({
          where: { id: userId },
        }),
        currentUserId
          ? this.communityMemberRepository.find({
              where: { user: { id: currentUserId } },
              relations: ['community'],
            })
          : Promise.resolve([]),
        this.communityRepository.find({
          where: { owner: { id: userId } },
          order: { createdAt: 'DESC' },
        }),
        this.communityMemberRepository.find({
          where: { user: { id: userId } },
          relations: ['community', 'community.owner'],
          order: { joinedAt: 'DESC' },
        }),
      ]);

    if (!user) throw new NotFoundException('User not found');

    const profile = plainToInstance(UserProfileResponseDto, user, {
      excludeExtraneousValues: true,
    });

    const visibleCommunityIds = new Set<number>(
      viewerMemberships.map((membership) => membership.community.id),
    );
    const canViewPrivate = currentUserId === userId;

    profile.communitiesCreated = communitiesCreated
      .filter(
        (community) =>
          community.visibility === CommunityVisibility.PUBLIC ||
          canViewPrivate ||
          visibleCommunityIds.has(community.id),
      )
      .map((community) => ({
        id: community.id,
        name: community.name,
        avatar: community.avatar,
        visibility: community.visibility,
      }));

    profile.communitiesJoined = joinedMemberships
      .map((membership) => membership.community)
      .filter((community) => community.owner.id !== userId)
      .filter(
        (community) =>
          community.visibility === CommunityVisibility.PUBLIC ||
          canViewPrivate ||
          visibleCommunityIds.has(community.id),
      )
      .map((community) => ({
        id: community.id,
        name: community.name,
        avatar: community.avatar,
        visibility: community.visibility,
      }));

    if (currentUserId) {
      profile.isFollowing = await this.followService.isFollowing(
        currentUserId,
        userId,
      );
    } else {
      profile.isFollowing = false;
    }

    return profile;
  }

  // ------------------ UPDATE PROFILE ------------------
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUserName = await this.findByUserName(
        updateProfileDto.username,
      );
      if (existingUserName) {
        throw new UnauthorizedException('Username already in use');
      }
    }

    Object.assign(user, updateProfileDto);

    const updated = await this.userRepository.save(user);

    return plainToInstance(UserProfileResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ------------------ FOLLOW COUNTER INCREMENTS ------------------
  async incrementFollowingCount(userId: number): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'followingCount', 1);
  }

  async incrementFollowersCount(userId: number): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'followersCount', 1);
  }

  // ------------------ FOLLOW COUNTER DECREMENTS ------------------
  async decrementFollowingCount(userId: number): Promise<void> {
    await this.userRepository.decrement({ id: userId }, 'followingCount', 1);
  }

  async decrementFollowersCount(userId: number): Promise<void> {
    await this.userRepository.decrement({ id: userId }, 'followersCount', 1);
  }
}

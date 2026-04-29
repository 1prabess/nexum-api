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
import { VoteType } from 'src/common/enums/vote-type.enum';
import { PostVote } from 'src/post/entities/post-vote.entity';
import { QuestionVote } from 'src/question/entities/question-vote.entity';
import { AnswerVote } from 'src/answer/entities/answer-vote.entity';
import { CommentVote } from 'src/comment/entities/comment-vote.entity';
import { Answer } from 'src/answer/entities/answer.entity';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserProfileResponseDto } from './dtos/user-profile.response.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { User } from './user.entity';

type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
type UserBadge = {
  key: string;
  name: string;
  description: string;
  tier: BadgeTier;
  iconKey: string;
};

type ReputationMetrics = {
  reputation: number;
  postCount: number;
  questionCount: number;
  answerCount: number;
  commentCount: number;
  acceptedAnswersCount: number;
  upvotesReceivedOnComments: number;
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(PostVote)
    private readonly postVoteRepository: Repository<PostVote>,
    @InjectRepository(QuestionVote)
    private readonly questionVoteRepository: Repository<QuestionVote>,
    @InjectRepository(AnswerVote)
    private readonly answerVoteRepository: Repository<AnswerVote>,
    @InjectRepository(CommentVote)
    private readonly commentVoteRepository: Repository<CommentVote>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
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
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedUsername = this.normalizeUsername(username);

    const existingEmail = await this.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new UnauthorizedException(
        'User with the same email already exists',
      );
    }

    const existingUserName = await this.findByUserName(normalizedUsername);
    if (existingUserName) {
      throw new UnauthorizedException(
        'User with the same username already exists',
      );
    }

    const hashedPassword = await this.HashingProvider.hash(password);

    const user = this.userRepository.create({
      username: normalizedUsername,
      email: normalizedEmail,
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

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where(
        '(user.username ILIKE :likeQuery OR user.fullName ILIKE :likeQuery OR user.email ILIKE :likeQuery)',
        {
          likeQuery,
        },
      )
      .addSelect(
        `CASE
          WHEN LOWER(user.username) = LOWER(:exactQuery) THEN 0
          WHEN LOWER(user.email) = LOWER(:exactQuery) THEN 1
          WHEN user.username ILIKE :prefixQuery THEN 1
          WHEN user.fullName ILIKE :prefixQuery THEN 2
          WHEN user.email ILIKE :prefixQuery THEN 3
          ELSE 4
        END`,
        'matchRank',
      )
      .setParameter('exactQuery', normalizedQuery)
      .setParameter('prefixQuery', prefixQuery)
      .orderBy('"matchRank"', 'ASC')
      .addOrderBy('user.followersCount', 'DESC')
      .addOrderBy('user.createdAt', 'DESC')
      .take(12);

    if (excludeCurrentUser) {
      queryBuilder.andWhere('user.id != :currentUserId', { currentUserId });
    }

    const users = await queryBuilder.getMany();

    return plainToInstance(UserResponseDto, users, {
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
    return await this.userRepository.findOneBy({
      email: this.normalizeEmail(email),
    });
  }

  // ------------------ FIND BY USERNAME ------------------
  async findByUserName(username: string): Promise<User | null> {
    return await this.userRepository.findOneBy({
      username: this.normalizeUsername(username),
    });
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
    const metrics = await this.computeReputationMetrics(userId);
    profile.reputation = metrics.reputation;
    profile.badges = this.buildBadges(metrics);

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
    if (updateProfileDto.username) {
      user.username = this.normalizeUsername(updateProfileDto.username);
    }

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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  private async computeReputationMetrics(
    userId: number,
  ): Promise<ReputationMetrics> {
    const [
      postUpvotes,
      questionUpvotes,
      answerUpvotes,
      commentUpvotes,
      acceptedAnswersCount,
      postCount,
      questionCount,
      answerCount,
      commentCount,
    ] = await Promise.all([
      this.postVoteRepository
        .createQueryBuilder('vote')
        .innerJoin('vote.post', 'post')
        .where('post.authorId = :userId', { userId })
        .andWhere('vote.type = :voteType', { voteType: VoteType.UP })
        .getCount(),
      this.questionVoteRepository
        .createQueryBuilder('vote')
        .innerJoin('vote.question', 'question')
        .where('question.authorId = :userId', { userId })
        .andWhere('vote.type = :voteType', { voteType: VoteType.UP })
        .getCount(),
      this.answerVoteRepository
        .createQueryBuilder('vote')
        .innerJoin('vote.answer', 'answer')
        .where('answer.authorId = :userId', { userId })
        .andWhere('vote.type = :voteType', { voteType: VoteType.UP })
        .getCount(),
      this.commentVoteRepository
        .createQueryBuilder('vote')
        .innerJoin('vote.comment', 'comment')
        .where('comment.authorId = :userId', { userId })
        .andWhere('vote.type = :voteType', { voteType: VoteType.UP })
        .getCount(),
      this.answerRepository.count({
        where: {
          author: { id: userId },
          isAccepted: true,
        },
      }),
      this.postRepository.count({ where: { author: { id: userId } } }),
      this.questionRepository.count({ where: { author: { id: userId } } }),
      this.answerRepository.count({ where: { author: { id: userId } } }),
      this.commentRepository.count({ where: { author: { id: userId } } }),
    ]);

    const reputation = Math.max(
      0,
      postUpvotes * 10 +
        questionUpvotes * 12 +
        answerUpvotes * 15 +
        commentUpvotes * 4 +
        acceptedAnswersCount * 25,
    );

    return {
      reputation,
      postCount,
      questionCount,
      answerCount,
      commentCount,
      acceptedAnswersCount,
      upvotesReceivedOnComments: commentUpvotes,
    };
  }

  private buildBadges(metrics: ReputationMetrics): UserBadge[] {
    const badges: UserBadge[] = [];

    if (metrics.postCount >= 1) {
      badges.push({
        key: 'first-post',
        name: 'First Post',
        description: 'Published your first post',
        tier: 'BRONZE',
        iconKey: 'file-text',
      });
    }

    if (metrics.questionCount >= 10) {
      badges.push({
        key: 'curious-mind',
        name: 'Curious Mind',
        description: 'Asked 10+ questions',
        tier: 'SILVER',
        iconKey: 'compass',
      });
    }

    if (metrics.answerCount >= 25) {
      badges.push({
        key: 'helpful-responder',
        name: 'Helpful Responder',
        description: 'Posted 25+ answers',
        tier: 'GOLD',
        iconKey: 'messages-square',
      });
    }

    if (metrics.acceptedAnswersCount >= 1) {
      badges.push({
        key: 'accepted-bronze',
        name: 'Accepted Contributor',
        description: 'Received your first accepted answer',
        tier: 'BRONZE',
        iconKey: 'badge-check',
      });
    }

    if (metrics.acceptedAnswersCount >= 5) {
      badges.push({
        key: 'accepted-silver',
        name: 'Accepted Specialist',
        description: 'Received 5 accepted answers',
        tier: 'SILVER',
        iconKey: 'shield-check',
      });
    }

    if (metrics.acceptedAnswersCount >= 10) {
      badges.push({
        key: 'accepted-gold',
        name: 'Accepted Authority',
        description: 'Received 10 accepted answers',
        tier: 'GOLD',
        iconKey: 'award',
      });
    }

    if (metrics.acceptedAnswersCount >= 20) {
      badges.push({
        key: 'accepted-mentor',
        name: 'Accepted Mentor',
        description: 'Received 20 accepted answers',
        tier: 'GOLD',
        iconKey: 'graduation-cap',
      });
    }

    if (metrics.acceptedAnswersCount >= 50) {
      badges.push({
        key: 'accepted-master',
        name: 'Accepted Master',
        description: 'Received 50 accepted answers',
        tier: 'PLATINUM',
        iconKey: 'gem',
      });
    }

    if (metrics.acceptedAnswersCount >= 100) {
      badges.push({
        key: 'accepted-legend',
        name: 'Accepted Legend',
        description: 'Received 100 accepted answers',
        tier: 'PLATINUM',
        iconKey: 'crown',
      });
    }

    if (metrics.upvotesReceivedOnComments >= 10) {
      badges.push({
        key: 'helpful-commenter',
        name: 'Helpful Commenter',
        description: 'Received 10+ comment upvotes',
        tier: 'SILVER',
        iconKey: 'message-circle-heart',
      });
    }

    if (metrics.reputation >= 100) {
      badges.push({
        key: 'rising-star',
        name: 'Rising Star',
        description: 'Reached 100 reputation',
        tier: 'SILVER',
        iconKey: 'sparkles',
      });
    }

    if (metrics.reputation >= 500) {
      badges.push({
        key: 'community-expert',
        name: 'Community Expert',
        description: 'Reached 500 reputation',
        tier: 'GOLD',
        iconKey: 'star',
      });
    }

    if (metrics.reputation >= 1500) {
      badges.push({
        key: 'nexum-legend',
        name: 'Nexum Legend',
        description: 'Reached 1500 reputation',
        tier: 'PLATINUM',
        iconKey: 'trophy',
      });
    }

    return badges;
  }
}

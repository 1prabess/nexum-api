import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { CreatePostDto } from './dtos/create-post.dto';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { TagService } from 'src/tag/tag.service';
import { paginate } from 'src/common/utils/pagination';
import { VoteType } from '../common/enums/vote-type.enum';
import { PostVote } from './entities/post-vote.entity';
import { extractText } from '../common/utils/extract-text.utils';
import { SearchService } from 'src/search/search.service';
import { plainToInstance } from 'class-transformer';
import { PostResponseDto } from 'src/common/dtos/post-response.dto';
import { CommunityService } from 'src/community/community.service';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';
import { CommunityVisibility } from 'src/community/enums/community-visibility.enum';
import { NotificationService } from 'src/notification/notification.service';
import { UpdatePostDto } from './dtos/update-post.dto';
import { AuthorSummaryDto } from 'src/common/dtos/author-summary.dto';
import { FollowService } from 'src/follow/follow.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly tagService: TagService,
    private readonly searchService: SearchService,
    private readonly communityService: CommunityService,
    private readonly notificationService: NotificationService,
    private readonly followService: FollowService,

    private readonly dataSource: DataSource,
  ) {}

  // ------------------ CREATE POST ------------------
  async createPost(
    user: ICurrentUser,
    createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    if (createPostDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    const tags = await this.tagService.findByIds(createPostDto.tagIds);

    if (tags.length !== createPostDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    const textContent = extractText(createPostDto.content);

    const post = this.postRepository.create({
      title: createPostDto.title,
      content: createPostDto.content,
      searchContent: textContent,
      author: { id: user.id },
      tags,
    });

    await this.postRepository.save(post);

    await this.searchService.computeAndStoreVector(post, this.postRepository);

    const savedPost = await this.findPostEntity(post.id);
    if (!savedPost) {
      throw new NotFoundException('Post not found after creation');
    }

    return this.mapPostToDto(savedPost, user.id);
  }

  // ------------------ CREATE COMMUNITY POST ------------------
  async createCommunityPost(
    user: ICurrentUser,
    communityId: number,
    createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    if (createPostDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    const community = await this.communityService.findById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const isMember = await this.communityService.isMember(communityId, user.id);
    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the community to post',
      );
    }

    const tags = await this.tagService.findByIds(createPostDto.tagIds);
    if (tags.length !== createPostDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    const textContent = extractText(createPostDto.content);

    const post = this.postRepository.create({
      title: createPostDto.title,
      content: createPostDto.content,
      searchContent: textContent,
      author: { id: user.id },
      community,
      tags,
    });

    await this.postRepository.save(post);

    await this.searchService.computeAndStoreVector(post, this.postRepository);

    const savedPost = await this.findPostEntity(post.id);
    if (!savedPost) {
      throw new NotFoundException('Post not found after creation');
    }

    return this.mapPostToDto(savedPost, user.id);
  }

  // ------------------ GET POSTS ------------------
  async getPosts({
    page,
    limit,
    currentUserId,
  }: {
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<PostResponseDto>> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .leftJoinAndSelect('post.community', 'community')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('community.id IS NULL')
      .orWhere('community.visibility = :visibility', {
        visibility: CommunityVisibility.PUBLIC,
      })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await query.getManyAndCount();

    const items = posts.map((post) => this.mapPostToDto(post, currentUserId));

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/posts`,
    });
  }

  // ------------------ GET POSTS OF A USER ------------------
  async getPostsByUser({
    userId,
    page,
    limit,
    currentUserId,
  }: {
    userId: number;
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<PostResponseDto>> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .leftJoinAndSelect('post.community', 'community')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('author.id = :userId', { userId })
      .andWhere(
        '(post.communityId IS NULL OR community.visibility != :privateVisibility)',
        { privateVisibility: CommunityVisibility.PRIVATE },
      )
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await query.getManyAndCount();

    const items = posts.map((post) => this.mapPostToDto(post, currentUserId));

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/posts`,
    });
  }

  // ------------------ GET POSTS BY COMMUNITY ------------------
  async getPostsByCommunity(
    communityId: number,
    page: number,
    limit: number,
    currentUserId: number,
  ): Promise<[PostResponseDto[], number]> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('post.communityId = :communityId', { communityId })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await query.getManyAndCount();

    const items = posts.map((post) => this.mapPostToDto(post, currentUserId));

    return [items, total];
  }

  // ------------------ GET POSTS OF FOLLOWED USERS ------------------
  async getFollowingPosts({
    page,
    limit,
    currentUserId,
  }: {
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<PostResponseDto>> {
    const followingIds = await this.followService.getFollowingIds(currentUserId);

    if (followingIds.length === 0) {
      return paginate({
        items: [],
        totalItems: 0,
        currentPage: page,
        limit,
        route: `${process.env.API_URL}/posts/following`,
      });
    }

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .leftJoinAndSelect('post.community', 'community')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('author.id IN (:...followingIds)', { followingIds })
      .andWhere(
        '(post.communityId IS NULL OR community.visibility = :visibility)',
        { visibility: CommunityVisibility.PUBLIC },
      )
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await query.getManyAndCount();
    const items = posts.map((post) => this.mapPostToDto(post, currentUserId));

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/posts/following`,
    });
  }

  // ------------------ GET SINGLE POST ------------------
  async getPostById(
    postId: number,
    currentUserId?: number,
  ): Promise<PostResponseDto> {
    const post = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('post.id = :postId', { postId })
      .getOne();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapPostToDto(post, currentUserId);
  }

  // ------------------ UPDATE POST ------------------
  async updatePost(
    user: ICurrentUser,
    postId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.findPostEntity(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== user.id) {
      throw new ForbiddenException('You can only update your own post');
    }

    if (updatePostDto.tagIds && updatePostDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    if (updatePostDto.tagIds) {
      const tags = await this.tagService.findByIds(updatePostDto.tagIds);

      if (tags.length !== updatePostDto.tagIds.length) {
        throw new BadRequestException('One or more tags are invalid');
      }

      post.tags = tags;
    }

    if (typeof updatePostDto.title === 'string') {
      post.title = updatePostDto.title;
    }

    if (typeof updatePostDto.content === 'string') {
      post.content = updatePostDto.content;
      post.searchContent = extractText(updatePostDto.content);
    }

    await this.postRepository.save(post);
    await this.searchService.computeAndStoreVector(post, this.postRepository);

    const updatedPost = await this.findPostEntity(postId);
    if (!updatedPost) {
      throw new NotFoundException('Post not found after update');
    }

    return this.mapPostToDto(updatedPost, user.id);
  }

  // ------------------ DELETE POST ------------------
  async deletePost(user: ICurrentUser, postId: number): Promise<void> {
    const post = await this.findPostEntity(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const canManageCommunityPost = post.community
      ? await this.communityService.canManageContent(post.community.id, user.id)
      : false;

    if (post.author.id !== user.id && !canManageCommunityPost) {
      throw new ForbiddenException('You can only delete your own post');
    }

    await this.postRepository.remove(post);
  }

  // ------------------ FIND POST ENTITY ------------------
  async findPostEntity(postId: number): Promise<Post | null> {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoinAndSelect('post.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('post.id = :postId', { postId })
      .getOne();
  }

  // ------------------ VOTE ON POST ------------------
  async voteOnPost(userId: number, postId: number, type: VoteType) {
    let shouldNotify = false;
    let recipientId: number | null = null;
    let actorUsername = '';

    await this.dataSource.transaction(async (manager) => {
      const existingVote = await manager.findOne(PostVote, {
        where: { post: { id: postId }, user: { id: userId } },
        relations: ['post'],
      });

      const post = await manager.findOne(Post, {
        where: { id: postId },
        relations: ['author'],
      });
      if (!post) throw new NotFoundException('Post not found');

      const actor = await manager.query(
        'SELECT username FROM users WHERE id = $1 LIMIT 1',
        [userId],
      );
      actorUsername = actor[0]?.username ?? '';
      recipientId = post.author.id;

      if (!existingVote) {
        const vote = manager.create(PostVote, {
          post,
          user: { id: userId },
          type,
        });

        await manager.save(vote);

        if (type === VoteType.UP) {
          await manager.increment(Post, { id: postId }, 'upvotes', 1);
        } else {
          await manager.increment(Post, { id: postId }, 'downvotes', 1);
        }

        shouldNotify = true;
        return;
      }

      if (existingVote.type === type) {
        await manager.remove(existingVote);

        if (type === VoteType.UP) {
          await manager.decrement(Post, { id: postId }, 'upvotes', 1);
        } else {
          await manager.decrement(Post, { id: postId }, 'downvotes', 1);
        }

        return;
      }

      const previousType = existingVote.type;
      existingVote.type = type;
      await manager.save(existingVote);

      if (previousType === VoteType.UP) {
        await manager.decrement(Post, { id: postId }, 'upvotes', 1);
        await manager.increment(Post, { id: postId }, 'downvotes', 1);
      } else {
        await manager.decrement(Post, { id: postId }, 'downvotes', 1);
        await manager.increment(Post, { id: postId }, 'upvotes', 1);
      }

      shouldNotify = true;
    });

    if (shouldNotify && recipientId) {
      await this.notificationService.notifyPostVote({
        recipientId,
        actorId: userId,
        actorUsername,
        postId,
        voteType: type,
      });
    }

    const updatedPost = await this.postRepository.findOne({
      where: { id: postId },
      select: ['upvotes', 'downvotes'],
    });

    if (!updatedPost)
      throw new NotFoundException('Post not found after voting');

    return {
      upvotes: updatedPost.upvotes,
      downvotes: updatedPost.downvotes,
    };
  }

  async getPostVoters(
    postId: number,
    type: VoteType,
  ): Promise<AuthorSummaryDto[]> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const votes = await this.dataSource.getRepository(PostVote).find({
      where: { post: { id: postId }, type },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(
      AuthorSummaryDto,
      votes.map((vote) => vote.user),
      { excludeExtraneousValues: true },
    );
  }

  // ------------------ MAP TO DTO ------------------
  private mapPostToDto(post: Post, currentUserId?: number): PostResponseDto {
    const dto = plainToInstance(PostResponseDto, post, {
      excludeExtraneousValues: true,
    });

    dto.userVote = currentUserId
      ? (post.votes?.find((v) => v.user.id === currentUserId)?.type ?? null)
      : null;

    dto.commentCount = (post as any).commentCount ?? 0;

    return dto;
  }
}

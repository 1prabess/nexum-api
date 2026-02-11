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
import { TagService } from 'src/tag/providers/tag.service';
import { paginate } from 'src/common/utils/pagination';
import { IPost } from 'src/common/interfaces/post.interface';
import { CommunityQueryService } from 'src/community/services/query-community.service';
import { VoteType } from './enums/post-vote.enum';
import { PostVote } from './entities/post-vote.entity';
import { extractText } from './utils/extract-text.utils';
import { SearchService } from 'src/search/search.service';

/**
 * Service responsible for all post-related business logic:
 * - Creating regular posts and community posts
 * - Fetching posts (all, by user, single)
 * - Voting system (upvote/downvote with toggle/remove logic)
 */
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly tagService: TagService,
    private readonly communityQueryService: CommunityQueryService,
    private readonly searchService: SearchService,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new standalone post (not tied to any community)
   * @param user - Currently authenticated user
   * @param createPostDto - Data transfer object with post details
   * @throws BadRequestException if no tags or invalid tags are provided
   */
  async create(
    user: ICurrentUser,
    createPostDto: CreatePostDto,
  ): Promise<void> {
    // Enforce at least one tag requirement
    if (createPostDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    // Fetch tags by their IDs
    const tags = await this.tagService.findByIds(createPostDto.tagIds);

    // Make sure all requested tags actually exist
    if (tags.length !== createPostDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    // Extract plain text version of content for search/indexing
    const textContent = extractText(createPostDto.content);

    // Create post entity instance
    const post = this.postRepository.create({
      title: createPostDto.title,
      content: createPostDto.content, // JSON from BlockNote editor
      searchContent: textContent, // plain text for full-text search / vector embedding
      author: { id: user.id },
      tags,
    });

    // Persist the new post
    await this.postRepository.save(post);

    // Generate and store vector embedding for semantic search
    await this.searchService.computeAndStoreVector(post);
  }

  /**
   * Creates a post inside a specific community
   * @param user - Currently authenticated user
   * @param communityId - ID of the target community
   * @param createPostDto - Post creation payload
   * @throws NotFoundException if community doesn't exist
   * @throws ForbiddenException if user is not a member
   * @throws BadRequestException if tags are missing or invalid
   */
  async createCommunityPost(
    user: ICurrentUser,
    communityId: number,
    createPostDto: CreatePostDto,
  ): Promise<void> {
    if (createPostDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    // Verify community exists
    const community = await this.communityQueryService.findById(communityId);

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Only community members can post
    const isMember = await this.communityQueryService.isMember(
      communityId,
      user.id,
    );

    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the community to post',
      );
    }

    // Validate all provided tags exist
    const tags = await this.tagService.findByIds(createPostDto.tagIds);

    if (tags.length !== createPostDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    // Create post entity with community relation
    const post = this.postRepository.create({
      title: createPostDto.title,
      content: createPostDto.content,
      author: { id: user.id },
      community, // attaches post to community
      tags,
    });

    // Save the post
    await this.postRepository.save(post);
  }

  /**
   * Get paginated list of all posts (global feed)
   */
  async findAll({
    page,
    limit,
    currentUserId,
  }: {
    page: number;
    limit: number;
    currentUserId: number;
  }) {
    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['author', 'tags', 'votes', 'votes.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform to frontend-friendly shape
    const items: IPost[] = posts.map((post) =>
      this.mapPostToIPost(post, currentUserId),
    );

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/posts`,
    });
  }

  /**
   * Get paginated list of posts created by a specific user
   */
  async findAllByUser({
    userId,
    page,
    limit,
    currentUserId,
  }: {
    userId: number;
    page: number;
    limit: number;
    currentUserId: number;
  }) {
    const [posts, total] = await this.postRepository.findAndCount({
      where: {
        author: { id: userId },
      },
      relations: ['author', 'tags', 'votes', 'votes.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: IPost[] = posts.map((post) =>
      this.mapPostToIPost(post, currentUserId),
    );

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/posts`,
    });
  }

  /**
   * Get a single post by ID with vote information for current user
   */
  async find(postId: number, currentUserId?: number): Promise<IPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author', 'tags', 'votes', 'votes.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapPostToIPost(post, currentUserId);
  }

  /**
   * Handles upvote / downvote logic with toggle & remove behavior
   * Uses transaction to keep vote & counter consistent
   *
   * Behavior:
   * - No previous vote → add new vote
   * - Click same vote type → remove vote
   * - Click opposite → switch vote
   */
  async vote(userId: number, postId: number, type: VoteType) {
    await this.dataSource.transaction(async (manager) => {
      // Try to find existing vote by this user on this post
      const existingVote = await manager.findOne(PostVote, {
        where: { post: { id: postId }, user: { id: userId } },
        relations: ['post'],
      });

      // Make sure post still exists
      const post = await manager.findOne(Post, { where: { id: postId } });
      if (!post) throw new NotFoundException('Post not found');

      // Case 1: First vote from this user
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
        return;
      }

      // Case 2: User clicked the same vote type → remove vote
      if (existingVote.type === type) {
        await manager.remove(existingVote);

        if (type === VoteType.UP) {
          await manager.decrement(Post, { id: postId }, 'upvotes', 1);
        } else {
          await manager.decrement(Post, { id: postId }, 'downvotes', 1);
        }
        return;
      }

      // Case 3: Switching vote (UP → DOWN or DOWN → UP)
      if (existingVote.type === VoteType.UP) {
        await manager.decrement(Post, { id: postId }, 'upvotes', 1);
        await manager.increment(Post, { id: postId }, 'downvotes', 1);
      } else {
        await manager.decrement(Post, { id: postId }, 'downvotes', 1);
        await manager.increment(Post, { id: postId }, 'upvotes', 1);
      }

      // Update vote type in DB
      existingVote.type = type;
      await manager.save(existingVote);
    });

    // Fetch final vote counts to return
    const updatedPost = await this.postRepository.findOne({
      where: { id: postId },
      select: ['upvotes', 'downvotes'],
    });

    if (!updatedPost) {
      throw new NotFoundException('Post not found after voting');
    }

    return { upvotes: updatedPost.upvotes, downvotes: updatedPost.downvotes };
  }

  /**
   * Maps TypeORM Post entity → frontend-friendly IPost interface
   * Also includes current user's vote status
   */
  private mapPostToIPost = (post: Post, currentUserId?: number): any => {
    // Find if current user has voted on this post
    const userVoteRecord = post.votes?.find((v) => v.user.id === currentUserId);

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        username: post.author.username,
        fullName: post.author.fullName,
        bio: post.author.bio,
        coverPhoto: post.author.coverPhoto,
        avatar: post.author.avatar,
        email: post.author.email,
        followersCount: post.author.followersCount,
        followingCount: post.author.followingCount,
        createdAt: post.author.createdAt,
        updatedAt: post.author.updatedAt,
      },
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      userVote: userVoteRecord?.type || null, // UP, DOWN or null
      tags: post.tags.map((t) => ({ id: t.id, name: t.name })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  };
}

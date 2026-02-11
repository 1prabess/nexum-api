import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreatePostDto } from './dtos/create-post.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VotePostDto } from './dtos/vote-post.dto';

/**
 * Controller handling all post-related HTTP endpoints.
 * All routes are protected by JWT authentication.
 */
@Controller()
@UseGuards(JwtAccessTokenAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * POST /posts
   * Creates a new standalone post (not tied to any community)
   */
  @ApiOperation({ summary: 'Create a new post' })
  @Post('/posts')
  @ResponseMessage('Post created successfully')
  create(
    @CurrentUser() user: ICurrentUser,
    @Body() createPostDto: CreatePostDto,
  ): Promise<void> {
    return this.postService.create(user, createPostDto);
  }

  /**
   * POST /communities/:communityId/posts
   * Creates a new post inside a specific community
   * Requires the user to be a member of the community
   */
  @ApiOperation({ summary: 'Create a new post inside a community' })
  @Post('/communities/:communityId/posts')
  @ResponseMessage('Post created successfully')
  createInCommunity(
    @CurrentUser() user: ICurrentUser,
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<void> {
    return this.postService.createCommunityPost(
      user,
      communityId,
      createPostDto,
    );
  }

  /**
   * GET /posts
   * Retrieves paginated list of all posts (global feed)
   * Returns posts with author, tags, vote counts, and current user's vote status
   */
  @ApiOperation({ summary: 'Find posts from all users' })
  @ApiQuery({
    name: 'page',
    description: 'Page number (starts from 1)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
  })
  @Get('/posts')
  async findAll(
    // Parse query params with fallback defaults
    @Query(
      'page',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(1),
    )
    page: number,

    @Query(
      'limit',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(10),
    )
    limit: number,

    // Extract only user ID from authenticated user
    @CurrentUser('id') id: number,
  ) {
    return this.postService.findAll({
      page,
      limit,
      currentUserId: id,
    });
  }

  /**
   * GET /users/:userId/posts
   * Retrieves paginated list of posts created by a specific user
   */
  @ApiOperation({ summary: 'Find posts of a specific user' })
  @ApiQuery({
    name: 'page',
    description: 'Page number (starts from 1)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
  })
  @Get('/users/:userId/posts')
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,

    @Query(
      'page',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(1),
    )
    page: number,

    @Query(
      'limit',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(10),
    )
    limit: number,

    @CurrentUser('id') currentUserId: number,
  ) {
    return this.postService.findAllByUser({
      userId,
      page,
      limit,
      currentUserId,
    });
  }

  /**
   * GET /posts/:postId
   * Retrieves a single post by ID
   * Includes author info, tags, vote counts, and current user's vote (if any)
   */
  @ApiOperation({ summary: 'Find a specific post' })
  @Get('/posts/:postId')
  async find(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('id') currentUserId: number,
  ) {
    return this.postService.find(postId, currentUserId);
  }

  /**
   * POST /posts/:postId/vote
   * Upvote, downvote, or remove vote on a post
   */
  @ApiOperation({ summary: 'Upvote or downvote a post' })
  @ApiParam({
    name: 'postId',
    type: Number,
    description: 'ID of the post to vote on',
  })
  @Post('/posts/:postId/vote')
  @ResponseMessage('Vote recorded successfully')
  async vote(
    @CurrentUser() user: ICurrentUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() voteDto: VotePostDto,
  ) {
    return this.postService.vote(user.id, postId, voteDto.type);
  }
}

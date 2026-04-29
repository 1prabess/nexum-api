import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
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
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { PostResponseDto } from 'src/common/dtos/post-response.dto';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { VoteType } from 'src/common/enums/vote-type.enum';
import { AuthorSummaryDto } from 'src/common/dtos/author-summary.dto';
import { VoteResultDto } from 'src/common/dtos/vote-result.dto';

@Controller()
@UseGuards(JwtAccessTokenAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  // ------------------ CREATE STANDALONE POST ------------------
  @ApiOperation({ summary: 'Create a new post' })
  @ApiSuccessResponse(PostResponseDto, {
    message: 'Post created successfully',
  })
  @Post('/posts')
  @ResponseMessage('Post created successfully')
  create(
    @CurrentUser() user: ICurrentUser,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postService.createPost(user, createPostDto);
  }

  // ------------------ CREATE COMMUNITY POST ------------------
  @ApiOperation({ summary: 'Create a new post inside a community' })
  @ApiSuccessResponse(PostResponseDto, {
    message: 'Post created successfully in community',
  })
  @Post('/communities/:communityId/posts')
  @ResponseMessage('Post created successfully in community')
  createInCommunity(
    @CurrentUser() user: ICurrentUser,
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postService.createCommunityPost(
      user,
      communityId,
      createPostDto,
    );
  }

  // ------------------ GET GLOBAL POSTS (FEED) ------------------
  @ApiOperation({ summary: 'Find posts from all users' })
  @ApiSuccessResponse(PaginatedResponseDto<PostResponseDto>, {
    message: 'Global posts fetched successfully',
    paginatedItemsType: PostResponseDto,
  })
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
  @Get('/posts/feed')
  @ResponseMessage('Global posts fetched successfully')
  async getPosts(
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

    @CurrentUser('id') id: number,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    return this.postService.getPosts({
      page,
      limit,
      currentUserId: id,
    });
  }

  // ------------------ FIND POSTS FROM FOLLOWINGS ------------------
  @ApiOperation({ summary: 'Find posts from users the current user follows' })
  @ApiSuccessResponse(PaginatedResponseDto<PostResponseDto>, {
    message: 'Following posts fetched successfully',
    paginatedItemsType: PostResponseDto,
  })
  @Get('/posts/following')
  @ResponseMessage('Following posts fetched successfully')
  async getFollowingPosts(
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
    @CurrentUser('id') id: number,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    return this.postService.getFollowingPosts({
      page,
      limit,
      currentUserId: id,
    });
  }

  // ------------------ GET POSTS BY USER ------------------
  @ApiOperation({ summary: 'Find posts of a specific user' })
  @ApiSuccessResponse(PaginatedResponseDto<PostResponseDto>, {
    message: 'Posts of user fetched successfully',
    paginatedItemsType: PostResponseDto,
  })
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
  @ResponseMessage('Posts of user fetched successfully')
  async getPostsByUser(
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
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    return this.postService.getPostsByUser({
      userId,
      page,
      limit,
      currentUserId,
    });
  }

  // ------------------ GET POSTS BY TAG ------------------
  @ApiOperation({ summary: 'Find posts by tag name' })
  @ApiSuccessResponse(PaginatedResponseDto<PostResponseDto>, {
    message: 'Posts by tag fetched successfully',
    paginatedItemsType: PostResponseDto,
  })
  @ApiParam({
    name: 'tagName',
    description: 'Tag name (slug) to filter posts by',
    type: String,
  })
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
  @Get('/posts/tag/:tagName')
  @ResponseMessage('Posts by tag fetched successfully')
  async getPostsByTag(
    @Param('tagName') tagName: string,
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
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    return this.postService.getPostsByTag({
      tagName,
      page,
      limit,
      currentUserId,
    });
  }

  // ------------------ GET SINGLE POST ------------------
  @ApiOperation({ summary: 'Find a specific post' })
  @ApiSuccessResponse(PostResponseDto, {
    message: 'Post fetched successfully',
  })
  @Get('/posts/:postId')
  @ResponseMessage('Post fetched successfully')
  async getPostById(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('id') currentUserId: number,
  ): Promise<PostResponseDto> {
    return this.postService.getPostById(postId, currentUserId);
  }

  // ------------------ UPDATE POST ------------------
  @ApiOperation({ summary: 'Update a post' })
  @ApiSuccessResponse(PostResponseDto, {
    message: 'Post updated successfully',
  })
  @Patch('/posts/:postId')
  @ResponseMessage('Post updated successfully')
  update(
    @CurrentUser() user: ICurrentUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.postService.updatePost(user, postId, updatePostDto);
  }

  // ------------------ DELETE POST ------------------
  @ApiOperation({ summary: 'Delete a post' })
  @ApiSuccessResponse(null, {
    message: 'Post deleted successfully',
    noData: true,
  })
  @Delete('/posts/:postId')
  @ResponseMessage('Post deleted successfully')
  remove(
    @CurrentUser() user: ICurrentUser,
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<void> {
    return this.postService.deletePost(user, postId);
  }

  // ------------------ VOTE ON POST ------------------
  @ApiOperation({ summary: 'Upvote or downvote a post' })
  @ApiParam({
    name: 'postId',
    type: Number,
    description: 'ID of the post to vote on',
  })
  @ApiSuccessResponse(VoteResultDto, {
    message: 'Vote recorded successfully',
  })
  @Post('/posts/:postId/vote')
  @ResponseMessage('Vote recorded successfully')
  async vote(
    @CurrentUser() user: ICurrentUser,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() voteDto: VotePostDto,
  ) {
    return this.postService.voteOnPost(user.id, postId, voteDto.type);
  }

  // ------------------ GET VOTERS OF A POST ------------------
  @ApiOperation({ summary: 'Get voters of a post by vote type' })
  @ApiSuccessResponse(AuthorSummaryDto, {
    isArray: true,
    message: 'Post voters fetched successfully',
  })
  @Get('/posts/:postId/voters')
  @ResponseMessage('Post voters fetched successfully')
  getPostVoters(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('type', new ParseEnumPipe(VoteType)) type: VoteType,
  ): Promise<AuthorSummaryDto[]> {
    return this.postService.getPostVoters(postId, type);
  }
}

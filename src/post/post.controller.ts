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
import { PostService } from './providers/post.service';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreatePostDto } from './dtos/create-post.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('posts')
@UseGuards(JwtAccessTokenAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  // =====================================================
  // Create a new post
  // =====================================================
  @ApiOperation({ summary: 'Create a new post' })
  @Post()
  @ResponseMessage('Post created successfully')
  create(
    @CurrentUser() user: ICurrentUser,
    @Body() createPostDto: CreatePostDto,
  ): Promise<void> {
    return this.postService.create(user, createPostDto);
  }

  // =====================================================
  // Get all posts for feed
  // =====================================================
  @ApiOperation({ summary: 'Find posts from all user' })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    type: Number,
  })
  @Get()
  async findAll(
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
  ) {
    return this.postService.findAll({ page, limit });
  }

  // =====================================================
  // Get all posts of a specific user
  // =====================================================
  @ApiOperation({ summary: 'Find posts of a specific user' })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    type: Number,
  })
  @Get('/user/:userId')
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
  ) {
    return this.postService.findAllByUser({ userId, page, limit });
  }

  // =====================================================
  // Get a specific post
  // =====================================================
  @ApiOperation({ summary: 'Find a specific post' })
  @Get('/:postId')
  async find(@Param('postId', ParseIntPipe) postId: number) {
    return this.postService.find(postId);
  }
}

import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './services/comment.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentResponse } from './interfaces/comment-response.interface';

@Controller('comments')
@UseGuards(JwtAccessTokenAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Create comment (top-level or reply)
  @ApiOperation({ summary: 'Create a comment or reply to a comment' })
  @Post()
  @ResponseMessage('Comment created successfully')
  create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.commentService.create(user, createCommentDto);
  }

  // Get comments of a post
  @ApiOperation({ summary: 'Get all comments of a post (with replies)' })
  @ApiQuery({
    name: 'postId',
    type: Number,
    required: true,
    description: 'Post ID to fetch comments for',
  })
  @Get()
  find(
    @Query('postId', ParseIntPipe) postId: number,
  ): Promise<CommentResponse[]> {
    return this.commentService.find(postId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentResponseDto } from './dtos/comment-response.dto';
import { VoteType } from 'src/common/enums/vote-type.enum';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { VoteResultDto } from 'src/common/dtos/vote-result.dto';

@Controller('comments')
@UseGuards(JwtAccessTokenAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // ------------------ CREATE COMMENT ------------------
  @ApiOperation({ summary: 'Create a comment or reply to a comment' })
  @ApiSuccessResponse(null, {
    message: 'Comment created successfully',
    noData: true,
  })
  @Post()
  @ResponseMessage('Comment created successfully')
  create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.commentService.create(user, createCommentDto);
  }

  // ------------------ GET COMMENTS BY POST ------------------
  @ApiOperation({ summary: 'Get all comments of a post (with replies)' })
  @ApiQuery({
    name: 'postId',
    type: Number,
    required: true,
    description: 'Post ID to fetch comments for',
  })
  @ApiSuccessResponse(CommentResponseDto, {
    isArray: true,
    message: 'Comments fetched successfully',
  })
  @Get()
  @ResponseMessage('Comments fetched successfully')
  find(
    @Query('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<CommentResponseDto[]> {
    return this.commentService.find(postId, user.id);
  }

  // ------------------ VOTE ON COMMENT ------------------
  @ApiOperation({ summary: 'Vote on a comment' })
  @ApiSuccessResponse(VoteResultDto, {
    message: 'Vote recorded successfully',
  })
  @Patch(':commentId/vote/:type')
  @ResponseMessage('Vote recorded successfully')
  vote(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Param('type') type: VoteType,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.commentService.vote(user.id, commentId, type);
  }

  // ------------------ DELETE COMMENT ------------------
  @ApiOperation({ summary: 'Delete own comment' })
  @ApiSuccessResponse(null, {
    message: 'Comment deleted successfully',
    noData: true,
  })
  @Delete(':commentId')
  @ResponseMessage('Comment deleted successfully')
  remove(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.commentService.remove(user.id, commentId);
  }
}

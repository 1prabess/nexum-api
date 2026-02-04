import { Injectable } from '@nestjs/common';
import { CreateCommentService } from './create-comment.service';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { Comment } from '../entities/comment.entity';
import { GetPostCommentsService } from './get-post-comments.service';
import { CommentResponse } from '../interfaces/comment-response.interface';

@Injectable()
export class CommentService {
  constructor(
    private readonly createCommentService: CreateCommentService,
    private readonly getPostCommentsService: GetPostCommentsService,
  ) {}

  // Create comment
  create(
    user: ICurrentUser,
    createCommentDto: CreateCommentDto,
  ): Promise<void> {
    return this.createCommentService.execute(user, createCommentDto);
  }

  // Get comments of a post
  find(postId: number): Promise<CommentResponse[]> {
    return this.getPostCommentsService.execute(postId);
  }
}

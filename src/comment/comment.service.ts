import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { Comment } from './entities/comment.entity';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { PostService } from 'src/post/post.service';
import { CommentResponseDto } from './dtos/comment-response.dto';
import { NotificationService } from 'src/notification/notification.service';
import { CommentVote } from './entities/comment-vote.entity';
import { VoteType } from 'src/common/enums/vote-type.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentVote)
    private readonly commentVoteRepository: Repository<CommentVote>,
    private readonly postService: PostService,
    private readonly notificationService: NotificationService,
  ) {}

  // ------------------ CREATE COMMENT ------------------
  async create(
    user: ICurrentUser,
    createCommentDto: CreateCommentDto,
  ): Promise<void> {
    const post = await this.postService.findPostEntity(createCommentDto.postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let parentComment: Comment | null = null;

    if (createCommentDto.parentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentId },
        relations: ['post'],
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.post.id !== post.id) {
        throw new BadRequestException(
          'Parent comment does not belong to this post',
        );
      }
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      author: user,
      post,
      parent: parentComment ?? undefined,
    });

    await this.commentRepository.save(comment);

    await this.notificationService.notifyCommentOnPost({
      recipientId: post.author.id,
      actorId: user.id,
      actorUsername: user.username,
      postId: post.id,
    });
  }

  // ------------------ GET POST COMMENTS ------------------
  async find(
    postId: number,
    currentUserId?: number,
  ): Promise<CommentResponseDto[]> {
    const post = await this.postService.findPostEntity(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comments = await this.commentRepository.find({
      where: {
        post: { id: postId },
        parent: IsNull(),
      },
      relations: {
        author: true,
        votes: { user: true },
        replies: {
          author: true,
          votes: { user: true },
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    // Convert Entities → Clean DTOs
    return comments.map((comment) => this.mapCommentToDto(comment, currentUserId));
  }

  async vote(
    userId: number,
    commentId: number,
    type: VoteType,
  ): Promise<{ upvotes: number; downvotes: number }> {
    let shouldNotify = false;
    let recipientId: number | null = null;
    let postId: number | null = null;
    let actorUsername = '';

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author', 'post'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    recipientId = comment.author.id;
    postId = comment.post.id;

    const actor = await this.commentRepository.manager.query(
      'SELECT username FROM users WHERE id = $1 LIMIT 1',
      [userId],
    );
    actorUsername = actor[0]?.username ?? '';

    const existingVote = await this.commentVoteRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
      relations: ['comment'],
    });

    if (!existingVote) {
      const vote = this.commentVoteRepository.create({
        comment: { id: commentId },
        user: { id: userId },
        type,
      });
      await this.commentVoteRepository.save(vote);

      if (type === VoteType.UP) {
        comment.upvotes += 1;
      } else {
        comment.downvotes += 1;
      }

      await this.commentRepository.save(comment);
      shouldNotify = true;

      if (shouldNotify && recipientId && postId) {
        await this.notificationService.notifyCommentVote({
          recipientId,
          actorId: userId,
          actorUsername,
          commentId,
          postId,
          voteType: type,
        });
      }

      return { upvotes: comment.upvotes, downvotes: comment.downvotes };
    }

    if (existingVote.type === type) {
      await this.commentVoteRepository.remove(existingVote);

      if (type === VoteType.UP) {
        comment.upvotes = Math.max(0, comment.upvotes - 1);
      } else {
        comment.downvotes = Math.max(0, comment.downvotes - 1);
      }

      await this.commentRepository.save(comment);
      return { upvotes: comment.upvotes, downvotes: comment.downvotes };
    }

    if (existingVote.type === VoteType.UP) {
      comment.upvotes = Math.max(0, comment.upvotes - 1);
      comment.downvotes += 1;
    } else {
      comment.downvotes = Math.max(0, comment.downvotes - 1);
      comment.upvotes += 1;
    }

    existingVote.type = type;
    await this.commentVoteRepository.save(existingVote);
    await this.commentRepository.save(comment);
    shouldNotify = true;

    if (shouldNotify && recipientId && postId) {
      await this.notificationService.notifyCommentVote({
        recipientId,
        actorId: userId,
        actorUsername,
        commentId,
        postId,
        voteType: type,
      });
    }

    return { upvotes: comment.upvotes, downvotes: comment.downvotes };
  }

  // ------------------ DELETE COMMENT ------------------
  async remove(userId: number, commentId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.delete({ id: commentId });
  }

  private mapCommentToDto(
    comment: Comment,
    currentUserId?: number,
  ): CommentResponseDto {
    const dto = plainToInstance(CommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });

    dto.userVote = currentUserId
      ? (comment.votes?.find((vote) => vote.user.id === currentUserId)?.type ??
          null)
      : null;

    dto.replies = (comment.replies ?? []).map((reply) =>
      this.mapCommentToDto(reply, currentUserId),
    );

    return dto;
  }
}

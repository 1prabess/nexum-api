import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { PostService } from 'src/post/providers/post.service';
import { CommentResponse } from '../interfaces/comment-response.interface';

@Injectable()
export class GetPostCommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly postService: PostService,
  ) {}

  async execute(postId: number): Promise<CommentResponse[]> {
    const post = await this.postService.find(postId);

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
        replies: {
          author: true,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        avatar: comment.author.avatar,
      },
      replies: (comment.replies ?? []).map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: {
          id: reply.author.id,
          username: reply.author.username,
          avatar: reply.author.avatar,
        },
        replies: [],
      })),
    }));
  }
}

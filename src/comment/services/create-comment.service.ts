import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { PostService } from 'src/post/providers/post.service';

@Injectable()
export class CreateCommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    private readonly postService: PostService,
  ) {}

  async execute(
    user: ICurrentUser,
    createCommentDto: CreateCommentDto,
  ): Promise<void> {
    // Find post
    const post = await this.postService.find(createCommentDto.postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let parentComment: Comment | null = null;

    // If replying, check parent comment
    if (createCommentDto.parentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentId },
        relations: ['post'],
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Ensure parent comment belongs to same post
      if (parentComment.post.id !== post.id) {
        throw new BadRequestException(
          'Parent comment does not belong to this post',
        );
      }
    }

    // Create comment
    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      author: user,
      post,
      parent: parentComment ?? undefined,
    });

    await this.commentRepository.save(comment);
  }
}

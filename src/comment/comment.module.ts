import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './services/comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { PostModule } from 'src/post/post.module';
import { CreateCommentService } from './services/create-comment.service';
import { GetPostCommentsService } from './services/get-post-comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), PostModule],
  controllers: [CommentController],
  providers: [CommentService, CreateCommentService, GetPostCommentsService],
})
export class CommentModule {}

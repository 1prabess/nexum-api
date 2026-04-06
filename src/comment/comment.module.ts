import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentVote } from './entities/comment-vote.entity';
import { PostModule } from 'src/post/post.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentVote]),
    PostModule,
    NotificationModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}

import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserController } from './user.controller';
import { FollowModule } from 'src/follow/follow.module';
import { Community } from 'src/community/entities/community.entity';
import { CommunityMember } from 'src/community/entities/community-member.entity';
import { PostVote } from 'src/post/entities/post-vote.entity';
import { QuestionVote } from 'src/question/entities/question-vote.entity';
import { CommentVote } from 'src/comment/entities/comment-vote.entity';
import { AnswerVote } from 'src/answer/entities/answer-vote.entity';
import { Answer } from 'src/answer/entities/answer.entity';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Community,
      CommunityMember,
      PostVote,
      QuestionVote,
      CommentVote,
      AnswerVote,
      Answer,
      Post,
      Question,
      Comment,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => FollowModule),
  ],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}

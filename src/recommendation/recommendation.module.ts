import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from 'src/tag/tag.entity';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { Community } from 'src/community/entities/community.entity';
import { CommunityMember } from 'src/community/entities/community-member.entity';
import { PostVote } from 'src/post/entities/post-vote.entity';
import { QuestionVote } from 'src/question/entities/question-vote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag,
      Post,
      Question,
      Community,
      CommunityMember,
      PostVote,
      QuestionVote,
    ]),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}

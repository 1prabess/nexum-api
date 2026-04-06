import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { Question } from './entities/question.entity';
import { QuestionVote } from './entities/question-vote.entity';
import { TagModule } from 'src/tag/tag.module';
import { CommunityModule } from 'src/community/community.module';
import { SearchModule } from 'src/search/search.module';
import { AnswerModule } from 'src/answer/answer.module';
import { NotificationModule } from 'src/notification/notification.module';
import { FollowModule } from 'src/follow/follow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionVote]),
    TagModule,
    forwardRef(() => CommunityModule),
    SearchModule,
    forwardRef(() => AnswerModule),
    NotificationModule,
    FollowModule,
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}

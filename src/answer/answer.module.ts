import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { Answer } from './entities/answer.entity';
import { AnswerVote } from './entities/answer-vote.entity';
import { QuestionModule } from 'src/question/question.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Answer, AnswerVote]),
    forwardRef(() => QuestionModule),
    NotificationModule,
  ],
  controllers: [AnswerController],
  providers: [AnswerService],
  exports: [AnswerService],
})
export class AnswerModule {}

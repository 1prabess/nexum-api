import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { QuestionVote } from './entities/question-vote.entity';
import { TagModule } from 'src/tag/tag.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionVote]), TagModule],
  controllers: [QuestionController],
  providers: [QuestionService],
})
export class QuestionModule {}

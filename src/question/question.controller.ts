import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { Question } from './entities/question.entity';

@Controller('question')
@UseGuards(JwtAccessTokenAuthGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}
  /**
   * POST /questions
   * Creates a new standalone question (not tied to any community)
   */
  @ApiOperation({ summary: 'Create a new question' })
  @Post('/questions')
  @ResponseMessage('Question created successfully')
  create(
    @CurrentUser() user: ICurrentUser,
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    return this.questionService.create(user, createQuestionDto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { AnswerService } from './answer.service';
import { CreateAnswerDto } from './dtos/create-answer.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { AnswerResponseDto } from './dtos/answer-response.dto';
import { VoteType } from 'src/common/enums/vote-type.enum';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { VoteResultDto } from 'src/common/dtos/vote-result.dto';

@Controller('answers')
@UseGuards(JwtAccessTokenAuthGuard)
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  // ------------------ CREATE ANSWER ------------------
  @ApiOperation({ summary: 'Create an answer for a question' })
  @ApiSuccessResponse(null, {
    message: 'Answer created successfully',
    noData: true,
  })
  @Post()
  @ResponseMessage('Answer created successfully')
  create(@Body() dto: CreateAnswerDto, @CurrentUser() user: ICurrentUser) {
    return this.answerService.create(user, dto);
  }

  // ------------------ GET ANSWERS BY QUESTION ------------------
  @ApiOperation({ summary: 'Get all answers for a question' })
  @ApiSuccessResponse(AnswerResponseDto, {
    isArray: true,
    message: 'Answers fetched successfully',
  })
  @Get('question/:id')
  @ResponseMessage('Answers fetched successfully')
  findByQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<AnswerResponseDto[]> {
    return this.answerService.findByQuestion(questionId, user.id);
  }

  // ------------------ VOTE ON ANSWER ------------------
  @ApiOperation({ summary: 'Vote on an answer' })
  @ApiSuccessResponse(VoteResultDto, {
    message: 'Vote recorded successfully',
  })
  @Patch(':id/vote/:type')
  @ResponseMessage('Vote recorded successfully')
  vote(
    @Param('id', ParseIntPipe) answerId: number,
    @Param('type') type: VoteType,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.answerService.vote(user.id, answerId, type);
  }

  // ------------------ ACCEPT ANSWER ------------------
  @ApiOperation({ summary: 'Accept an answer for your question' })
  @ApiSuccessResponse(null, { message: 'Answer accepted', noData: true })
  @Patch(':id/accept')
  @ResponseMessage('Answer accepted')
  accept(
    @Param('id', ParseIntPipe) answerId: number,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.answerService.acceptAnswer(user.id, answerId);
  }

  // ------------------ DELETE ANSWER ------------------
  @ApiOperation({ summary: 'Delete your own answer' })
  @ApiSuccessResponse(null, {
    message: 'Answer deleted successfully',
    noData: true,
  })
  @Delete(':id')
  @ResponseMessage('Answer deleted successfully')
  remove(
    @Param('id', ParseIntPipe) answerId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.answerService.remove(user.id, answerId);
  }
}

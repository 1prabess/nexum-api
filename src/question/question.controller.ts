import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { VotePostDto } from 'src/post/dtos/vote-post.dto';
import { QuestionResponseDto } from 'src/common/dtos/question-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { VoteType } from 'src/common/enums/vote-type.enum';
import { AuthorSummaryDto } from 'src/common/dtos/author-summary.dto';
import { VoteResultDto } from 'src/common/dtos/vote-result.dto';

@Controller('')
@UseGuards(JwtAccessTokenAuthGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // ------------------ CREATE STANDALONE QUESTION ------------------
  @ApiOperation({ summary: 'Create a new question' })
  @ApiSuccessResponse(null, {
    message: 'Question created successfully',
    noData: true,
  })
  @Post('questions')
  @ResponseMessage('Question created successfully')
  createQuestion(
    @CurrentUser() user: ICurrentUser,
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<void> {
    return this.questionService.createQuestion(user, createQuestionDto);
  }

  // ------------------ CREATE COMMUNITY QUESTION ------------------
  @ApiOperation({ summary: 'Create a new question inside a community' })
  @ApiParam({
    name: 'communityId',
    type: Number,
    description: 'ID of the community where the question will be posted',
    example: 3,
  })
  @ApiSuccessResponse(null, {
    message: 'Question created successfully',
    noData: true,
  })
  @Post('questions/community/:communityId')
  @ResponseMessage('Question created successfully')
  createCommunityQuestion(
    @CurrentUser() user: ICurrentUser,
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<void> {
    return this.questionService.createCommunityQuestion(
      user,
      communityId,
      createQuestionDto,
    );
  }

  // ------------------ GET GLOBAL QUESTIONS FEED ------------------
  @ApiOperation({ summary: 'Get global questions feed' })
  @ApiSuccessResponse(PaginatedResponseDto<QuestionResponseDto>, {
    message: 'Questions fetched successfully',
    paginatedItemsType: QuestionResponseDto,
  })
  @Get('questions/feed')
  @ResponseMessage('Questions fetched successfully')
  async getGlobalQuestionsFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10)) limit: number,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.questionService.getGlobalQuestionsFeed({
      page,
      limit,
      currentUserId: user.id,
    });
  }

  @ApiOperation({ summary: 'Get questions from followed users' })
  @ApiSuccessResponse(PaginatedResponseDto<QuestionResponseDto>, {
    message: 'Following questions fetched successfully',
    paginatedItemsType: QuestionResponseDto,
  })
  @Get('questions/following')
  @ResponseMessage('Following questions fetched successfully')
  async getFollowingQuestionsFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10)) limit: number,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.questionService.getFollowingQuestionsFeed({
      page,
      limit,
      currentUserId: user.id,
    });
  }

  // ------------------ VOTE ON QUESTION ------------------
  @ApiOperation({ summary: 'Vote on a question (upvote/downvote)' })
  @ApiParam({
    name: 'questionId',
    type: Number,
    description: 'ID of the question to vote on',
    example: 42,
  })
  @ApiSuccessResponse(VoteResultDto, {
    message: 'Vote registered successfully',
  })
  @Post('questions/:questionId/vote')
  @ResponseMessage('Vote registered successfully')
  async voteOnQuestion(
    @CurrentUser() user: ICurrentUser,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() voteDto: VotePostDto,
  ) {
    return this.questionService.voteOnQuestion(
      user.id,
      questionId,
      voteDto.type,
    );
  }

  @ApiOperation({ summary: 'Get voters of a question by vote type' })
  @ApiSuccessResponse(AuthorSummaryDto, {
    isArray: true,
    message: 'Question voters fetched successfully',
  })
  @Get('questions/:questionId/voters')
  @ResponseMessage('Question voters fetched successfully')
  getQuestionVoters(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Query('type') type: VoteType,
  ): Promise<AuthorSummaryDto[]> {
    return this.questionService.getQuestionVoters(questionId, type);
  }

  @ApiOperation({ summary: 'Find questions of a specific user' })
  @ApiSuccessResponse(PaginatedResponseDto<QuestionResponseDto>, {
    message: 'Questions of user fetched successfully',
    paginatedItemsType: QuestionResponseDto,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (starts from 1)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
  })
  @Get('/users/:userId/questions')
  @ResponseMessage('Questions of user fetched successfully')
  async getQuestionsByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query(
      'page',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(1),
    )
    page: number,
    @Query(
      'limit',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(10),
    )
    limit: number,
    @CurrentUser('id') currentUserId: number,
  ): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    return this.questionService.getQuestionsByUser({
      userId,
      page,
      limit,
      currentUserId,
    });
  }

  // ------------------ GET SINGLE QUESTION ------------------
  @ApiOperation({ summary: 'Get a specific question by ID' })
  @ApiSuccessResponse(QuestionResponseDto, {
    message: 'Question fetched successfully',
  })
  @ApiParam({
    name: 'questionId',
    type: Number,
    description: 'ID of the question',
    example: 42,
  })
  @ResponseMessage('Question fetched successfully')
  @Get('questions/:questionId')
  async getQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<QuestionResponseDto> {
    return this.questionService.getQuestion(questionId, user?.id);
  }

  // ------------------ UPDATE QUESTION ------------------
  @ApiOperation({ summary: 'Update a question' })
  @ApiSuccessResponse(QuestionResponseDto, {
    message: 'Question updated successfully',
  })
  @Patch('questions/:questionId')
  @ResponseMessage('Question updated successfully')
  updateQuestion(
    @CurrentUser() user: ICurrentUser,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionService.updateQuestion(
      user,
      questionId,
      updateQuestionDto,
    );
  }

  // ------------------ DELETE QUESTION ------------------
  @ApiOperation({ summary: 'Delete a question' })
  @ApiSuccessResponse(null, {
    message: 'Question deleted successfully',
    noData: true,
  })
  @Delete('questions/:questionId')
  @ResponseMessage('Question deleted successfully')
  deleteQuestion(
    @CurrentUser() user: ICurrentUser,
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<void> {
    return this.questionService.deleteQuestion(user, questionId);
  }
}

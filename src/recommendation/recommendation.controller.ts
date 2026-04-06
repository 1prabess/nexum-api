import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { PostResponseDto } from 'src/common/dtos/post-response.dto';
import { QuestionResponseDto } from 'src/common/dtos/question-response.dto';
import { CommunityResponseDto } from 'src/community/dtos/community-response.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('recommendation')
@UseGuards(JwtAccessTokenAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  // ------------------ GET RECOMMENDED POSTS ------------------
  @ApiOperation({ summary: 'Get recommended posts for current user' })
  @Get('/posts')
  @ApiSuccessResponse(PostResponseDto, {
    isArray: true,
    message: 'Recommended posts fetched successfully',
  })
  @ResponseMessage('Recommended posts fetched successfully')
  async getRecommendedPosts(
    @CurrentUser() user: ICurrentUser,
  ): Promise<PostResponseDto[]> {
    return this.recommendationService.getRecommendedPosts(user.id, 5);
  }

  // ------------------ GET RECOMMENDED QUESTIONS ------------------
  @ApiOperation({ summary: 'Get recommended questions for current user' })
  @Get('/questions')
  @ApiSuccessResponse(QuestionResponseDto, {
    isArray: true,
    message: 'Recommended questions fetched successfully',
  })
  @ResponseMessage('Recommended questions fetched successfully')
  async getRecommendedQuestions(
    @CurrentUser() user: ICurrentUser,
  ): Promise<QuestionResponseDto[]> {
    return this.recommendationService.getRecommendedQuestions(user.id, 5);
  }

  // ------------------ GET RECOMMENDED COMMUNITIES ------------------
  @ApiOperation({ summary: 'Get recommended communities for current user' })
  @Get('/communities')
  @ApiSuccessResponse(CommunityResponseDto, {
    isArray: true,
    message: 'Recommended communities fetched successfully',
  })
  @ResponseMessage('Recommended communities fetched successfully')
  async getRecommendedCommunities(
    @CurrentUser() user: ICurrentUser,
  ): Promise<CommunityResponseDto[]> {
    return this.recommendationService.getRecommendedCommunities(user.id, 6);
  }
}

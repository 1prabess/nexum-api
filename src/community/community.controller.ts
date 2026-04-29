import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateCommunityDto } from './dtos/create-community.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { UpdateCommunityDto } from './dtos/update-community.dto';
import { CommunityService } from './community.service';
import { CommunityResponseDto } from './dtos/community-response.dto';
import { CommunityInviteResponseDto } from './dtos/community-invite.response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';

import { QuestionResponseDto } from 'src/common/dtos/question-response.dto';
import { PostResponseDto } from 'src/common/dtos/post-response.dto';
import { CommunityMemberResponseDto } from './dtos/community-member.response.dto';

@Controller('communities')
@UseGuards(JwtAccessTokenAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ------------------ CREATE COMMUNITY ------------------
  @ApiOperation({ summary: 'Create a new community' })
  @ApiSuccessResponse(CommunityResponseDto, {
    message: 'Community created successfully',
  })
  @Post()
  @ResponseMessage('Community created successfully')
  create(
    @Body() createCommunityDto: CreateCommunityDto,
    @CurrentUser() user: ICurrentUser,
  ): Promise<CommunityResponseDto> {
    return this.communityService.create(user, createCommunityDto);
  }

  // ------------------ UPDATE COMMUNITY ------------------
  @ApiOperation({ summary: 'Update a community (owner only)' })
  @ApiSuccessResponse(CommunityResponseDto, {
    message: 'Community updated successfully',
  })
  @Patch(':communityId')
  @ResponseMessage('Community updated successfully')
  update(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @CurrentUser() user: ICurrentUser,
  ): Promise<CommunityResponseDto> {
    return this.communityService.update(user, communityId, updateCommunityDto);
  }

  // ------------------ DELETE COMMUNITY ------------------
  @ApiOperation({ summary: 'Delete a community (owner only)' })
  @ApiSuccessResponse(null, {
    message: 'Community deleted successfully',
    noData: true,
  })
  @Delete(':communityId')
  @ResponseMessage('Community deleted successfully')
  remove(
    @Param('communityId', ParseIntPipe) communityId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.remove(user, communityId);
  }

  // ------------------ JOIN COMMUNITY ------------------
  @ApiOperation({ summary: 'Join a public community' })
  @ApiSuccessResponse(null, {
    message: 'Joined community successfully',
    noData: true,
  })
  @Post(':communityId/join')
  @ResponseMessage('Joined community successfully')
  join(
    @Param('communityId', ParseIntPipe) communityId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.joinCommunity(communityId, user);
  }

  // ------------------ LEAVE COMMUNITY ------------------
  @ApiOperation({ summary: 'Leave a community' })
  @ApiSuccessResponse(null, {
    message: 'Left community successfully',
    noData: true,
  })
  @Post(':communityId/leave')
  @ResponseMessage('Left community successfully')
  leave(
    @Param('communityId', ParseIntPipe) communityId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.leaveCommunity(communityId, user);
  }

  // ------------------ INVITE TO COMMUNITY ------------------
  @ApiOperation({
    summary: 'Invite a user to a private community (owner only)',
  })
  @ApiSuccessResponse(null, {
    message: 'Invite sent successfully',
    noData: true,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Community ID',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID to invite',
  })
  @Post(':id/invite/:userId')
  @ResponseMessage('Invite sent successfully')
  invite(
    @Param('id', ParseIntPipe) communityId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.invite(user, communityId, userId);
  }

  // ------------------ ACCEPT COMMUNITY INVITATION ------------------
  @ApiOperation({ summary: 'Accept an invitation to a private community' })
  @ApiSuccessResponse(null, {
    message: 'Community invitation accepted successfully',
    noData: true,
  })
  @ApiParam({
    name: 'inviteId',
    type: Number,
    description: 'ID of the community invitation',
  })
  @Post('invites/:inviteId/accept')
  @ResponseMessage('Community invitation accepted successfully')
  accept(
    @Param('inviteId', ParseIntPipe) inviteId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.accept(user, inviteId);
  }

  @ApiOperation({ summary: 'Decline an invitation to a private community' })
  @ApiSuccessResponse(null, {
    message: 'Community invitation declined successfully',
    noData: true,
  })
  @ApiParam({
    name: 'inviteId',
    type: Number,
    description: 'ID of the community invitation',
  })
  @Post('invites/:inviteId/decline')
  @ResponseMessage('Community invitation declined successfully')
  decline(
    @Param('inviteId', ParseIntPipe) inviteId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.decline(user, inviteId);
  }

  // ------------------ GET INVITATIONS ------------------
  @ApiOperation({ summary: 'Get my pending community invitations' })
  @ApiSuccessResponse(CommunityInviteResponseDto, {
    isArray: true,
    message: 'Community invitations fetched successfully',
  })
  @Get('invites')
  @ResponseMessage('Community invitations fetched successfully')
  getMyInvites(
    @CurrentUser() user: ICurrentUser,
  ): Promise<CommunityInviteResponseDto[]> {
    return this.communityService.getInvites(user);
  }

  // ------------------ GET COMMUNITY QUESTIONS ------------------
  @ApiOperation({ summary: 'Get questions of a specific community' })
  @ApiParam({ name: 'communityId', type: Number, description: 'Community ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiSuccessResponse(PaginatedResponseDto<QuestionResponseDto>, {
    message: 'Community questions fetched successfully',
    paginatedItemsType: QuestionResponseDto,
  })
  @Get(':communityId/questions')
  @ResponseMessage('Community questions fetched successfully')
  async getCommunityFeedQuestions(
    @Param('communityId', ParseIntPipe) communityId: number,
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
    @CurrentUser() user: ICurrentUser,
  ): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    return this.communityService.getCommunityFeedQuestions({
      communityId,
      page: Number(page),
      limit: Number(limit),
      currentUserId: user.id,
    });
  }

  // ------------------ GET COMMUNITY POSTS ------------------
  @ApiOperation({ summary: 'Get posts of a specific community' })
  @ApiParam({ name: 'communityId', type: Number, description: 'Community ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiSuccessResponse(PaginatedResponseDto<PostResponseDto>, {
    message: 'Community posts fetched successfully',
    paginatedItemsType: PostResponseDto,
  })
  @Get(':communityId/posts')
  @ResponseMessage('Community posts fetched successfully')
  async getCommunityFeedPosts(
    @Param('communityId', ParseIntPipe) communityId: number,
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
    @CurrentUser() user: ICurrentUser,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    return this.communityService.getCommunityFeedPosts({
      communityId,
      page: Number(page),
      limit: Number(limit),
      currentUserId: user.id,
    });
  }

  // ------------------ GET COMMUNITY ------------------
  @ApiOperation({ summary: 'Get community members (owner only)' })
  @ApiSuccessResponse(CommunityMemberResponseDto, {
    isArray: true,
    message: 'Community members fetched successfully',
  })
  @Get(':communityId/members')
  @ResponseMessage('Community members fetched successfully')
  getMembers(
    @Param('communityId', ParseIntPipe) communityId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<CommunityMemberResponseDto[]> {
    return this.communityService.getMembers(user, communityId);
  }

  @ApiOperation({ summary: 'Remove a community member (owner only)' })
  @ApiSuccessResponse(null, {
    message: 'Member removed successfully',
    noData: true,
  })
  @Delete(':communityId/members/:memberUserId')
  @ResponseMessage('Member removed successfully')
  removeMember(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Param('memberUserId', ParseIntPipe) memberUserId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.removeMember(user, communityId, memberUserId);
  }

  // ------------------ GET COMMUNITY ------------------
  @ApiOperation({ summary: 'Get community details by ID' })
  @ApiSuccessResponse(CommunityResponseDto, {
    message: 'Community fetched successfully',
  })
  @Get(':id')
  @ResponseMessage('Community fetched successfully')
  async getCommunity(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<CommunityResponseDto> {
    return this.communityService.getCommunity(id, user.id);
  }
}

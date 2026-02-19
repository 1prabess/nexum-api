import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateCommunityDto } from './dtos/create-community.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { UpdateCommunityDto } from './dtos/update-community.dto';
import { CommunityService } from './services/community.service';
import { CommunityInvite } from './entities/community-invite.entity';
import { CommunityResponseDto } from './dtos/community-response.dto';
import { CommunityInviteResponseDto } from './dtos/community-invite.response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';

@Controller('communities')
@UseGuards(JwtAccessTokenAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Create community
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

  // Update community
  @ApiOperation({ summary: 'Update a community (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Community updated',
    type: CommunityResponseDto,
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

  // Join community
  @ApiOperation({ summary: 'Join a public community' })
  @Post(':communityId/join')
  @ResponseMessage('Joined community successfully')
  join(
    @Param('communityId', ParseIntPipe) communityId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.joinCommunity(communityId, user);
  }

  // Invite to private community
  @ApiOperation({
    summary: 'Invite a user to a private community (owner only)',
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
    @Param('id') communityId: number,
    @Param('userId') userId: number,
    @CurrentUser() user: ICurrentUser,
  ): Promise<void> {
    return this.communityService.invite(user, communityId, userId);
  }

  // Accept invitation to private community
  @ApiOperation({ summary: 'Accept an invitation to a private community' })
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

  // Get  community invites
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
    return this.communityService.getInvites(user.id);
  }
}

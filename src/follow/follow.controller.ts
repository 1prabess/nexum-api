import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { UserResponseDto } from 'src/user/dtos/user-response.dto';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';

@ApiTags('Follow')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAccessTokenAuthGuard)
export class FollowController {
  constructor(private followService: FollowService) {}

  // ------------------ FOLLOW USER ------------------
  @Post('/:id/follow')
  @ApiSuccessResponse(null, { message: 'Followed successfully', noData: true })
  @ResponseMessage('Followed successfully')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to follow',
    type: Number,
  })
  async follow(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) targetId: number,
  ): Promise<void> {
    await this.followService.follow(user.id, targetId);
  }

  // ------------------ UNFOLLOW USER ------------------
  @Delete('/:id/follow')
  @ApiSuccessResponse(null, {
    message: 'Unfollowed successfully',
    noData: true,
  })
  @ResponseMessage('Unfollowed successfully')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to unfollow',
    type: Number,
  })
  async unfollow(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) targetId: number,
  ): Promise<void> {
    await this.followService.unfollow(user.id, targetId);
  }

  // ------------------ GET FOLLOWERS ------------------
  @Get('/:id/followers')
  @ApiSuccessResponse(PaginatedResponseDto<UserResponseDto>, {
    message: 'Followers fetched successfully',
    paginatedItemsType: UserResponseDto,
  })
  @ResponseMessage('Followers fetched successfully')
  @ApiOperation({ summary: 'Get a list of followers for a user' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user whose followers are fetched',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    type: Number,
  })
  async getFollowers(
    @Param('id', ParseIntPipe) userId: number,
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
  ) {
    return this.followService.getFollowers({ userId, page, limit });
  }

  // ------------------ GET FOLLOWINGS ------------------
  @Get('/:id/followings')
  @ApiSuccessResponse(PaginatedResponseDto<UserResponseDto>, {
    message: 'Followings fetched successfully',
    paginatedItemsType: UserResponseDto,
  })
  @ResponseMessage('Followings fetched successfully')
  @ApiOperation({ summary: 'Get a list of followings for a user' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user whose followings are fetched',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    type: Number,
  })
  async getFollowings(
    @Param('id', ParseIntPipe) userId: number,
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
  ) {
    return this.followService.getFollowings({ userId, page, limit });
  }
}

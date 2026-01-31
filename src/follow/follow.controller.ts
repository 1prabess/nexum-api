import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './providers/follow.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Follow')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAccessTokenAuthGuard)
export class FollowController {
  constructor(private followService: FollowService) {}

  // Follow a user
  @Post('/:id/follow')
  @ResponseMessage('Followed successfully')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to follow',
    type: Number,
  })
  async follow(
    @CurrentUser() user: User,
    @Param('id') targetId: number,
  ): Promise<void> {
    await this.followService.follow(user.id, targetId);
  }

  // Unfollow a user
  @Delete('/:id/follow')
  @ResponseMessage('Unfollowed successfully')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to unfollow',
    type: Number,
  })
  async unfollow(
    @CurrentUser() user: User,
    @Param('id') targetId: number,
  ): Promise<void> {
    await this.followService.unfollow(user.id, targetId);
  }

  // Get followers of a user
  @Get('/:id/followers')
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
    @Param('id') userId: number,
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

  // Get followings of a user
  @Get('/:id/followings')
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
    @Param('id') userId: number,
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

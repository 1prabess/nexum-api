import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './user.entity';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { UserProfileResponseDto } from './dtos/user-profile.response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { UserResponseDto } from './dtos/user-response.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAccessTokenAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ------------------ GET CURRENT USER PROFILE ------------------
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiSuccessResponse(UserProfileResponseDto, {
    message: 'Profile fetched successfully',
  })
  @ApiBearerAuth()
  @Get('me')
  @ResponseMessage('Profile fetched successfully')
  getProfile(
    @CurrentUser() user: ICurrentUser,
  ): Promise<UserProfileResponseDto> {
    return this.userService.getProfile(user.id, user.id);
  }

  // ------------------ SEARCH USERS ------------------
  @ApiOperation({ summary: 'Search users by username or full name' })
  @ApiSuccessResponse(UserResponseDto, {
    isArray: true,
    message: 'Users fetched successfully',
  })
  @Get('search')
  @ResponseMessage('Users fetched successfully')
  searchUsers(
    @Query('q') query: string,
    @Query('excludeCurrentUser') excludeCurrentUser: string | undefined,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<UserResponseDto[]> {
    return this.userService.searchUsers(query, currentUser.id, {
      excludeCurrentUser: excludeCurrentUser === 'true',
    });
  }

  // ------------------ GET SPECIFIC USER PROFILE ------------------
  @ApiOperation({ summary: 'Get profile of a specific user' })
  @ApiSuccessResponse(UserProfileResponseDto, {
    message: 'Profile fetched successfully',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the user whose profile is fetched',
    type: Number,
  })
  @ApiBearerAuth()
  @Get('/:id')
  @ResponseMessage('Profile fetched successfully')
  getUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<UserProfileResponseDto> {
    return this.userService.getProfile(id, currentUser.id);
  }

  // ------------------ UPDATE CURRENT USER PROFILE ------------------
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiSuccessResponse(UserProfileResponseDto, {
    message: 'Profile updated successfully',
  })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProfileDto })
  @Patch('me')
  @ResponseMessage('Profile updated successfully')
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.userService.updateProfile(user.id, dto);
  }
}

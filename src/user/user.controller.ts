import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './providers/user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './user.entity';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserDto } from './dtos/user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body.username, body.email, body.password);
  }

  @Get()
  @ResponseMessage('Users fetched successfully')
  @UseGuards(JwtAccessTokenAuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  // Get current user profile
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAccessTokenAuthGuard)
  @ResponseMessage('Profile fetched successfully')
  getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user.id);
  }

  // Update current user profile
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserDto,
  })
  @Patch('me')
  @UseGuards(JwtAccessTokenAuthGuard)
  @ResponseMessage('Profile updated successfully')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.id, dto);
  }
}

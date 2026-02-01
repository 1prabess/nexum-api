import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './providers/user.service';
import { CreateUserDto } from './dtos/create-user.dto';
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

  // =====================================================
  // Get profile of a specific user
  // =====================================================
  @ApiOperation({ summary: 'Get profile of a specific user' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user whose profile is fetched',
    type: Number,
  })
  @ApiBearerAuth()
  @Get('/:id')
  @UseGuards(JwtAccessTokenAuthGuard)
  @ResponseMessage('Profile fetched successfully')
  getUserProfile(@Param('id') id: number) {
    return this.userService.getProfile(id);
  }

  // =====================================================
  // Get profile of current (authenticated) user
  // =====================================================
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAccessTokenAuthGuard)
  @ResponseMessage('Profile fetched successfully')
  getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user.id);
  }

  // =====================================================
  // Update profile of current (authenticated) user
  // =====================================================
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProfileDto })
  @Patch('me')
  @UseGuards(JwtAccessTokenAuthGuard)
  @ResponseMessage('Profile updated successfully')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.id, dto);
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './providers/user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly UserService: UserService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.UserService.create(
      body.username,
      body.email,
      body.password,
      body.avatar,
    );
  }

  @Get()
  @UseGuards(JwtAccessTokenAuthGuard)
  findAll() {
    return this.UserService.findAll();
  }
}

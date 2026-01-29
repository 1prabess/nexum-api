import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiOperation, ApiBody } from '@nestjs/swagger';
import { LoginUserDto } from './dtos/login-user.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';

@Controller('auth')
export class AuthController {
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginUserDto })
  @Post('/login')
  @UseGuards(LocalAuthGuard)
  async login(@CurrentUser() user: User) {
    console.log(user);
  }
}

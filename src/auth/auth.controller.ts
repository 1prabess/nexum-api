import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiOperation, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { LoginUserDto } from './dtos/login-user.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { AuthService } from './providers/auth.service';
import { setAuthCookies } from './utils/cookies.utils';
import type { Response } from 'express';
import { JwtRefreshTokenAuthGuard } from './guards/jwt-refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginUserDto })
  @Post('/login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(user);

    setAuthCookies(response, accessToken, refreshToken);

    return { message: 'Login successful' };
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiCookieAuth('refreshToken')
  @Get('/refresh')
  @UseGuards(JwtRefreshTokenAuthGuard)
  async refreshToken(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(user);

    setAuthCookies(response, accessToken, refreshToken);

    return { message: 'Tokens refreshed' };
  }
}

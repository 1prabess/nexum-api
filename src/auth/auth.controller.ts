import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiOperation, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { LoginUserDto } from './dtos/login-user.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { AuthService } from './auth.service';
import { clearAuthCookies, setAuthCookies } from './utils/cookies.utils';
import type { Response } from 'express';
import { JwtRefreshTokenAuthGuard } from './guards/jwt-refresh-auth.guard';
import { RegisterUserDto } from './dtos/register-user.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { JwtAccessTokenAuthGuard } from './guards/jwt-access-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ------------------ LOGIN ------------------
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiSuccessResponse(null, {
    message: 'Login successful',
  })
  @ApiBody({ type: LoginUserDto })
  @Post('/login')
  @ResponseMessage('Login successful')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.login(user);

    setAuthCookies(response, accessToken, refreshToken);
  }

  // ------------------ REGISTER ------------------
  @ApiOperation({ summary: 'Register a new user' })
  @ApiSuccessResponse(null, {
    message: 'User registration successful',
  })
  @ApiBody({ type: RegisterUserDto })
  @Post('/register')
  @ResponseMessage('User registration successful')
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } =
      await this.authService.register(registerUserDto);

    setAuthCookies(response, accessToken, refreshToken);
  }

  // ------------------ REFRESH TOKEN ------------------
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiSuccessResponse(null, {
    message: 'Tokens refresh successful',
  })
  @ApiCookieAuth('refreshToken')
  @Get('/refresh')
  @ResponseMessage('Tokens refresh successful')
  @UseGuards(JwtRefreshTokenAuthGuard)
  async refreshToken(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.login(user);

    setAuthCookies(response, accessToken, refreshToken);
  }

  // ------------------ LOGOUT ------------------
  @ApiOperation({ summary: 'Logout user and clear auth cookies' })
  @ApiSuccessResponse(null, {
    message: 'Logout successful',
  })
  @Post('/logout')
  @ResponseMessage('Logout successful')
  @UseGuards(JwtAccessTokenAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.id);
    clearAuthCookies(response);
  }
}

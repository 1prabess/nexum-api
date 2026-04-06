import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { HashingProvider } from './providers/hashing.provider';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from 'src/configs/jwt.config';
import { TokenPayload } from './interfaces/token-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dtos/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly hashingProvider: HashingProvider,
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  // ------------------ LOGIN ------------------
  async login(user: User) {
    const accessTokenCookieExpiry = new Date();
    accessTokenCookieExpiry.setTime(
      accessTokenCookieExpiry.getTime() +
        Number(this.jwtConfiguration.accessTokenTtlMs),
    );

    const refreshTokenCookieExpiry = new Date();
    refreshTokenCookieExpiry.setTime(
      refreshTokenCookieExpiry.getTime() +
        Number(this.jwtConfiguration.refreshTokenTtlMs),
    );

    const payload: TokenPayload = {
      userId: user.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.accessTokenSecret,
      expiresIn: `${this.jwtConfiguration.accessTokenTtlMs}ms`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.refreshTokenSecret,
      expiresIn: `${this.jwtConfiguration.refreshTokenTtlMs}ms`,
    });

    await this.userService.setRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  // ------------------ REGISTER ------------------
  async register(registerUserDto: RegisterUserDto) {
    await this.userService.create(
      registerUserDto.username,
      registerUserDto.email,
      registerUserDto.password,
    );

    const user = await this.userService.findByEmail(registerUserDto.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.login(user);
  }

  // ------------------ VALIDATE USER CREDENTIALS ------------------
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingProvider.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // ------------------ VALIDATE REFRESH TOKEN ------------------
  async validateUserRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<User> {
    const user = await this.userService.findByIdWithRefreshToken(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException();
    }

    const isValid = await this.hashingProvider.compare(
      refreshToken,
      user?.refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException();
    }

    return user;
  }

  // ------------------ LOGOUT ------------------
  async logout(userId: number): Promise<void> {
    await this.userService.clearRefreshToken(userId);
  }
}

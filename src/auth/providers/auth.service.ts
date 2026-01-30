import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/providers/user.service';
import { User } from 'src/user/user.entity';
import { HashingProvider } from './hashing.provider';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from 'src/configs/jwt.config';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly UserService: UserService,
    private readonly hashingProvider: HashingProvider,
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

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

    await this.UserService.setRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.UserService.findByEmail(email);

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

  async validateUserRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<User> {
    const user = await this.UserService.findByIdWithRefreshToken(userId);

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
}

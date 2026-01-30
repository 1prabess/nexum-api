import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/configs/jwt.config';
import { AuthService } from '../providers/auth.service';
import type { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';

export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refreshToken',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.refreshToken,
      ]),
      secretOrKey: jwtConfiguration.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: TokenPayload) {
    return this.authService.validateUserRefreshToken(
      payload.userId,
      request.cookies?.refreshToken,
    );
  }
}

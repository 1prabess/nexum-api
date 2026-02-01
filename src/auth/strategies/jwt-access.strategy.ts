import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/configs/jwt.config';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { UserService } from 'src/user/providers/user.service';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-accessToken',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    jwtConfiguration: ConfigType<typeof jwtConfig>,

    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.accessToken,
      ]),
      secretOrKey: jwtConfiguration.accessTokenSecret,
    });
  }

  async validate(payload: TokenPayload): Promise<ICurrentUser> {
    const user = await this.userService.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { id, username, email, fullName, avatar } = user;

    return { id, username, email, fullName, avatar };
  }
}

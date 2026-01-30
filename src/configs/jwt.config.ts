import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET as string,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET as string,
  accessTokenTtlMs: Number(process.env.JWT_ACCESS_TOKEN_EXPIRATION_MS),
  refreshTokenTtlMs: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS),
}));

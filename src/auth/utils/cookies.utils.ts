import { CookieOptions } from 'express';
import type { Response } from 'express';

const defaultCookieOption: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const getAccessTokenCookieOption = () => ({
  ...defaultCookieOption,
  maxAge: Number(process.env.JWT_ACCESS_TOKEN_EXPIRATION_MS),
  path: '/',
});

const getRefreshTokenCookieOption = () => ({
  ...defaultCookieOption,
  maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS),
  path: '/auth/refresh',
});

export const setAuthCookies = (
  response: Response,
  accessToken: string,
  refreshToken: string,
) => {
  return response
    .cookie('accessToken', accessToken, getAccessTokenCookieOption())
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOption());
};

export const clearAuthCookies = (response: Response) => {
  return response
    .clearCookie('accessToken', { path: '/' })
    .clearCookie('refreshToken', { path: '/auth/refresh' });
};

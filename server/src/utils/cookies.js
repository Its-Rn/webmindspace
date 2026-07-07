import { appEnv } from '../config/env.js';
import { getAccessTokenTtlMs, getRefreshTokenTtlMs } from '../services/token.service.js';

const isProduction = appEnv.nodeEnv === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/'
};

export const cookieNames = {
  accessToken: 'ppp_access_token',
  refreshToken: 'ppp_refresh_token'
};

export const accessTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: getAccessTokenTtlMs()
};

export const refreshTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: getRefreshTokenTtlMs()
};

export const clearCookieOptions = {
  ...baseCookieOptions,
  maxAge: 0
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(cookieNames.accessToken, accessToken, accessTokenCookieOptions);
  res.cookie(cookieNames.refreshToken, refreshToken, refreshTokenCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie(cookieNames.accessToken, clearCookieOptions);
  res.clearCookie(cookieNames.refreshToken, clearCookieOptions);
};


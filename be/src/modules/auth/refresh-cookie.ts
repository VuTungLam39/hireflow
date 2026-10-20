import type { CookieOptions, Response } from 'express';

export const REFRESH_COOKIE = 'refresh_token';

export interface RefreshCookieConfig {
  /** Ví dụ "api" → cookie chỉ gửi kèm request tới /api/v1/auth */
  apiPrefix: string;
  isProduction: boolean;
  maxAgeSeconds: number;
}

// httpOnly: JS ở trình duyệt không đọc được (chống XSS lấy token).
// SameSite=Strict: trang khác không gửi kèm được cookie (chống CSRF cho /auth/refresh).
// path giới hạn ở /auth để cookie không đi kèm mọi request API.
const baseOptions = ({ apiPrefix, isProduction }: RefreshCookieConfig): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: `/${apiPrefix}/v1/auth`,
});

export function setRefreshCookie(res: Response, token: string, config: RefreshCookieConfig) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions(config),
    maxAge: config.maxAgeSeconds * 1000,
  });
}

export function clearRefreshCookie(res: Response, config: RefreshCookieConfig) {
  res.clearCookie(REFRESH_COOKIE, baseOptions(config));
}

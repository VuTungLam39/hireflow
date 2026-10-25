import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  accessExpiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 900),
  refreshExpiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 604800),
}));

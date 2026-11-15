import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerRequest } from '@nestjs/throttler';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';

// BR-AI-10, Kickoff 16
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as AuthUser | undefined;
    return user?.id ? `user:${user.id}` : `ip:${await super.getTracker(req)}`;
  }
}

export const LOGIN_PER_ACCOUNT = { limit: 5, ttl: 60_000 };
export const LOGIN_PER_IP = { limit: 30, ttl: 60_000 };

// Kickoff 16: đăng nhập 5 lần/phút theo tài khoản, 30 lần/phút theo IP
@Injectable()
export class LoginAccountThrottlerGuard extends ThrottlerGuard {
  protected override handleRequest(props: ThrottlerRequest): Promise<boolean> {
    return super.handleRequest({
      ...props,
      ...LOGIN_PER_ACCOUNT,
      blockDuration: LOGIN_PER_ACCOUNT.ttl,
    });
  }

  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `login:${email}` : `login-ip:${await super.getTracker(req)}`;
  }
}

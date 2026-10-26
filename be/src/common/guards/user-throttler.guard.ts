import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';

// BR-AI-10, Kickoff 16
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as AuthUser | undefined;
    return user?.id ? `user:${user.id}` : `ip:${await super.getTracker(req)}`;
  }
}

// Kickoff 16: đăng nhập 5 lần/phút theo tài khoản
@Injectable()
export class LoginAccountThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `login:${email}` : `login-ip:${await super.getTracker(req)}`;
  }
}

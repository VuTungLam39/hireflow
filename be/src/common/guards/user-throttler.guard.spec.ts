import { Reflector } from '@nestjs/core';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { Role } from '../enums/role.enum.js';
import { LoginAccountThrottlerGuard, UserThrottlerGuard } from './user-throttler.guard.js';

type Tracker = { getTracker(req: Record<string, unknown>): Promise<string> };

const make = <T>(Guard: new (...args: never[]) => T) =>
  new (Guard as unknown as new (...a: unknown[]) => T)(
    [{ ttl: 60_000, limit: 10 }],
    {} as ThrottlerStorage,
    new Reflector(),
  ) as unknown as Tracker;

describe('UserThrottlerGuard (BR-AI-10)', () => {
  const guard = make(UserThrottlerGuard);

  it('counts a signed-in request by user id, not by IP', async () => {
    const req = {
      ip: '10.0.0.1',
      ips: [],
      user: { id: 'u-1', email: 'a@b.com', role: Role.Hr, departmentId: null },
    };
    expect(await guard.getTracker(req)).toBe('user:u-1');
  });

  it('two users behind the same IP get separate counters', async () => {
    const a = await guard.getTracker({ ip: '10.0.0.1', ips: [], user: { id: 'a' } });
    const b = await guard.getTracker({ ip: '10.0.0.1', ips: [], user: { id: 'b' } });
    expect(a).not.toBe(b);
  });

  it('falls back to the IP when nobody is signed in', async () => {
    expect(await guard.getTracker({ ip: '10.0.0.1', ips: [] })).toBe('ip:10.0.0.1');
  });
});

describe('LoginAccountThrottlerGuard (Kickoff 16)', () => {
  const guard = make(LoginAccountThrottlerGuard);

  it('counts by email, ignoring case and spaces', async () => {
    const a = await guard.getTracker({
      ip: '1.1.1.1',
      ips: [],
      body: { email: ' HR@Example.com ' },
    });
    const b = await guard.getTracker({ ip: '2.2.2.2', ips: [], body: { email: 'hr@example.com' } });
    expect(a).toBe('login:hr@example.com');
    expect(b).toBe(a);
  });

  it('uses a key separate from the IP counter when the email is missing', async () => {
    expect(await guard.getTracker({ ip: '1.1.1.1', ips: [], body: {} })).toBe('login-ip:1.1.1.1');
  });
});

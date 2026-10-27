import { checkSeedTarget, isRemoteDatabase } from './seed-guard.js';

const neon = 'postgresql://u:p@ep-x.ap-southeast-1.aws.neon.tech/hireflow?sslmode=require';

// Deploy: bảo vệ DB từ xa khi seed
describe('checkSeedTarget', () => {
  it.each([
    [{ DB_HOST: 'localhost' }, false],
    [{ DB_HOST: 'postgres' }, false],
    [{ DATABASE_URL: 'postgresql://u:p@127.0.0.1:5433/x' }, false],
    [{ DATABASE_URL: neon }, true],
    [{ DB_HOST: 'db.example.com' }, true],
    [{ DATABASE_URL: 'not a url' }, true],
  ])('isRemoteDatabase(%o) = %s', (env, remote) => {
    expect(isRemoteDatabase(env)).toBe(remote);
  });

  it('keeps the default password and --reset for a local database', () => {
    expect(checkSeedTarget({ env: { DB_HOST: 'localhost' }, argv: ['--reset'] })).toEqual({
      reset: true,
      password: 'Admin@123',
    });
  });

  it.each([undefined, 'Admin@123', 'short1', 'onlyletterslong'])(
    'refuses a weak password (%s) for a remote database',
    (password) => {
      expect(() =>
        checkSeedTarget({ env: { DATABASE_URL: neon, SEED_ADMIN_PASSWORD: password }, argv: [] }),
      ).toThrow(/strong password/);
    },
  );

  it('needs an explicit flag to reset a remote database', () => {
    const env = { DATABASE_URL: neon, SEED_ADMIN_PASSWORD: 'Staging-2026-xyz' };
    expect(() => checkSeedTarget({ env, argv: ['--reset'] })).toThrow(/--allow-remote-reset/);
    expect(checkSeedTarget({ env, argv: ['--reset', '--allow-remote-reset'] })).toEqual({
      reset: true,
      password: 'Staging-2026-xyz',
    });
  });

  it('never resets when NODE_ENV=production', () => {
    expect(() =>
      checkSeedTarget({ env: { NODE_ENV: 'production', DB_HOST: 'localhost' }, argv: ['--reset'] }),
    ).toThrow(/not allowed/);
  });
});

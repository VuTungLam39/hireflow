import { validateEnv } from './env.validation.js';

const base = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('parses "false" strings as false', () => {
    const env = validateEnv({ ...base, DB_SYNCHRONIZE: 'false', DB_LOGGING: 'false' });
    expect(env.DB_SYNCHRONIZE).toBe(false);
    expect(env.DB_LOGGING).toBe(false);
  });

  it('parses "true" strings as true', () => {
    expect(validateEnv({ ...base, DB_LOGGING: 'true' }).DB_LOGGING).toBe(true);
  });

  it('applies defaults and converts numbers', () => {
    const env = validateEnv({ ...base, PORT: '4000' });
    expect(env.PORT).toBe(4000);
    expect(env.DB_SYNCHRONIZE).toBe(false);
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe(900);
  });

  it('rejects short JWT secrets', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('accepts DATABASE_URL without DB_* parts', () => {
    const env = validateEnv({
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      DATABASE_URL: 'postgresql://u:p@ep-x.neon.tech/db?sslmode=require',
      DB_SSL: 'true',
    });
    expect(env.DATABASE_URL).toContain('neon.tech');
    expect(env.DB_SSL).toBe(true);
  });

  it('requires DB_* parts when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: 'a'.repeat(32) })).toThrow(/DB_HOST/);
  });

  it('validates REDIS_URL scheme and parses REDIS_TLS', () => {
    expect(() => validateEnv({ ...base, REDIS_URL: 'http://x' })).toThrow(/REDIS_URL/);
    const env = validateEnv({ ...base, REDIS_URL: 'rediss://u:p@host:6380', REDIS_TLS: 'false' });
    expect(env.REDIS_URL).toBe('rediss://u:p@host:6380');
    expect(env.REDIS_TLS).toBe(false);
  });

  it('treats empty URL variables as not set (copied from .env.example)', () => {
    const env = validateEnv({
      ...base,
      DATABASE_URL: '',
      REDIS_URL: '',
      PRERENDER_DEPLOY_HOOK_URL: '',
    });
    expect(env.DB_HOST).toBe('localhost');
  });

  it('still rejects a malformed deploy hook URL', () => {
    expect(() => validateEnv({ ...base, PRERENDER_DEPLOY_HOOK_URL: 'http://x' })).toThrow(
      /PRERENDER_DEPLOY_HOOK_URL/,
    );
  });
});

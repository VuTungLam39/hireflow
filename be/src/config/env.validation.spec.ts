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
});

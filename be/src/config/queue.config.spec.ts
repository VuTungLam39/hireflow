import { buildRedisConnection } from './queue.config.js';

describe('buildRedisConnection', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('dùng REDIS_HOST/REDIS_PORT khi không có REDIS_URL', () => {
    vi.stubEnv('REDIS_URL', '');
    vi.stubEnv('REDIS_HOST', 'cache');
    vi.stubEnv('REDIS_PORT', '6380');
    vi.stubEnv('REDIS_USERNAME', '');
    vi.stubEnv('REDIS_PASSWORD', '');
    vi.stubEnv('REDIS_TLS', '');
    expect(buildRedisConnection()).toEqual({ host: 'cache', port: 6380 });
  });

  it('thêm mật khẩu và TLS từ biến riêng', () => {
    vi.stubEnv('REDIS_URL', '');
    vi.stubEnv('REDIS_HOST', 'cache');
    vi.stubEnv('REDIS_PORT', '6379');
    vi.stubEnv('REDIS_USERNAME', 'default');
    vi.stubEnv('REDIS_PASSWORD', 'secret');
    vi.stubEnv('REDIS_TLS', 'true');
    expect(buildRedisConnection()).toEqual({
      host: 'cache',
      port: 6379,
      username: 'default',
      password: 'secret',
      tls: {},
    });
  });

  it('đọc REDIS_URL dạng rediss:// có user, mật khẩu, db', () => {
    vi.stubEnv('REDIS_URL', 'rediss://red-user:p%40ss@oregon-keyvalue.render.com:6380/2');
    expect(buildRedisConnection()).toEqual({
      host: 'oregon-keyvalue.render.com',
      port: 6380,
      username: 'red-user',
      password: 'p@ss',
      db: 2,
      tls: {},
    });
  });

  it('đọc REDIS_URL nội bộ không mật khẩu', () => {
    vi.stubEnv('REDIS_URL', 'redis://red-abc123:6379');
    expect(buildRedisConnection()).toEqual({ host: 'red-abc123', port: 6379 });
  });
});

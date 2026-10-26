import { buildDataSourceOptions } from './database.config.js';

describe('buildDataSourceOptions', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('dùng từng biến DB_* khi không có DATABASE_URL', () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('DB_SSL', '');
    vi.stubEnv('DB_HOST', 'db');
    vi.stubEnv('DB_PORT', '5433');
    const options = buildDataSourceOptions() as unknown as Record<string, unknown>;
    expect(options).toMatchObject({ host: 'db', port: 5433 });
    expect(options).not.toHaveProperty('url');
    expect(options).not.toHaveProperty('ssl');
  });

  it('ưu tiên DATABASE_URL và bật SSL khi DB_SSL=true', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@ep-x.neon.tech/hireflow?sslmode=require');
    vi.stubEnv('DB_SSL', 'true');
    const options = buildDataSourceOptions() as unknown as Record<string, unknown>;
    expect(options).toMatchObject({
      url: 'postgresql://u:p@ep-x.neon.tech/hireflow?sslmode=require',
      ssl: true,
    });
    expect(options).not.toHaveProperty('host');
  });
});

export const DEFAULT_SEED_PASSWORD = 'Admin@123';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres', 'db']);

export interface SeedTarget {
  env: Record<string, string | undefined>;
  argv: string[];
}

export function isRemoteDatabase(env: SeedTarget['env']): boolean {
  if (env.DATABASE_URL) {
    try {
      return !LOCAL_HOSTS.has(new URL(env.DATABASE_URL).hostname);
    } catch {
      return true;
    }
  }
  return !LOCAL_HOSTS.has(env.DB_HOST ?? 'localhost');
}

export const isStrongPassword = (value: string) =>
  value.length >= 12 &&
  /[a-zA-Z]/.test(value) &&
  /\d/.test(value) &&
  value !== DEFAULT_SEED_PASSWORD;

// Deploy: seed lên DB từ xa không được dùng mật khẩu mặc định, không xoá dữ liệu nếu không xác nhận rõ
export function checkSeedTarget({ env, argv }: SeedTarget): { reset: boolean; password: string } {
  const reset = argv.includes('--reset');
  if (reset && env.NODE_ENV === 'production') {
    throw new Error('--reset is not allowed when NODE_ENV=production');
  }
  const password = env.SEED_ADMIN_PASSWORD ?? DEFAULT_SEED_PASSWORD;
  if (!isRemoteDatabase(env)) return { reset, password };

  if (!isStrongPassword(password)) {
    throw new Error(
      'Remote database: set SEED_ADMIN_PASSWORD to a strong password (≥ 12 characters, letters and digits, not the default)',
    );
  }
  if (reset && !argv.includes('--allow-remote-reset')) {
    throw new Error(
      'Remote database: --reset deletes business data; add --allow-remote-reset to confirm',
    );
  }
  return { reset, password };
}

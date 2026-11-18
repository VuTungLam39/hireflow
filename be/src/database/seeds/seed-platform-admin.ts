import dataSource from '../data-source.js';
import { ensurePlatformAdmin } from './platform-admin.js';
import { checkSeedTarget } from './seed-guard.js';

// MVP 3 · P2-B5: PLATFORM_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (DB từ xa bắt buộc mật khẩu mạnh)
async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set PLATFORM_ADMIN_EMAIL to the platform admin email');
  }
  const { password } = checkSeedTarget({ env: process.env, argv: [] });
  await dataSource.initialize();
  const result = await dataSource.transaction((m) => ensurePlatformAdmin(m, email, password));
  console.log(`Platform admin ${email}: ${result}`);
  await dataSource.destroy();
}

main().catch(async (error) => {
  console.error('Seed platform admin failed:', error instanceof Error ? error.message : error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});

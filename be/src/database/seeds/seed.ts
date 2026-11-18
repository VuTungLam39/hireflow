import dataSource from '../data-source.js';
import { seedDemo } from './demo/demo-seed.js';
import { checkSeedTarget, DEFAULT_SEED_PASSWORD } from './seed-guard.js';
import { createStorage } from './seed-storage.js';

async function seed() {
  const { reset, password } = checkSeedTarget({ env: process.env, argv: process.argv });
  await dataSource.initialize();
  const counts = await seedDemo(dataSource, await createStorage(), { reset, password });
  console.table(counts);
  console.log(
    `Mật khẩu của tài khoản mới tạo: ${process.env.SEED_ADMIN_PASSWORD ? 'SEED_ADMIN_PASSWORD' : DEFAULT_SEED_PASSWORD}`,
  );
  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});

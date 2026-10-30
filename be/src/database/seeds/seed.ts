import { buildStorageConfig } from '../../config/storage.config.js';
import { LocalStorageService } from '../../modules/files/storage/local.storage.js';
import { S3StorageService } from '../../modules/files/storage/s3.storage.js';
import type { StorageService } from '../../modules/files/storage/storage.service.js';
import dataSource from '../data-source.js';
import { seedDemo } from './demo/demo-seed.js';
import { checkSeedTarget, DEFAULT_SEED_PASSWORD } from './seed-guard.js';

async function createStorage(): Promise<StorageService> {
  const config = buildStorageConfig();
  if (config.driver !== 's3') return new LocalStorageService(config.localRoot);
  const s3 = new S3StorageService(config.s3);
  await s3.ensureBucket();
  return s3;
}

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

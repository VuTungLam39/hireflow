import { buildStorageConfig } from '../../config/storage.config.js';
import { LocalStorageService } from '../../modules/files/storage/local.storage.js';
import { S3StorageService } from '../../modules/files/storage/s3.storage.js';
import type { StorageService } from '../../modules/files/storage/storage.service.js';
import dataSource from '../data-source.js';
import { seedDemo } from './demo/demo-seed.js';

async function createStorage(): Promise<StorageService> {
  const config = buildStorageConfig();
  if (config.driver !== 's3') return new LocalStorageService(config.localRoot);
  const s3 = new S3StorageService(config.s3);
  await s3.ensureBucket();
  return s3;
}

async function seed() {
  const reset = process.argv.includes('--reset');
  if (reset && process.env.NODE_ENV === 'production') {
    throw new Error('--reset is not allowed when NODE_ENV=production');
  }
  await dataSource.initialize();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
  const counts = await seedDemo(dataSource, await createStorage(), { reset, password });
  console.table(counts);
  console.log('Mật khẩu của tài khoản mới tạo: SEED_ADMIN_PASSWORD (mặc định Admin@123)');
  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});

import { buildStorageConfig } from '../../config/storage.config.js';
import { LocalStorageService } from '../../modules/files/storage/local.storage.js';
import { S3StorageService } from '../../modules/files/storage/s3.storage.js';
import type { StorageService } from '../../modules/files/storage/storage.service.js';

export async function createStorage(): Promise<StorageService> {
  const config = buildStorageConfig();
  if (config.driver !== 's3') return new LocalStorageService(config.localRoot);
  const s3 = new S3StorageService(config.s3);
  await s3.ensureBucket();
  return s3;
}

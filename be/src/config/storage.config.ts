import { registerAs } from '@nestjs/config';

export type StorageDriver = 'local' | 's3';

export const buildStorageConfig = () => ({
  driver: (process.env.STORAGE_DRIVER ?? 'local') as StorageDriver,
  localRoot: process.env.STORAGE_LOCAL_ROOT ?? 'storage',
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || undefined,
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'hireflow-cv',
    accessKeyId: process.env.S3_ACCESS_KEY ?? '',
    secretAccessKey: process.env.S3_SECRET_KEY ?? '',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  },
});

export type StorageConfig = ReturnType<typeof buildStorageConfig>;

export const storageConfig = registerAs('storage', buildStorageConfig);

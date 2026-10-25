import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Logger, type OnModuleInit } from '@nestjs/common';
import type { StorageConfig } from '../../../config/storage.config.js';
import { StorageNotFoundError, StorageService } from './storage.service.js';

const NOT_FOUND = new Set(['NotFound', 'NoSuchKey', 'NoSuchBucket']);

const isNotFound = (error: unknown) => {
  const e = error as Partial<S3ServiceException> | undefined;
  return NOT_FOUND.has(e?.name ?? '') || e?.$metadata?.httpStatusCode === 404;
};

export class S3StorageService extends StorageService implements OnModuleInit {
  readonly driver = 's3';
  private readonly logger = new Logger(S3StorageService.name);
  private readonly bucket: string;

  constructor(
    config: StorageConfig['s3'],
    private readonly client: S3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    }),
  ) {
    super();
    this.bucket = config.bucket;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucket();
    } catch (error) {
      this.logger.error(`Bucket "${this.bucket}" unavailable: ${(error as Error).message}`);
    }
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (!isNotFound(error)) throw error;
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Created bucket "${this.bucket}"`);
    }
  }

  async put(key: string, body: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<Buffer> {
    try {
      const { Body } = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!Body) throw new StorageNotFoundError(key);
      return Buffer.from(await Body.transformToByteArray());
    } catch (error) {
      if (isNotFound(error)) throw new StorageNotFoundError(key);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

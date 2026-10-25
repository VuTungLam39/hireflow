import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StorageConfig } from '../../config/storage.config.js';
import { CvFile } from './entities/cv-file.entity.js';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';
import { LocalStorageService } from './storage/local.storage.js';
import { S3StorageService } from './storage/s3.storage.js';
import { StorageService } from './storage/storage.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CvFile])],
  controllers: [FilesController],
  providers: [
    FilesService,
    {
      provide: StorageService,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageService => {
        const storage = config.getOrThrow<StorageConfig>('storage');
        return storage.driver === 's3'
          ? new S3StorageService(storage.s3)
          : new LocalStorageService(storage.localRoot);
      },
    },
  ],
  exports: [FilesService, StorageService],
})
export class FilesModule {}

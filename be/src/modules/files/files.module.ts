import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvFile } from './entities/cv-file.entity.js';
import { FilesService } from './files.service.js';
import { StorageService } from './storage/storage.service.js';

// TODO tuần 3: GET /files/:fileId/url (presigned URL)
@Module({
  imports: [TypeOrmModule.forFeature([CvFile])],
  providers: [FilesService, StorageService],
  exports: [FilesService],
})
export class FilesModule {}

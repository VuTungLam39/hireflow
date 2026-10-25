import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvFile } from './entities/cv-file.entity.js';

// TODO tuần 3: upload, presigned URL
@Module({
  imports: [TypeOrmModule.forFeature([CvFile])],
})
export class FilesModule {}

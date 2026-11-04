import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { FilesModule } from '../files/files.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { CompanyController, PublicCompanyController } from './company.controller.js';
import { CompanyService } from './company.service.js';
import { CompanyProfile } from './entities/company-profile.entity.js';
import { MediaFile } from './entities/media-file.entity.js';

// Mở rộng MVP 2 – E3 · F-ORG-01, F-PUB-06, F-FILE-03
@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyProfile, MediaFile]),
    FilesModule,
    JobsModule,
    AuditModule,
  ],
  controllers: [CompanyController, PublicCompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}

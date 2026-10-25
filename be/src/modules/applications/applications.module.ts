import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesModule } from '../candidates/candidates.module.js';
import { FilesModule } from '../files/files.module.js';
import { ApplicationsController, JobApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';
import { ApplicationNote } from './entities/application-note.entity.js';
import { ApplicationStatusHistory } from './entities/application-status-history.entity.js';
import { Application } from './entities/application.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, ApplicationStatusHistory, ApplicationNote]),
    CandidatesModule,
    FilesModule,
  ],
  controllers: [ApplicationsController, JobApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}

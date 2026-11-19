import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module.js';
import { CandidatesModule } from '../candidates/candidates.module.js';
import { EmailModule } from '../email/email.module.js';
import { FilesModule } from '../files/files.module.js';
import { ApplicationTrackingService } from './application-tracking.service.js';
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
    AiModule,
    EmailModule,
  ],
  controllers: [ApplicationsController, JobApplicationsController],
  providers: [ApplicationsService, ApplicationTrackingService],
  exports: [ApplicationsService, ApplicationTrackingService],
})
export class ApplicationsModule {}

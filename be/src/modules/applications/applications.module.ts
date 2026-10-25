import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationNote } from './entities/application-note.entity.js';
import { ApplicationStatusHistory } from './entities/application-status-history.entity.js';
import { Application } from './entities/application.entity.js';

// TODO BE-13: controller, service
@Module({
  imports: [TypeOrmModule.forFeature([Application, ApplicationStatusHistory, ApplicationNote])],
})
export class ApplicationsModule {}

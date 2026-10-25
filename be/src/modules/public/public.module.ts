import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { PublicJobsController } from './public.controller.js';

@Module({
  imports: [JobsModule, ApplicationsModule],
  controllers: [PublicJobsController],
})
export class PublicModule {}

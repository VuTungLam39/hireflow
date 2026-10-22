import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsModule } from '../departments/departments.module.js';
import { JobRequirement } from './entities/job-requirement.entity.js';
import { Job } from './entities/job.entity.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobRequirement]), DepartmentsModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

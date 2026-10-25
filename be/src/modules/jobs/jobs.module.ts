import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobRequirement } from './entities/job-requirement.entity.js';
import { Job } from './entities/job.entity.js';

// TODO BE-11: controller, service
@Module({
  imports: [TypeOrmModule.forFeature([Job, JobRequirement])],
})
export class JobsModule {}

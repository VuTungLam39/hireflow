import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module.js';
import { DepartmentsModule } from '../departments/departments.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { JobInterviewStage } from './entities/job-interview-stage.entity.js';
import { JobRequirement } from './entities/job-requirement.entity.js';
import { Job } from './entities/job.entity.js';
import { RankingWeight } from './entities/ranking-weight.entity.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';
import { PrerenderHookService } from './prerender-hook.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobRequirement, JobInterviewStage, RankingWeight]),
    DepartmentsModule,
    AiModule,
    MatchingModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, PrerenderHookService],
  exports: [JobsService, PrerenderHookService],
})
export class JobsModule {}

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module.js';
import { QUEUE } from '../ai/pipeline/queues.js';
import { ApplicationsModule } from '../applications/applications.module.js';
import { JobMatch } from './entities/job-match.entity.js';
import { MatchJobProcessor } from './match-job.processor.js';
import { MatchingController } from './matching.controller.js';
import { MatchingService } from './matching.service.js';

// Kickoff 7.4: matching (MVP 2)
@Module({
  imports: [
    TypeOrmModule.forFeature([JobMatch]),
    BullModule.registerQueue({ name: QUEUE.match }),
    AiModule,
    ApplicationsModule,
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchJobProcessor],
  exports: [MatchingService],
})
export class MatchingModule {}

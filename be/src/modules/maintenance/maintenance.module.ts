import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { QUEUE } from '../ai/pipeline/queues.js';
import { CandidatesModule } from '../candidates/candidates.module.js';
import { OffersModule } from '../offers/offers.module.js';
import { EmailModule } from '../email/email.module.js';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module.js';
import { MaintenanceProcessor } from './maintenance.processor.js';
import { MaintenanceService } from './maintenance.service.js';

// Kickoff 12: job định kỳ (MVP 2)
@Module({
  imports: [
    AiModule,
    BullModule.registerQueue({ name: QUEUE.maintenance }),
    CandidatesModule,
    EmailModule,
    OffersModule,
    RefreshTokensModule,
  ],
  providers: [MaintenanceService, MaintenanceProcessor],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}

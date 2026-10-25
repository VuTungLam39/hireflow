import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { QUEUE } from '../ai/pipeline/queues.js';
import { FilesModule } from '../files/files.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule, FilesModule, BullModule.registerQueue({ name: QUEUE.parse })],
  controllers: [HealthController],
})
export class HealthModule {}

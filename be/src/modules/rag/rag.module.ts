import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module.js';
import { QUEUE } from '../ai/pipeline/queues.js';
import { EmbedCvProcessor } from './embed-cv.processor.js';
import { CvChunk } from './entities/cv-chunk.entity.js';
import { RagController } from './rag.controller.js';
import { RagService } from './rag.service.js';

// Backend Architecture 2.3
@Module({
  imports: [
    TypeOrmModule.forFeature([CvChunk]),
    BullModule.registerQueue({ name: QUEUE.embed }),
    AiModule,
  ],
  controllers: [RagController],
  providers: [RagService, EmbedCvProcessor],
})
export class RagModule {}

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { aiConfig } from '../../config/ai.config.js';
import { queueConfig } from '../../config/queue.config.js';
import { FilesModule } from '../files/files.module.js';
import { buildEmbeddingProvider, buildLlmProvider } from './ai.factory.js';
import { EMBEDDING_PROVIDER, LLM_PROVIDER } from './ai.types.js';
import { CvProfile } from './entities/cv-profile.entity.js';
import { CvPipelineService } from './pipeline/cv-pipeline.service.js';
import { ExtractCvProcessor, ParseCvProcessor, ScoreProcessor } from './pipeline/processors.js';
import { DEFAULT_JOB_OPTIONS, QUEUE } from './pipeline/queues.js';
import { RequirementsSuggester } from './requirements-suggester.service.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [queueConfig.KEY],
      useFactory: (config: ConfigType<typeof queueConfig>) => ({
        connection: config.redis,
        prefix: config.prefix,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE.parse },
      { name: QUEUE.extract },
      { name: QUEUE.score },
      { name: QUEUE.embed },
    ),
    TypeOrmModule.forFeature([CvProfile]),
    FilesModule,
  ],
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [aiConfig.KEY],
      useFactory: (config: ConfigType<typeof aiConfig>) => buildLlmProvider(config),
    },
    {
      provide: EMBEDDING_PROVIDER,
      inject: [aiConfig.KEY],
      useFactory: (config: ConfigType<typeof aiConfig>) => buildEmbeddingProvider(config),
    },
    CvPipelineService,
    RequirementsSuggester,
    ParseCvProcessor,
    ExtractCvProcessor,
    ScoreProcessor,
  ],
  exports: [LLM_PROVIDER, EMBEDDING_PROVIDER, CvPipelineService, RequirementsSuggester],
})
export class AiModule {}

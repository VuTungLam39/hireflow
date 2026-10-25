import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { aiConfig } from '../../config/ai.config.js';
import { buildEmbeddingProvider, buildLlmProvider } from './ai.factory.js';
import { EMBEDDING_PROVIDER, LLM_PROVIDER } from './ai.types.js';

// TODO tuần 3: worker parse-cv, extract-cv, score, embed-cv
@Module({
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
  ],
  exports: [LLM_PROVIDER, EMBEDDING_PROVIDER],
})
export class AiModule {}

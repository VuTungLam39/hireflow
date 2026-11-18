import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { emailConfig } from '../../config/email.config.js';
import { buildEmailProvider } from './email.providers.js';
import { EmailProcessor } from './email.processor.js';
import { EmailService } from './email.service.js';
import { EMAIL_PROVIDER, EMAIL_QUEUE } from './email.types.js';
import { EmailOutbox } from './entities/email-outbox.entity.js';

// MVP 3 · BR-NOTI-02
@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
    TypeOrmModule.forFeature([EmailOutbox]),
  ],
  providers: [
    {
      provide: EMAIL_PROVIDER,
      inject: [emailConfig.KEY],
      useFactory: (config: ConfigType<typeof emailConfig>) => {
        const provider = buildEmailProvider(config);
        new Logger('Email').log(`provider: ${provider.name}`);
        return provider;
      },
    },
    EmailService,
    EmailProcessor,
  ],
  exports: [EmailService, EMAIL_PROVIDER],
})
export class EmailModule {}

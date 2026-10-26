import { ConsoleLogger, type LoggerService } from '@nestjs/common';

// Kickoff 6, Backend Architecture 15.2
export const createAppLogger = (): LoggerService | undefined =>
  process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json'
    ? new ConsoleLogger({ json: true })
    : undefined;

import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import type { AiStatus } from '../enums/ai-status.enum.js';

// Kickoff 12: sự kiện trong tiến trình, phát sau khi transaction commit
export interface AppEventMap {
  'application.changed': { applicationId: string };
  'application.ai-finished': { applicationId: string; aiStatus: AiStatus };
  'job.changed': { jobId: string };
}

export type AppEventName = keyof AppEventMap;

@Injectable()
export class AppEvents {
  private readonly logger = new Logger(AppEvents.name);
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit<K extends AppEventName>(name: K, payload: AppEventMap[K]): void {
    this.emitter.emit(name, payload);
  }

  on<K extends AppEventName>(name: K, listener: (payload: AppEventMap[K]) => unknown): void {
    this.emitter.on(name, (payload: AppEventMap[K]) => {
      Promise.resolve()
        .then(() => listener(payload))
        .catch((error: Error) => this.logger.error(`${name} listener failed: ${error.message}`));
    });
  }
}

@Global()
@Module({ providers: [AppEvents], exports: [AppEvents] })
export class AppEventsModule {}

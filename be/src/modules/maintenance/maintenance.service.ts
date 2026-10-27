import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE } from '../ai/pipeline/queues.js';
import { CandidatesService } from '../candidates/candidates.service.js';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service.js';
import {
  MAINTENANCE_SCHEDULE,
  MAINTENANCE_TASK,
  MAINTENANCE_TIMEZONE,
  type MaintenanceTask,
} from './maintenance.tasks.js';

@Injectable()
export class MaintenanceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectQueue(QUEUE.maintenance) private readonly queue: Queue,
    private readonly candidates: CandidatesService,
    private readonly tokens: RefreshTokensService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const [task, pattern] of Object.entries(MAINTENANCE_SCHEDULE)) {
      try {
        await this.queue.upsertJobScheduler(
          task,
          { pattern, tz: MAINTENANCE_TIMEZONE },
          { name: task, opts: { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } } },
        );
      } catch (error) {
        this.logger.error(`Cannot schedule ${task}: ${(error as Error).message}`);
      }
    }
  }

  async run(task: MaintenanceTask): Promise<number> {
    const count =
      task === MAINTENANCE_TASK.anonymizeExpired
        ? await this.candidates.anonymizeExpired()
        : await this.tokens.purgeExpired();
    this.logger.log(`${task}: ${count}`);
    return count;
  }
}

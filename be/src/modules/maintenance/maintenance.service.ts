import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { PipelineOpsService } from '../ai/pipeline/pipeline-ops.service.js';
import { QUEUE } from '../ai/pipeline/queues.js';
import { CandidatesService } from '../candidates/candidates.service.js';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service.js';
import {
  MAINTENANCE_SCHEDULE,
  MAINTENANCE_TASK,
  MAINTENANCE_TIMEZONE,
  type MaintenanceTask,
} from './maintenance.tasks.js';

export const SELF_HEAL_INTERVAL_MS = 10 * 60_000;
export const FIRST_HEAL_DELAY_MS = 60_000;

@Injectable()
export class MaintenanceService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MaintenanceService.name);
  private healTimer?: NodeJS.Timeout;
  private firstHeal?: NodeJS.Timeout;

  constructor(
    @InjectQueue(QUEUE.maintenance) private readonly queue: Queue,
    private readonly candidates: CandidatesService,
    private readonly tokens: RefreshTokensService,
    private readonly ops: PipelineOpsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureSchedules();
    // Phase 5 O2: vòng ngoài Redis
    this.healTimer = setInterval(() => void this.heal(), SELF_HEAL_INTERVAL_MS);
    this.healTimer.unref();
    this.firstHeal = setTimeout(() => void this.heal(), FIRST_HEAL_DELAY_MS);
    this.firstHeal.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.healTimer);
    clearTimeout(this.firstHeal);
  }

  async heal(): Promise<number> {
    await this.ensureSchedules();
    try {
      return await this.ops.requeueLost();
    } catch (error) {
      this.logger.error(`Cannot requeue lost AI jobs: ${(error as Error).message}`);
      return 0;
    }
  }

  private async ensureSchedules(): Promise<void> {
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

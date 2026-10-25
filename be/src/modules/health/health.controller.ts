import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import type { Queue } from 'bullmq';
import { Public } from '../../common/decorators/public.decorator.js';
import { QUEUE } from '../ai/pipeline/queues.js';
import { StorageService } from '../files/storage/storage.service.js';

const CHECK_TIMEOUT_MS = 3_000;

// Kickoff 19
@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly indicators: HealthIndicatorService,
    private readonly storage: StorageService,
    @InjectQueue(QUEUE.parse) private readonly queue: Queue,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Kiểm tra server, database, Redis (queue) và kho lưu file' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.indicators
          .check('redis')
          .attempt(async () => {
            await this.queue.getJobCounts('waiting');
          })
          .withTimeout(CHECK_TIMEOUT_MS),
      () =>
        this.indicators
          .check('storage')
          .attempt(async () => {
            await this.storage.ping();
            return { driver: this.storage.driver };
          })
          .withTimeout(CHECK_TIMEOUT_MS),
    ]);
  }
}

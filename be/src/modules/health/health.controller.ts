import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get, NotFoundException, Req, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import type { Queue } from 'bullmq';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { QUEUE } from '../ai/pipeline/queues.js';
import { StorageService } from '../files/storage/storage.service.js';
import { cachedCheck } from './cached-check.js';

const CHECK_TIMEOUT_MS = 3_000;
// B2 tính tiền và có hạn mức giao dịch mỗi ngày: Render hỏi health mỗi 10 s thì một ngày tiêu ~8.640 lần
const STORAGE_OK_CACHE_MS = 5 * 60_000;
const STORAGE_FAIL_CACHE_MS = 60_000;

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
    private readonly config: ConfigService,
    @InjectQueue(QUEUE.parse) private readonly queue: Queue,
  ) {}

  private readonly storagePing = cachedCheck(STORAGE_OK_CACHE_MS, STORAGE_FAIL_CACHE_MS);

  // Render healthCheckPath: chỉ process + DB, không gọi kho file nên không tốn giao dịch B2
  @Get('live')
  @HealthCheck()
  @ApiOperation({
    summary: 'Kiểm tra cho nền tảng deploy: server và database (không gọi kho lưu file)',
  })
  live() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary:
      'Kiểm tra server, database, Redis (queue) và kho lưu file (kết quả kho file giữ 5 phút)',
  })
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
            await this.storagePing(() => this.storage.ping());
            return { driver: this.storage.driver };
          })
          .withTimeout(CHECK_TIMEOUT_MS),
    ]);
  }

  // Deploy: dò TRUST_PROXY
  @Get('ip')
  @ApiOperation({ summary: 'IP server nhận được (chỉ bật khi DEBUG_CLIENT_IP=true)' })
  clientIp(@Req() req: Request) {
    if (!this.config.get<boolean>('app.debugClientIp', false)) throw new NotFoundException();
    return { ip: req.ip, ips: req.ips, forwardedFor: req.headers['x-forwarded-for'] ?? null };
  }
}

import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardCache } from './dashboard-cache.service.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardCache],
  exports: [DashboardCache],
})
export class DashboardModule {}

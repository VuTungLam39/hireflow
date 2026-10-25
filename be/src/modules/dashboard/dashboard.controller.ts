import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { DashboardService } from './dashboard.service.js';

// API Contract 4.9
@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Permissions(Permission.DashboardRead)
  @ApiOperation({ summary: 'Thống kê tổng quan (lọc theo phạm vi phòng ban)' })
  summary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.summary(user);
  }
}

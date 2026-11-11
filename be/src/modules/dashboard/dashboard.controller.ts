import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { DashboardService } from './dashboard.service.js';
import { QueryFunnelDto } from './dto/query-funnel.dto.js';

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

  @Get('funnel')
  @Permissions(Permission.DashboardRead)
  @ApiOperation({
    summary: 'Phễu tuyển dụng theo cohort ngày nộp (≤ 366 ngày, lọc theo phạm vi, cache 5 phút)',
  })
  funnel(@Query() query: QueryFunnelDto, @CurrentUser() user: AuthUser) {
    return this.dashboardService.funnel(query, user);
  }
}

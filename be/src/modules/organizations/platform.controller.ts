import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { PipelineOpsService } from '../ai/pipeline/pipeline-ops.service.js';
import { AiLimitsDto, OrgReasonDto, QueryOrganizationsDto } from './dto/platform.dto.js';
import { PlatformOrganizationsService } from './platform-organizations.service.js';

// MVP 3 · KH 8.2, US-20, BR-TEN-04
@ApiTags('Platform')
@ApiBearerAuth()
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly organizations: PlatformOrganizationsService,
    private readonly ops: PipelineOpsService,
  ) {}

  @Get('organizations')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Công ty trên sàn, lọc theo trạng thái, kèm số đếm tổng' })
  findAll(@Query() query: QueryOrganizationsDto) {
    return this.organizations.findAll(query);
  }

  @Get('organizations/:id')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Chi tiết một công ty' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizations.findOne(id);
  }

  @Patch('organizations/:id/approve')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Duyệt công ty: PENDING → ACTIVE' })
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.organizations.transition(id, 'approve', user);
  }

  @Patch('organizations/:id/reject')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Từ chối công ty: PENDING → REJECTED (bắt buộc lý do)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OrgReasonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organizations.transition(id, 'reject', user, dto.reason);
  }

  @Patch('organizations/:id/suspend')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Khoá công ty: ACTIVE → SUSPENDED (bắt buộc lý do)' })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OrgReasonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organizations.transition(id, 'suspend', user, dto.reason);
  }

  @Patch('organizations/:id/reactivate')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Mở khoá công ty: SUSPENDED → ACTIVE' })
  reactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.organizations.transition(id, 'reactivate', user);
  }

  @Patch('organizations/:id/ai-limits')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Sửa hạn mức lượt AI mỗi ngày của công ty (BR-AI-11)' })
  updateAiLimits(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AiLimitsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organizations.updateAiLimits(id, dto, user);
  }

  // Chốt 17/11/2026 (BR-PROC-01): số đếm hàng đợi là của toàn hệ thống
  @Get('queues')
  @Permissions(Permission.PlatformManage)
  @ApiOperation({ summary: 'Số việc trong từng queue của pipeline AI (toàn hệ thống)' })
  queues() {
    return this.ops.queueCounts();
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { AuditService } from './audit.service.js';
import { QueryAuditLogDto } from './dto/query-audit-log.dto.js';

// F-AUDIT-01
@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Permissions(Permission.AuditRead)
  @ApiOperation({ summary: 'Nhật ký hành động nhạy cảm, mới nhất trước (cursor), chỉ Admin' })
  list(@Query() query: QueryAuditLogDto) {
    return this.audit.list(query);
  }
}

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { RequestId } from '../../common/decorators/request-id.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { PipelineOpsService } from './pipeline/pipeline-ops.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';

// API Contract 4.10, F-OPS-01
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminJobsController {
  constructor(private readonly ops: PipelineOpsService) {}

  @Get('jobs/failed')
  @Permissions(Permission.OpsManage)
  @ApiOperation({ summary: 'Hồ sơ chấm AI lỗi (FAILED) hoặc kẹt ở PENDING quá 5 phút' })
  findIssues(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthUser) {
    return this.ops.findIssues(query, user);
  }

  @Post('jobs/retry-all')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(Permission.OpsManage)
  @ApiOperation({ summary: 'Chạy lại toàn bộ hồ sơ lỗi/kẹt (tối đa 500 mỗi lần)' })
  @ResponseMessage('Retry scheduled')
  retryAll(@CurrentUser() user: AuthUser, @RequestId() requestId?: string) {
    return this.ops.retryAll(user, requestId);
  }

  @Post('jobs/:applicationId/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(Permission.OpsManage)
  @ApiOperation({ summary: 'Chạy lại pipeline AI cho một hồ sơ lỗi/kẹt' })
  @ResponseMessage('Retry scheduled')
  retry(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: AuthUser,
    @RequestId() requestId?: string,
  ) {
    return this.ops.retry(applicationId, user, requestId);
  }

  @Get('queues')
  @Permissions(Permission.OpsManage)
  @ApiOperation({ summary: 'Số việc trong từng queue của pipeline AI' })
  queues() {
    return this.ops.queueCounts();
  }
}

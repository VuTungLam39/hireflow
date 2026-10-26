import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { RequestId } from '../../common/decorators/request-id.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { MatchingService } from './matching.service.js';

// API Contract 4.4
@ApiTags('Matching')
@ApiBearerAuth()
@Controller('jobs')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get(':id/matches')
  @Permissions(Permission.ApplicationCreate)
  @ApiOperation({ summary: 'Ứng viên cũ phù hợp với job, kèm lý do (US-10)' })
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.matching.list(id);
  }

  @Post(':id/matches/:candidateId/invite')
  @Permissions(Permission.ApplicationCreate)
  @ApiOperation({ summary: 'Mời ứng viên cũ vào job: tạo hồ sơ nguồn MATCH_INVITE (US-10)' })
  @ResponseMessage('Candidate invited')
  invite(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @CurrentUser() user: AuthUser,
    @RequestId() requestId?: string,
  ) {
    return this.matching.invite(id, candidateId, user, requestId);
  }
}

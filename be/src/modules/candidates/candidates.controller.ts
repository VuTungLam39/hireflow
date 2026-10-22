import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { CandidatesService } from './candidates.service.js';
import { QueryCandidateDto } from './dto/query-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';

// API Contract 4.11
@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @Permissions(Permission.CandidateRead)
  @ApiOperation({ summary: 'Kho ứng viên, phân trang cursor, tìm tên/email không dấu' })
  findAll(@Query() query: QueryCandidateDto, @CurrentUser() user: AuthUser) {
    return this.candidatesService.findAll(query, user);
  }

  @Get(':id')
  @Permissions(Permission.CandidateRead)
  @ApiOperation({ summary: 'Chi tiết ứng viên kèm các lần nộp trong phạm vi' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.candidatesService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions(Permission.CandidateUpdate)
  @ApiOperation({ summary: 'Sửa họ tên, số điện thoại (không sửa email)' })
  @ResponseMessage('Candidate updated')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.candidatesService.update(id, dto, user);
  }

  @Post(':id/anonymize')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.CandidateAnonymize)
  @ApiOperation({ summary: 'Ẩn danh ứng viên theo yêu cầu, không hoàn tác' })
  @ResponseMessage('Candidate anonymized')
  anonymize(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.candidatesService.anonymize(id, user);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { RequestId } from '../../common/decorators/request-id.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { QueryJobDto } from './dto/query-job.dto.js';
import { SaveRequirementsDto } from './dto/save-requirements.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { JobsService } from './jobs.service.js';

// API Contract 4.4
@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @Permissions(Permission.JobRead)
  @ApiOperation({ summary: 'Danh sách job kèm pipeline (lọc theo phạm vi phòng ban)' })
  findAll(@Query() query: QueryJobDto, @CurrentUser() user: AuthUser) {
    return this.jobsService.findAll(query, user);
  }

  @Get(':id')
  @Permissions(Permission.JobRead)
  @ApiOperation({ summary: 'Chi tiết job kèm tiêu chí hiện hành' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.findOne(id, user);
  }

  @Get(':id/ranking')
  @Permissions(Permission.JobRead)
  @ApiOperation({ summary: 'Mức khớp từng tiêu chí của mọi hồ sơ trong job (US-05)' })
  ranking(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.ranking(id, user);
  }

  @Post()
  @Permissions(Permission.JobCreate)
  @ApiOperation({ summary: 'Tạo job (DRAFT, chưa có tiêu chí)' })
  @ResponseMessage('Job created')
  create(@Body() dto: CreateJobDto, @CurrentUser() user: AuthUser) {
    return this.jobsService.create(dto, user);
  }

  @Patch(':id')
  @Permissions(Permission.JobUpdate)
  @ApiOperation({ summary: 'Sửa JD (không sửa được job CLOSED)' })
  @ResponseMessage('Job updated')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.jobsService.update(id, dto, user);
  }

  @Post(':id/requirements/suggest')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.JobUpdate)
  @ApiOperation({ summary: 'AI gợi ý tiêu chí từ JD (không lưu); 503 AI_UNAVAILABLE khi LLM lỗi' })
  suggestRequirements(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.suggestRequirements(id);
  }

  @Put(':id/requirements')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(Permission.JobUpdate)
  @ApiOperation({ summary: 'Thay toàn bộ tiêu chí, tạo phiên bản mới, tính lại điểm' })
  @ResponseMessage('Rescoring scheduled')
  saveRequirements(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveRequirementsDto,
    @RequestId() requestId?: string,
  ) {
    return this.jobsService.saveRequirements(id, dto, requestId);
  }

  @Patch(':id/publish')
  @Permissions(Permission.JobPublish)
  @ApiOperation({ summary: 'DRAFT → OPEN (cần ít nhất 1 tiêu chí)' })
  @ResponseMessage('Job published')
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @RequestId() requestId?: string,
  ) {
    return this.jobsService.publish(id, user, requestId);
  }

  @Patch(':id/close')
  @Permissions(Permission.JobPublish)
  @ApiOperation({ summary: 'OPEN → CLOSED (không mở lại)' })
  @ResponseMessage('Job closed')
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.close(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.JobUpdate)
  @ApiOperation({ summary: 'Xoá mềm job DRAFT chưa có hồ sơ' })
  @ResponseMessage('Job deleted')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.remove(id);
  }
}

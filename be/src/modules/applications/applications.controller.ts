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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import type { UploadedCv } from '../files/cv-file.rules.js';
import { CV_MAX_BYTES } from '../files/entities/cv-file.entity.js';
import { ApplicationsService } from './applications.service.js';
import { ChangeStatusDto, DeclineOfferDto } from './dto/change-status.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { HrUploadDto } from './dto/hr-upload.dto.js';
import { QueryApplicationDto } from './dto/query-application.dto.js';

// API Contract 4.5
@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({ summary: 'Bảng hồ sơ: lọc, sắp xếp, phân trang (lọc theo phạm vi phòng ban)' })
  findAll(@Query() query: QueryApplicationDto, @CurrentUser() user: AuthUser) {
    return this.applicationsService.findAll(query, user);
  }

  @Get(':id')
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({ summary: 'Chi tiết hồ sơ: điểm, bằng chứng, CV' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.findOne(id, user);
  }

  @Get(':id/history')
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({ summary: 'Lịch sử trạng thái, mới nhất trước' })
  history(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.history(id, user);
  }

  @Get(':id/notes')
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({ summary: 'Ghi chú, mới nhất trước' })
  notes(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.notes(id, user);
  }

  @Post(':id/notes')
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({ summary: 'Thêm ghi chú (không sửa, không xoá)' })
  @ResponseMessage('Note added')
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.addNote(id, dto, user);
  }

  @Patch(':id/status')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'Đổi trạng thái theo luồng (không nhận HIRED)' })
  @ResponseMessage('Status changed')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.changeStatus(id, dto, user);
  }

  @Patch(':id/hire')
  @Permissions(Permission.ApplicationApproveOffer)
  @ApiOperation({ summary: 'Duyệt nhận việc: OFFER → HIRED' })
  @ResponseMessage('Candidate hired')
  hire(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.hire(id, user);
  }

  @Patch(':id/decline-offer')
  @Permissions(Permission.ApplicationApproveOffer)
  @ApiOperation({ summary: 'Từ chối ở bước OFFER: OFFER → REJECTED, bắt buộc lý do' })
  @ResponseMessage('Offer declined')
  declineOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.declineOffer(id, dto.reason, user);
  }

  @Post(':id/rescore')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(Permission.AiRescore)
  @ApiOperation({ summary: 'Chấm lại (tuần 3); hiện trả 503 AI_UNAVAILABLE' })
  rescore(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.applicationsService.rescore(id, user);
  }
}

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('jobs/:jobId/applications')
export class JobApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Permissions(Permission.ApplicationCreate)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'HR tải CV hộ ứng viên vào job OPEN (nguồn HR_UPLOAD)' })
  @ResponseMessage('Application created')
  @UseInterceptors(FileInterceptor('cv', { limits: { fileSize: CV_MAX_BYTES, files: 1 } }))
  upload(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: HrUploadDto,
    @UploadedFile() file: UploadedCv | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.uploadForCandidate(jobId, dto, file, user);
  }
}

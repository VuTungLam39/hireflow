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
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { RequestId } from '../../common/decorators/request-id.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import type { UploadedCv } from '../files/cv-file.rules.js';
import { CV_UPLOAD_OPTIONS } from '../files/cv-upload.options.js';
import { ApplicationsService } from './applications.service.js';
import { ChangeStatusDto, DeclineOfferDto } from './dto/change-status.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { CvTextDto } from './dto/cv-text.dto.js';
import { HrUploadDto } from './dto/hr-upload.dto.js';
import { QueryApplicationDto } from './dto/query-application.dto.js';
import { ReopenApplicationDto } from './dto/reopen-application.dto.js';

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
  @ApiOperation({ summary: 'Chấm lại: FAILED chạy lại từ bước lỗi, DONE chỉ tính lại điểm' })
  @ResponseMessage('Rescoring scheduled')
  rescore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @RequestId() requestId?: string,
  ) {
    return this.applicationsService.rescore(id, user, requestId);
  }

  @Patch(':id/reopen')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'Mở lại hồ sơ REJECTED/WITHDRAWN về SCREENING, bắt buộc lý do' })
  @ResponseMessage('Application reopened')
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReopenApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applicationsService.reopen(id, dto.reason, user);
  }

  @Put(':id/cv-text')
  @Permissions(Permission.AiRescore)
  @ApiOperation({ summary: 'Nhập text CV thủ công khi file không đọc được chữ, rồi chấm lại' })
  @ResponseMessage('CV text saved')
  enterCvText(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CvTextDto,
    @CurrentUser() user: AuthUser,
    @RequestId() requestId?: string,
  ) {
    return this.applicationsService.enterCvText(id, dto, user, requestId);
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
  @UseInterceptors(FileInterceptor('cv', CV_UPLOAD_OPTIONS))
  upload(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: HrUploadDto,
    @UploadedFile() file: UploadedCv | undefined,
    @CurrentUser() user: AuthUser,
    @RequestId() requestId?: string,
  ) {
    return this.applicationsService.uploadForCandidate(jobId, dto, file, user, requestId);
  }
}

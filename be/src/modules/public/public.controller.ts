import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequestId } from '../../common/decorators/request-id.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { ApplicationsService } from '../applications/applications.service.js';
import { PublicApplyDto } from '../applications/dto/public-apply.dto.js';
import type { UploadedCv } from '../files/cv-file.rules.js';
import { CV_UPLOAD_OPTIONS } from '../files/cv-upload.options.js';
import { JobsService } from '../jobs/jobs.service.js';

const HOUR_MS = 3_600_000;

// API Contract 4.7
@ApiTags('Public')
@Public()
@Controller('public/jobs')
export class PublicJobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Job đang tuyển (OPEN), mới đăng trước' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.jobsService.findPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết job công khai: JD, tên và loại tiêu chí' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findPublicOne(id);
  }

  // BR-APP-06
  @Post(':id/apply')
  @Throttle({ default: { limit: 10, ttl: HOUR_MS } })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Ứng viên nộp CV (không trả id, điểm, trạng thái)' })
  @ResponseMessage('Application submitted')
  @UseInterceptors(FileInterceptor('cv', CV_UPLOAD_OPTIONS))
  apply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublicApplyDto,
    @UploadedFile() file: UploadedCv | undefined,
    @RequestId() requestId?: string,
  ) {
    return this.applicationsService.applyPublic(id, dto, file, requestId);
  }
}

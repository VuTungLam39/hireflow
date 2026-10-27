import {
  Body,
  Controller,
  Get,
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
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import {
  CancelInterviewDto,
  FeedbackDto,
  QueryInterviewDto,
  ScheduleInterviewDto,
  UpdateInterviewDto,
} from './dto/interview.dto.js';
import { InterviewsService } from './interviews.service.js';

// F-INT-01 → 03, US-11
@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get()
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({
    summary: 'Lịch phỏng vấn theo khoảng thời gian (Interviewer: chỉ buổi được giao)',
  })
  list(@Query() query: QueryInterviewDto, @CurrentUser() user: AuthUser) {
    return this.interviews.list(query, user);
  }

  @Get('interviewers')
  @Permissions(Permission.InterviewManage)
  @ApiOperation({ summary: 'Người dùng vai trò Interviewer đang hoạt động (để phân công)' })
  interviewers() {
    return this.interviews.interviewers();
  }

  @Patch(':id')
  @Permissions(Permission.InterviewManage)
  @ApiOperation({ summary: 'Đổi giờ, địa điểm, người phỏng vấn (chỉ khi chưa có phiếu)' })
  @ResponseMessage('Interview updated')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.interviews.update(id, dto, user);
  }

  @Patch(':id/cancel')
  @Permissions(Permission.InterviewManage)
  @ApiOperation({ summary: 'Huỷ buổi phỏng vấn, bắt buộc lý do' })
  @ResponseMessage('Interview cancelled')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInterviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.interviews.cancel(id, dto, user);
  }

  @Put(':id/feedback')
  @Permissions(Permission.InterviewFeedback)
  @ApiOperation({ summary: 'Gửi hoặc sửa phiếu đánh giá của mình (sửa trong 24 giờ)' })
  @ResponseMessage('Feedback saved')
  feedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FeedbackDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.interviews.submitFeedback(id, dto, user);
  }
}

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('applications/:applicationId/interviews')
export class ApplicationInterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get()
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({ summary: 'Các buổi phỏng vấn của hồ sơ kèm phiếu đánh giá' })
  list(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.interviews.forApplication(applicationId, user);
  }

  @Post()
  @Permissions(Permission.InterviewManage)
  @ApiOperation({ summary: 'Đặt lịch phỏng vấn và phân công Interviewer (hồ sơ ở INTERVIEW)' })
  @ResponseMessage('Interview scheduled')
  schedule(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: ScheduleInterviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.interviews.schedule(applicationId, dto, user);
  }
}

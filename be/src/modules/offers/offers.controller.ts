import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import {
  CreateOfferDto,
  DeclineOfferDto,
  OfferReasonDto,
  UpdateOfferDto,
} from './dto/offer.dto.js';
import { OffersService } from './offers.service.js';

// MVP 3.1 · F-OFFER-01
@ApiTags('Offers')
@ApiBearerAuth()
@Controller('applications/:applicationId/offers')
export class ApplicationOffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  @Permissions(Permission.ApplicationRead)
  @ApiOperation({ summary: 'Các offer của hồ sơ, mới nhất trước (Interviewer bị chặn)' })
  list(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offers.list(applicationId, user);
  }

  @Post()
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'Soạn offer nháp cho hồ sơ ở INTERVIEW' })
  create(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offers.create(applicationId, dto, user);
  }
}

@ApiTags('Offers')
@ApiBearerAuth()
@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Patch(':id')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'Sửa offer nháp' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offers.update(id, dto, user);
  }

  @Patch(':id/submit')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'DRAFT → PENDING_APPROVAL, báo người duyệt' })
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.offers.submit(id, user);
  }

  @Patch(':id/approve')
  @Permissions(Permission.ApplicationApproveOffer)
  @ApiOperation({ summary: 'HM phụ trách hoặc Admin duyệt: PENDING_APPROVAL → APPROVED' })
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.offers.approve(id, user);
  }

  @Patch(':id/return')
  @Permissions(Permission.ApplicationApproveOffer)
  @ApiOperation({ summary: 'Trả lại để sửa: PENDING_APPROVAL → DRAFT, bắt buộc lý do' })
  returnToDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OfferReasonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offers.returnToDraft(id, dto.reason, user);
  }

  @Patch(':id/send')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'Đánh dấu đã gửi: APPROVED → SENT, hồ sơ → OFFER' })
  send(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.offers.send(id, user);
  }

  @Patch(':id/accept')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'Ứng viên nhận: SENT → ACCEPTED, hồ sơ → HIRED' })
  accept(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.offers.accept(id, user);
  }

  @Patch(':id/decline')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({
    summary: 'Ứng viên từ chối: SENT → DECLINED, hồ sơ → REJECTED (CANDIDATE_DECLINED)',
  })
  decline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offers.decline(id, dto.reason, user);
  }

  @Patch(':id/withdraw')
  @Permissions(Permission.ApplicationUpdateStatus)
  @ApiOperation({ summary: 'Rút offer trước khi gửi, bắt buộc lý do' })
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OfferReasonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offers.withdraw(id, dto.reason, user);
  }
}

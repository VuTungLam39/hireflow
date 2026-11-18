import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import {
  RegisterEmployerDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto/register-employer.dto.js';
import { EmployerRegistrationService } from './employer-registration.service.js';

const HOUR_MS = 3_600_000;

// MVP 3 · KH 8.1, US-19, BR-ACC-09
@ApiTags('Public')
@Public()
@Controller('public/employers')
export class EmployersController {
  constructor(private readonly registration: EmployerRegistrationService) {}

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Công ty tự đăng ký; gửi email xác minh cho người đăng ký' })
  @ResponseMessage('Check your email')
  register(@Body() dto: RegisterEmployerDto) {
    return this.registration.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Xác minh email bằng token trong link (dùng một lần, 24 giờ)' })
  @ResponseMessage('Email verified')
  verify(@Body() dto: VerifyEmailDto) {
    return this.registration.verify(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Gửi lại email xác minh; luôn 202' })
  @ResponseMessage('Check your email')
  resend(@Body() dto: ResendVerificationDto) {
    return this.registration.resend(dto.email);
  }
}

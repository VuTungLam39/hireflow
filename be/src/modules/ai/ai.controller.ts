import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { ChatDto } from './dto/chat.dto.js';

// API Contract 4.8
@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  // TODO tuần 4: RAG chat (SSE)
  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Permissions(Permission.AiChat)
  @ApiOperation({ summary: 'Chat tìm ứng viên (stream SSE); 503 AI_UNAVAILABLE khi chưa sẵn sàng' })
  chat(@Body() _dto: ChatDto): never {
    throw new BusinessException(
      ErrorCode.AiUnavailable,
      'AI chat is not available yet',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

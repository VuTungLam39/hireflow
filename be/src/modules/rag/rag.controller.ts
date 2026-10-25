import { Body, Controller, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { Permission } from '../../common/permissions/permission.enum.js';
import { ChatDto } from './dto/chat.dto.js';
import { RagService } from './rag.service.js';

// API Contract 4.8
@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly rag: RagService) {}

  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Permissions(Permission.AiChat)
  @ApiProduces('text/event-stream')
  @ApiOperation({ summary: 'Chat tìm ứng viên trong kho CV (stream SSE: sources → token → done)' })
  async chat(
    @Body() dto: ChatDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const plan = await this.rag.prepare(dto.question, user);

    const controller = new AbortController();
    res.on('close', () => controller.abort());
    res.status(HttpStatus.OK).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    const send = (event: string, data: unknown) => {
      if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('sources', plan.sources);
    try {
      for await (const text of this.rag.answer(plan, controller.signal)) send('token', { text });
      if (!controller.signal.aborted) send('done', {});
    } catch (error) {
      if (!controller.signal.aborted) {
        this.logger.warn(`chat stream failed: ${(error as Error).message}`);
        send('error', { code: ErrorCode.AiUnavailable, message: 'AI is unavailable' });
      }
    }
    res.end();
  }
}

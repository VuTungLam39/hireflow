import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Authenticated } from '../../common/decorators/permissions.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { dataScope } from '../../common/utils/department-scope.js';
import { QueryNotificationDto } from './dto/query-notification.dto.js';
import { NotificationsService } from './notifications.service.js';
import { type RealtimeEvent, RealtimeHub } from './realtime-hub.service.js';

export const SSE_HEARTBEAT_MS = 25_000;

// BR-ACC-04, BR-ACC-07
export function tokenExpiresAt(authorization: string | undefined): number | null {
  const payload = authorization?.split('.')[1];
  if (!payload) return null;
  const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp?: number };
  return typeof exp === 'number' ? exp * 1000 : null;
}

// F-NOTI-01, US-12
@ApiTags('Notifications')
@ApiBearerAuth()
@Authenticated()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly hub: RealtimeHub,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Thông báo của người đang đăng nhập, mới nhất trước (cursor)' })
  list(@CurrentUser() user: AuthUser, @Query() query: QueryNotificationDto) {
    return this.notifications.list(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Số thông báo chưa đọc' })
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { unreadCount: await this.notifications.unreadCount(user.id) };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
  @ResponseMessage('All notifications read')
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  @ResponseMessage('Notification read')
  read(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.notifications.markRead(id, user.id);
  }

  @Get('stream')
  @SkipThrottle()
  @ApiProduces('text/event-stream')
  @ApiOperation({
    summary:
      'Stream SSE: ready → notification (của mình) · application (đổi trạng thái/AI, theo phạm vi)',
  })
  async stream(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
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

    const unsubscribe = this.hub.subscribe((event) => {
      if (!visibleTo(event, user)) return;
      if (event.kind === 'notification') {
        send('notification', {
          notification: event.notification,
          unreadCount: event.unreadCount,
        });
      } else {
        const { kind: _kind, departmentId: _dept, ...data } = event;
        send('application', data);
      }
    });
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(': ping\n\n');
    }, SSE_HEARTBEAT_MS);
    // BR-ACC-04, BR-ACC-07
    const expiresAt = tokenExpiresAt(req.headers.authorization);
    const expiry = expiresAt && setTimeout(() => res.end(), Math.max(0, expiresAt - Date.now()));
    res.on('close', () => {
      clearInterval(heartbeat);
      if (expiry) clearTimeout(expiry);
      unsubscribe();
    });

    send('ready', { unreadCount: await this.notifications.unreadCount(user.id) });
  }
}

// BR-ACC-07, BR-TEN-03
export function visibleTo(
  event: RealtimeEvent,
  user: Pick<AuthUser, 'id' | 'role' | 'departmentId' | 'organizationId'>,
) {
  if (event.kind === 'notification') return event.userId === user.id;
  // BR-TEN-03
  if (event.organizationId !== user.organizationId) return false;
  const scope = dataScope(user.role);
  if (scope === 'all') return true;
  return scope === 'department' && event.departmentId === user.departmentId;
}

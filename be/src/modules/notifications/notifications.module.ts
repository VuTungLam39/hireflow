import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { RealtimeHub } from './realtime-hub.service.js';

// Kickoff 7.4: notifications (MVP 2)
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, RealtimeHub],
  exports: [NotificationsService, RealtimeHub],
})
export class NotificationsModule {}

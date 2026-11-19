import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { Offer } from './entities/offer.entity.js';
import { ApplicationOffersController, OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';

// MVP 3.1 · F-OFFER-01
@Module({
  imports: [TypeOrmModule.forFeature([Offer]), ApplicationsModule, NotificationsModule],
  controllers: [ApplicationOffersController, OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}

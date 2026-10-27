import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { InterviewAssignee } from './entities/interview-assignee.entity.js';
import { InterviewFeedback } from './entities/interview-feedback.entity.js';
import { Interview } from './entities/interview.entity.js';
import { ApplicationInterviewsController, InterviewsController } from './interviews.controller.js';
import { InterviewsService } from './interviews.service.js';

// Kickoff 7.4: interviews (MVP 2)
@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, InterviewAssignee, InterviewFeedback]),
    NotificationsModule,
  ],
  controllers: [InterviewsController, ApplicationInterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}

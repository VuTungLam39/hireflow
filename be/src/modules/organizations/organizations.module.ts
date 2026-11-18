import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module.js';
import { AuthToken } from '../auth/entities/auth-token.entity.js';
import { EmailModule } from '../email/email.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { User } from '../users/entities/user.entity.js';
import { EmployerRegistrationService } from './employer-registration.service.js';
import { EmployersController } from './employers.controller.js';
import { Organization } from './entities/organization.entity.js';
import { PlatformController } from './platform.controller.js';
import { PlatformOrganizationsService } from './platform-organizations.service.js';

// BR-TEN-01 · MVP 3 · US-19, US-20
@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, AuthToken]),
    EmailModule,
    JobsModule,
    AiModule,
  ],
  controllers: [EmployersController, PlatformController],
  providers: [EmployerRegistrationService, PlatformOrganizationsService],
  exports: [TypeOrmModule],
})
export class OrganizationsModule {}

import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { aiConfig, appConfig, databaseConfig, jwtConfig, validateEnv } from './config/index.js';
import { AiModule } from './modules/ai/ai.module.js';
import { ApplicationsModule } from './modules/applications/applications.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CandidatesModule } from './modules/candidates/candidates.module.js';
import { DepartmentsModule } from './modules/departments/departments.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { JobsModule } from './modules/jobs/jobs.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, databaseConfig, jwtConfig, aiConfig],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...config.getOrThrow<DataSourceOptions>('database'),
        // Tự đăng ký entity từ TypeOrmModule.forFeature() – không cần glob khi chạy app
        entities: [],
        autoLoadEntities: true,
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('app.throttle.ttl'),
          limit: config.getOrThrow<number>('app.throttle.limit'),
        },
      ],
    }),

    // Feature modules
    HealthModule,
    DepartmentsModule,
    UsersModule,
    AuthModule,
    JobsModule,
    CandidatesModule,
    FilesModule,
    ApplicationsModule,
    AiModule,
  ],
  providers: [
    // Guards chạy theo thứ tự đăng ký: rate limit -> xác thực JWT -> phân quyền
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },

    // Interceptors: đăng ký trước = bọc ngoài = xử lý response sau cùng.
    // TransformInterceptor phải chạy trước ClassSerializer để còn nhận ra PaginatedResult;
    // ClassSerializer sau đó loại bỏ các field @Exclude() (password...) trong response.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

import { INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { requestId } from './common/middleware/request-id.js';
import { createValidationPipe } from './common/utils/validation.util.js';

/**
 * Cấu hình dùng chung cho main.ts và e2e test,
 * để môi trường test giống hệt khi chạy thật.
 */
export function setupApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);

  // Gắn id trước mọi middleware khác để cả lỗi sớm (helmet, CORS) cũng có id trong log
  app.use(requestId);
  app.use(helmet());
  // Đọc cookie refresh token (httpOnly) cho /auth/refresh và /auth/logout
  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
    // FE đọc được id để người dùng báo lỗi kèm mã tra log
    exposedHeaders: ['X-Request-Id'],
  });

  // Route: /api/v1/...
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(createValidationPipe());
  app.enableShutdownHooks();
}

export function setupSwagger(app: INestApplication): void {
  const apiPrefix = app.get(ConfigService).get<string>('app.apiPrefix', 'api');

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('NCC Intern Project API')
      .setDescription('Tài liệu API backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

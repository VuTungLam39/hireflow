import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp, setupSwagger } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  setupApp(app);
  if (config.get('app.env') !== 'production') {
    setupSwagger(app);
  }

  const port = config.get<number>('app.port', 3000);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  await app.listen(port);

  logger.log(`Server running at http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
}
await bootstrap();

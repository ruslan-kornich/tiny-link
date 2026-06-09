import { NestFactory } from '@nestjs/core';
import { Application } from 'express';
import { ApiModule } from './api.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppLogger } from './common/logger/app-logger';
import { ConfigService } from './config/config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiModule, { logger: new AppLogger('api') });
  app.useGlobalFilters(new AllExceptionsFilter());

  // Behind a proxy/LB we must read the real client IP for per-IP rate limiting (ADR-0003).
  (app.getHttpAdapter().getInstance() as Application).set('trust proxy', true);

  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  await app.listen(config.get('PORT'));
}

void bootstrap();

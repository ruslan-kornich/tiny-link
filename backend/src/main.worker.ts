import { NestFactory } from '@nestjs/core';
import { AppLogger } from './common/logger/app-logger';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: new AppLogger('worker'),
  });
  app.enableShutdownHooks();
  // The worker has no HTTP server; consumer + rollup (plans 05/06) run via lifecycle hooks.
}

void bootstrap();

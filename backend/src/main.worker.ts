import { NestFactory } from '@nestjs/core';
import { AppLogger } from './common/logger/app-logger';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: new AppLogger('worker'),
  });
  // ClicksConsumer starts in onModuleInit; SIGTERM → onModuleDestroy flushes the buffer (NFR-5).
  app.enableShutdownHooks();
}

void bootstrap();

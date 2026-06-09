import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ClicksConsumerModule } from './modules/clicks/clicks-consumer.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule, ClicksConsumerModule],
})
export class WorkerModule {}

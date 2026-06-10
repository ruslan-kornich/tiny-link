import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ClicksConsumerModule } from './modules/clicks/clicks-consumer.module';
import { RollupModule } from './modules/rollup/rollup.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule, ClicksConsumerModule, RollupModule],
})
export class WorkerModule {}

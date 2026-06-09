import { Module } from '@nestjs/common';
import { ClicksConsumer } from './clicks.consumer';
import { ClicksRepository } from './clicks.repository';

@Module({
  providers: [ClicksConsumer, ClicksRepository],
  exports: [ClicksRepository],
})
export class ClicksConsumerModule {}

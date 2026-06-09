import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '../../config/config.service';
import { ClicksProducer } from './clicks.producer';
import { CLICKS_QUEUE, createClicksQueue } from './clicks.queue';

@Module({
  providers: [
    ClicksProducer,
    {
      provide: CLICKS_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createClicksQueue(config),
    },
  ],
  exports: [ClicksProducer],
})
export class ClicksModule implements OnModuleDestroy {
  constructor(@Inject(CLICKS_QUEUE) private readonly producerQueue: Queue) {}

  async onModuleDestroy(): Promise<void> {
    await this.producerQueue.close().catch(() => undefined);
  }
}

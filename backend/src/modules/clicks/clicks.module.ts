import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '../../config/config.service';
import { ClicksProducer } from './clicks.producer';
import { CLICKS_QUEUE, createClicksQueue } from './clicks.queue';

// Graceful close sends QUIT, which retries forever when Redis is down
// (maxRetriesPerRequest: null); bound it and force-disconnect instead.
const QUEUE_CLOSE_TIMEOUT_MS = 2_000;

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
    let closeTimer: NodeJS.Timeout | undefined;
    const timedOut = new Promise<'timeout'>((resolve) => {
      closeTimer = setTimeout(() => resolve('timeout'), QUEUE_CLOSE_TIMEOUT_MS);
    });
    try {
      const outcome = await Promise.race([
        this.producerQueue.close().catch(() => undefined),
        timedOut,
      ]);
      if (outcome === 'timeout') {
        // Not queue.disconnect(): it waits for an 'end' event ioredis never
        // emits when called between reconnect attempts. The raw client
        // disconnect is synchronous and clears the reconnect timer.
        const client = await this.producerQueue.client;
        client.disconnect();
      }
    } finally {
      clearTimeout(closeTimer);
    }
  }
}

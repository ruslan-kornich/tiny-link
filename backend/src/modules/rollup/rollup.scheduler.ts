import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '../../config/config.service';
import { RollupRepository } from './rollup.repository';

const ROLLUP_QUEUE_NAME = 'rollup';
const ROLLUP_JOB_NAME = 'rollup-tick';
const ROLLUP_REPEAT_JOB_ID = 'rollup-repeat';

@Injectable()
export class RollupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RollupScheduler.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly repository: RollupRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisConnection = { url: this.config.get('REDIS_URL'), maxRetriesPerRequest: null };

    this.queue = new Queue(ROLLUP_QUEUE_NAME, { connection: redisConnection });
    await this.queue.add(
      ROLLUP_JOB_NAME,
      {},
      {
        repeat: { every: this.config.get('ROLLUP_INTERVAL_MS') },
        jobId: ROLLUP_REPEAT_JOB_ID,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    this.worker = new Worker(ROLLUP_QUEUE_NAME, () => this.drain(), {
      connection: { url: this.config.get('REDIS_URL'), maxRetriesPerRequest: null },
      concurrency: 1,
    });
    this.worker.on('error', (error) => this.logger.error('rollup worker error', error.stack));
  }

  // Keep rolling bounded batches until a pass finds nothing new.
  private async drain(): Promise<void> {
    const batchSize = this.config.get('ROLLUP_BATCH');
    let processed = 0;
    do {
      const result = await this.repository.runOnce(batchSize);
      processed = result.processed;
    } while (processed > 0);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}

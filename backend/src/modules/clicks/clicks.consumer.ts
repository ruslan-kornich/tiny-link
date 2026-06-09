import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { setTimeout as delay } from 'node:timers/promises';
import { ConfigService } from '../../config/config.service';
import { ClickBatcher } from './click-batcher';
import { ClickEventInsert, normalizeClick } from './click-normalizer';
import { clickJobSchema } from './dto/click-job.schema';
import { ClicksRepository } from './clicks.repository';
import { CLICKS_QUEUE_NAME } from './clicks.queue';

const FLUSH_MAX_ATTEMPTS = 3;

@Injectable()
export class ClicksConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClicksConsumer.name);
  private readonly batcher: ClickBatcher<ClickEventInsert>;
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly repository: ClicksRepository,
  ) {
    this.batcher = new ClickBatcher<ClickEventInsert>(
      config.get('BATCH_SIZE'),
      config.get('BATCH_INTERVAL_MS'),
      (batch) => this.flush(batch),
    );
  }

  onModuleInit(): void {
    this.worker = new Worker(CLICKS_QUEUE_NAME, (job: Job) => this.handle(job), {
      connection: { url: this.config.get('REDIS_URL'), maxRetriesPerRequest: null },
      concurrency: this.config.get('CLICKS_CONCURRENCY'),
    });
    this.worker.on('error', (error) => this.logger.error('worker error', error.stack));
  }

  async handle(job: Job): Promise<void> {
    const parsed = clickJobSchema.safeParse(job.data);
    if (!parsed.success) {
      this.logger.warn(`dropping malformed click job ${job.id ?? '(no id)'}`);
      return;
    }
    await this.batcher.add(normalizeClick(parsed.data));
  }

  private async flush(batch: ClickEventInsert[]): Promise<void> {
    for (let attempt = 1; attempt <= FLUSH_MAX_ATTEMPTS; attempt += 1) {
      try {
        await this.repository.bulkInsert(batch);
        return;
      } catch (error) {
        this.logger.warn(`flush attempt ${attempt}/${FLUSH_MAX_ATTEMPTS} failed: ${describe(error)}`);
        if (attempt < FLUSH_MAX_ATTEMPTS) {
          await delay(50 * attempt);
        }
      }
    }
    this.logger.error(`dropping ${batch.length} buffered click events after ${FLUSH_MAX_ATTEMPTS} attempts`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.batcher.flush();
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

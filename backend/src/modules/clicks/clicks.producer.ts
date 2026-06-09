import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ClickJob } from './dto/click-job.schema';
import { CLICKS_JOB_NAME, CLICKS_QUEUE } from './clicks.queue';

@Injectable()
export class ClicksProducer {
  private readonly logger = new Logger(ClicksProducer.name);

  constructor(@Inject(CLICKS_QUEUE) private readonly queue: Queue) {}

  // Best-effort. The redirect must return whether or not the enqueue worked (NFR-2).
  async enqueue(job: ClickJob): Promise<void> {
    try {
      await this.queue.add(CLICKS_JOB_NAME, job, {
        jobId: job.jobId,
        removeOnComplete: true,
        removeOnFail: 1000,
      });
    } catch (error) {
      // Deliberate catch-and-continue: analytics is best-effort, the redirect still succeeds.
      this.logger.warn(`click enqueue failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }
}

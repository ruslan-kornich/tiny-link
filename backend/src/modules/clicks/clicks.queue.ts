import { Queue } from 'bullmq';
import { ConfigService } from '../../config/config.service';

export const CLICKS_QUEUE_NAME = 'clicks';
export const CLICKS_JOB_NAME = 'click';
export const CLICKS_QUEUE = Symbol('CLICKS_QUEUE');

export function createClicksQueue(config: ConfigService): Queue {
  return new Queue(CLICKS_QUEUE_NAME, {
    connection: { url: config.get('REDIS_URL'), maxRetriesPerRequest: null },
  });
}

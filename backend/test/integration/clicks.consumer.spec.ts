import { Job } from 'bullmq';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ClicksConsumer } from '../../src/modules/clicks/clicks.consumer';
import { ClicksRepository } from '../../src/modules/clicks/clicks.repository';
import { ConfigService } from '../../src/config/config.service';
import { ClickJob } from '../../src/modules/clicks/dto/click-job.schema';
import { startInfra, StartedInfra } from '../setup/testcontainers';

function jobOf(data: ClickJob): Job {
  return { id: data.jobId, data } as unknown as Job;
}

const JOB_ID_1 = '00000000-0000-0000-0000-000000000001';
const JOB_ID_2 = '00000000-0000-0000-0000-000000000002';

function clickJob(jobId: string, code: string): ClickJob {
  return {
    jobId,
    code,
    occurredAt: '2026-06-09T10:00:00.000Z',
    ip: '8.8.8.8',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
    referer: null,
  };
}

describe('ClicksConsumer graceful shutdown (AS-5)', () => {
  jest.setTimeout(30_000);

  let infra: StartedInfra;
  let prisma: PrismaService;
  let consumer: ClicksConsumer;
  let code: string;

  beforeAll(async () => {
    infra = await startInfra();
    process.env.DATABASE_URL = infra.databaseUrl;
    process.env.REDIS_URL = infra.redisUrl;
    prisma = new PrismaService();
    await prisma.onModuleInit();

    const user = await prisma.user.create({ data: { email: 'consumer@e.com', passwordHash: 'x' } });
    code = 'Cons01';
    await prisma.link.create({ data: { ownerId: user.id, code, longUrl: 'https://e.com' } });

    // BATCH_SIZE high + interval high so nothing auto-flushes; shutdown must do the flushing.
    const config = {
      get: (key: string) =>
        key === 'BATCH_SIZE' ? 1000 : key === 'BATCH_INTERVAL_MS' ? 600_000 : key === 'CLICKS_CONCURRENCY' ? 10 : '',
    } as unknown as ConfigService;
    consumer = new ClicksConsumer(config, new ClicksRepository(prisma));
  }, 120_000);

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await infra.stop();
  });

  it('flushes buffered events on shutdown instead of losing them', async () => {
    await consumer.handle(jobOf(clickJob(JOB_ID_1, code)));
    await consumer.handle(jobOf(clickJob(JOB_ID_2, code)));

    const before = await prisma.clickEvent.count({ where: { jobId: { in: [JOB_ID_1, JOB_ID_2] } } });
    expect(before).toBe(0); // still buffered, not yet flushed

    await consumer.onModuleDestroy(); // simulates SIGTERM

    const after = await prisma.clickEvent.count({ where: { jobId: { in: [JOB_ID_1, JOB_ID_2] } } });
    expect(after).toBe(2);
  });
});

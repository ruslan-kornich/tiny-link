import { PrismaService } from '../../src/prisma/prisma.service';
import { ClicksRepository } from '../../src/modules/clicks/clicks.repository';
import { ClickEventInsert } from '../../src/modules/clicks/click-normalizer';
import { startInfra, StartedInfra } from '../setup/testcontainers';

function event(jobId: string, code: string): ClickEventInsert {
  return {
    jobId,
    code,
    occurredAt: new Date('2026-06-09T10:00:00.000Z'),
    ip: '8.8.8.8',
    country: null,
    device: 'desktop',
    browser: 'chrome',
    refererHost: 't.co',
  };
}

describe('ClicksRepository', () => {
  jest.setTimeout(30_000);

  let infra: StartedInfra;
  let prisma: PrismaService;
  let repository: ClicksRepository;
  let code: string;

  beforeAll(async () => {
    infra = await startInfra();
    process.env.DATABASE_URL = infra.databaseUrl;
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new ClicksRepository(prisma);

    const user = await prisma.user.create({ data: { email: 'clicks@e.com', passwordHash: 'x' } });
    code = 'Code01';
    await prisma.link.create({ data: { ownerId: user.id, code, longUrl: 'https://e.com' } });
  }, 120_000);

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await infra.stop();
  });

  it('inserts a batch and is idempotent on redelivery (ON CONFLICT job_id)', async () => {
    const batch = [event('job-1', code), event('job-2', code), event('job-3', code)];

    const firstInsert = await repository.bulkInsert(batch);
    expect(firstInsert).toBe(3);

    const secondInsert = await repository.bulkInsert(batch); // redelivered, must be a no-op
    expect(secondInsert).toBe(0);

    const total = await prisma.clickEvent.count({ where: { jobId: { in: ['job-1', 'job-2', 'job-3'] } } });
    expect(total).toBe(3);
  });

  it('two overlapping batches (simulating two workers) never double-count', async () => {
    const batchA = [event('shared-1', code), event('only-a', code)];
    const batchB = [event('shared-1', code), event('only-b', code)];

    await Promise.all([repository.bulkInsert(batchA), repository.bulkInsert(batchB)]);

    const distinct = await prisma.clickEvent.count({
      where: { jobId: { in: ['shared-1', 'only-a', 'only-b'] } },
    });
    expect(distinct).toBe(3); // shared-1 counted once
  });

  it('skips events whose code has no matching link', async () => {
    const inserted = await repository.bulkInsert([event('orphan-1', 'NoSuch')]);
    expect(inserted).toBe(0);
  });

  it('returns 0 immediately for an empty batch', async () => {
    expect(await repository.bulkInsert([])).toBe(0);
  });
});

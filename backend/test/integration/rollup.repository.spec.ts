import { PrismaService } from '../../src/prisma/prisma.service';
import { RollupRepository } from '../../src/modules/rollup/rollup.repository';
import { startInfra, StartedInfra } from '../setup/testcontainers';

const DAY = new Date('2026-06-09T00:00:00.000Z');

describe('RollupRepository', () => {
  let infra: StartedInfra;
  let prisma: PrismaService;
  let repository: RollupRepository;
  let linkId: bigint;

  beforeAll(async () => {
    infra = await startInfra();
    process.env.DATABASE_URL = infra.databaseUrl;
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new RollupRepository(prisma);

    const user = await prisma.user.create({ data: { email: 'rollup@e.com', passwordHash: 'x' } });
    const link = await prisma.link.create({ data: { ownerId: user.id, code: 'Roll01', longUrl: 'https://e.com' } });
    linkId = link.id;
  }, 120_000);

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await infra.stop();
  });

  async function seedClicks(count: number, startJobId: number, ip: string, device: string): Promise<void> {
    await prisma.clickEvent.createMany({
      data: Array.from({ length: count }, (_unused, index) => ({
        linkId,
        jobId: `roll-${startJobId + index}`,
        occurredAt: DAY,
        day: DAY,
        ip,
        country: 'US',
        device,
        browser: 'chrome',
        refererHost: 't.co',
      })),
    });
  }

  it('aggregates new events exactly once and advances the cursor', async () => {
    await seedClicks(10, 0, '8.8.8.8', 'mobile');

    const firstRun = await repository.runOnce(5000);
    expect(firstRun.processed).toBe(10);

    const total = await prisma.rollupDaily.findFirst({
      where: { linkId, dimension: 'total', dimensionValue: '' },
    });
    expect(total?.clicks).toBe(10n);

    const byDevice = await prisma.rollupDaily.findFirst({
      where: { linkId, dimension: 'device', dimensionValue: 'mobile' },
    });
    expect(byDevice?.clicks).toBe(10n);
  });

  it('a second run with no new events is a no-op (no doubling, FR-RU3)', async () => {
    const secondRun = await repository.runOnce(5000);
    expect(secondRun.processed).toBe(0);

    const total = await prisma.rollupDaily.findFirst({
      where: { linkId, dimension: 'total', dimensionValue: '' },
    });
    expect(total?.clicks).toBe(10n); // unchanged
  });

  it('incrementally folds in newly arrived events', async () => {
    await seedClicks(4, 100, '9.9.9.9', 'desktop');

    const run = await repository.runOnce(5000);
    expect(run.processed).toBe(4);

    const total = await prisma.rollupDaily.findFirst({
      where: { linkId, dimension: 'total', dimensionValue: '' },
    });
    expect(total?.clicks).toBe(14n);

    const desktop = await prisma.rollupDaily.findFirst({
      where: { linkId, dimension: 'device', dimensionValue: 'desktop' },
    });
    expect(desktop?.clicks).toBe(4n);
  });

  it('two concurrent runs do not double-count (FOR UPDATE exclusivity, NFR-3)', async () => {
    await seedClicks(6, 200, '1.2.3.4', 'tablet');

    const [runA, runB] = await Promise.all([repository.runOnce(5000), repository.runOnce(5000)]);
    const processedTotal = runA.processed + runB.processed;
    expect(processedTotal).toBe(6); // the 6 new events are claimed exactly once across both runs

    const tablet = await prisma.rollupDaily.findFirst({
      where: { linkId, dimension: 'device', dimensionValue: 'tablet' },
    });
    expect(tablet?.clicks).toBe(6n);
  });

  it('reset + replay recomputes without doubling because we truncate first (ADR-0002)', async () => {
    await prisma.rollupDaily.deleteMany({ where: { linkId } });
    await repository.resetCursor();

    // 20 pending events drained with batch=7 must take exactly 3 passes (7 + 7 + 6).
    const BATCH_SIZE = 7;
    let result = await repository.runOnce(BATCH_SIZE);
    let processedAcrossRuns = result.processed;
    let passesWithWork = result.processed > 0 ? 1 : 0;
    while (result.processed > 0) {
      result = await repository.runOnce(BATCH_SIZE);
      processedAcrossRuns += result.processed;
      if (result.processed > 0) {
        passesWithWork += 1;
      }
    }

    expect(passesWithWork).toBe(3);

    const total = await prisma.rollupDaily.findFirst({
      where: { linkId, dimension: 'total', dimensionValue: '' },
    });
    expect(total?.clicks).toBe(20n); // 10 + 4 + 6 recomputed exactly
    expect(processedAcrossRuns).toBe(20);
  });
});

import { PrismaService } from '../../src/prisma/prisma.service';
import { startInfra, StartedInfra } from '../setup/testcontainers';

describe('PrismaService', () => {
  let infra: StartedInfra;
  let prisma: PrismaService;

  beforeAll(async () => {
    infra = await startInfra();
    process.env.DATABASE_URL = infra.databaseUrl;
    prisma = new PrismaService();
    await prisma.onModuleInit();
  }, 120_000);

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await infra.stop();
  });

  it('connects and runs a trivial query', async () => {
    const rows = await prisma.$queryRaw<{ one: number }[]>`SELECT 1 as one`;
    expect(rows[0]?.one).toBe(1);
  });

  it('has the seeded rollup_cursor row', async () => {
    const cursor = await prisma.rollupCursor.findUnique({ where: { id: 1 } });
    expect(cursor?.lastEventId).toBe(0n);
  });
});

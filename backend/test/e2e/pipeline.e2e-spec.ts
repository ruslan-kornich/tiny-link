import { INestApplication, INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { setTimeout as delay } from 'node:timers/promises';
import { ApiModule } from '../../src/api.module';
import { WorkerModule } from '../../src/worker.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { startInfra, StartedInfra } from '../setup/testcontainers';

describe('Full pipeline (e2e, AS-1)', () => {
  let api: INestApplication;
  let worker: INestApplicationContext;
  let infra: StartedInfra;

  beforeAll(async () => {
    infra = await startInfra();

    // Set shared env vars before compiling either module — ConfigService reads process.env at construction.
    process.env.DATABASE_URL = infra.databaseUrl;
    process.env.REDIS_URL = infra.redisUrl;
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.SHORT_URL_BASE = 'http://localhost:3000';
    process.env.REDIRECT_RATE_LIMIT = '100000'; // prevent rate-limiting across the 100-hit loop
    process.env.BATCH_SIZE = '10';
    process.env.BATCH_INTERVAL_MS = '200';
    process.env.ROLLUP_INTERVAL_MS = '500';

    process.env.ROLE = 'api';
    const apiRef = await Test.createTestingModule({ imports: [ApiModule] }).compile();
    api = apiRef.createNestApplication();
    api.useGlobalFilters(new AllExceptionsFilter());
    await api.init();

    // WorkerModule (ClicksConsumer + RollupScheduler) requires ROLE='worker'.
    // TestingModule extends NestApplicationContext, so it IS an INestApplicationContext.
    process.env.ROLE = 'worker';
    worker = await Test.createTestingModule({ imports: [WorkerModule] }).compile();
    await worker.init();
  }, 180_000);

  afterAll(async () => {
    // Graceful shutdown flushes any buffered clicks before the DB container stops (NFR-5).
    await worker.close();
    await api.close();
    await infra.stop();
  });

  it('persists and rolls up exactly 100 clicks for today', async () => {
    const credentials = { email: 'pipeline@e.com', password: 'password1' };
    await request(api.getHttpServer() as Server).post('/api/auth/register').send(credentials);
    const loginResponse = await request(api.getHttpServer() as Server).post('/api/auth/login').send(credentials);
    const loginBody = loginResponse.body as { accessToken: string };
    const authHeader = { Authorization: `Bearer ${loginBody.accessToken}` };

    const createResponse = await request(api.getHttpServer() as Server)
      .post('/api/links')
      .set(authHeader)
      .send({ url: 'https://example.com/pipeline' });
    const createBody = createResponse.body as { code: string };
    const code = createBody.code;

    for (let clickIndex = 0; clickIndex < 100; clickIndex += 1) {
      await request(api.getHttpServer() as Server).get(`/${code}`).redirects(0);
    }

    // Poll analytics until the rollup catches up (eventual consistency, FR-AN3).
    let totalClicks = 0;
    for (let attempt = 0; attempt < 40 && totalClicks < 100; attempt += 1) {
      await delay(500);
      const statsResponse = await request(api.getHttpServer() as Server)
        .get(`/api/links/${code}/stats`)
        .set(authHeader);
      const statsBody = statsResponse.body as { totals?: { clicks: number } };
      totalClicks = statsBody.totals?.clicks ?? 0;
    }

    expect(totalClicks).toBe(100);
  }, 60_000);
});

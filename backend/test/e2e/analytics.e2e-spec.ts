import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { ApiModule } from '../../src/api.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../../src/prisma/prisma.service';
import { startInfra, StartedInfra } from '../setup/testcontainers';

async function registerAndLogin(app: INestApplication, email: string): Promise<string> {
  const credentials = { email, password: 'password1' };
  await request(app.getHttpServer() as Server).post('/api/auth/register').send(credentials);
  const login = await request(app.getHttpServer() as Server).post('/api/auth/login').send(credentials);
  const loginBody = login.body as { accessToken: string };
  return loginBody.accessToken;
}

describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let infra: StartedInfra;
  let prisma: PrismaService;

  beforeAll(async () => {
    infra = await startInfra();
    process.env.ROLE = 'api';
    process.env.DATABASE_URL = infra.databaseUrl;
    process.env.REDIS_URL = infra.redisUrl;
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.SHORT_URL_BASE = 'http://localhost:3000';

    const moduleRef = await Test.createTestingModule({ imports: [ApiModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await infra.stop();
  });

  it('returns shaped stats from seeded rollups', async () => {
    const token = await registerAndLogin(app, 'analytics-owner@e.com');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set(auth)
      .send({ url: 'https://example.com/analytics' });
    const createdBody = created.body as { code: string };
    const code = createdBody.code;
    const link = await prisma.link.findUniqueOrThrow({ where: { code } });

    const day = new Date('2026-06-09T00:00:00.000Z');
    await prisma.rollupDaily.createMany({
      data: [
        { linkId: link.id, day, dimension: 'total', dimensionValue: '', clicks: 100n, uniqueIps: 80n },
        { linkId: link.id, day, dimension: 'country', dimensionValue: 'US', clicks: 70n, uniqueIps: 60n },
        { linkId: link.id, day, dimension: 'country', dimensionValue: 'DE', clicks: 30n, uniqueIps: 20n },
        { linkId: link.id, day, dimension: 'device', dimensionValue: 'mobile', clicks: 60n, uniqueIps: 50n },
        { linkId: link.id, day, dimension: 'referer', dimensionValue: '(direct)', clicks: 40n, uniqueIps: 35n },
      ],
    });

    const response = await request(app.getHttpServer() as Server)
      .get(`/api/links/${code}/stats?from=2026-06-09&to=2026-06-09`)
      .set(auth);

    expect(response.status).toBe(200);
    expect(response.body.totals).toEqual({ clicks: 100, uniqueIps: 80 });
    expect(response.body.byCountry).toEqual([
      { value: 'US', clicks: 70 },
      { value: 'DE', clicks: 30 },
    ]);
    expect(response.body.byReferer).toEqual([{ value: '(direct)', clicks: 40 }]);
  });

  it('returns 404 for a link owned by another user (AS-6)', async () => {
    const ownerToken = await registerAndLogin(app, 'a-owner@e.com');
    const otherToken = await registerAndLogin(app, 'a-other@e.com');

    const created = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set({ Authorization: `Bearer ${ownerToken}` })
      .send({ url: 'https://example.com/private-stats' });
    const createdBody = created.body as { code: string };
    const code = createdBody.code;

    const response = await request(app.getHttpServer() as Server)
      .get(`/api/links/${code}/stats`)
      .set({ Authorization: `Bearer ${otherToken}` });
    expect(response.status).toBe(404);
  });

  it('rejects an inverted date range with 400', async () => {
    const token = await registerAndLogin(app, 'a-range@e.com');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set(auth)
      .send({ url: 'https://example.com/range' });
    const createdBody = created.body as { code: string };
    const code = createdBody.code;

    const response = await request(app.getHttpServer() as Server)
      .get(`/api/links/${code}/stats?from=2026-06-09&to=2026-06-01`)
      .set(auth);
    expect(response.status).toBe(400);
  });
});

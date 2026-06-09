import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import { Application } from 'express';
import request from 'supertest';
import { ApiModule } from '../../src/api.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { startInfra, StartedInfra } from '../setup/testcontainers';

async function createLink(app: INestApplication, url: string): Promise<string> {
  const credentials = { email: `u${Math.floor(performance.now())}@e.com`, password: 'password1' };
  await request(app.getHttpServer() as Server).post('/api/auth/register').send(credentials);
  const login = await request(app.getHttpServer() as Server).post('/api/auth/login').send(credentials);
  const loginBody = login.body as { accessToken: string };
  const created = await request(app.getHttpServer() as Server)
    .post('/api/links')
    .set({ Authorization: `Bearer ${loginBody.accessToken}` })
    .send({ url });
  const createdBody = created.body as { code: string };
  return createdBody.code;
}

describe('Redirect (e2e)', () => {
  let app: INestApplication;
  let infra: StartedInfra;

  beforeAll(async () => {
    infra = await startInfra();
    process.env.ROLE = 'api';
    process.env.DATABASE_URL = infra.databaseUrl;
    process.env.REDIS_URL = infra.redisUrl;
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.SHORT_URL_BASE = 'http://localhost:3000';
    process.env.REDIRECT_RATE_LIMIT = '3'; // small limit so AS-2 is easy to trip

    const moduleRef = await Test.createTestingModule({ imports: [ApiModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    // Behind a proxy/LB we must read the real client IP for per-IP rate limiting (ADR-0003).
    (app.getHttpAdapter().getInstance() as Application).set('trust proxy', true);
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await infra.stop();
  });

  it('redirects 302 to the long URL', async () => {
    const code = await createLink(app, 'https://example.com/dest');
    const response = await request(app.getHttpServer() as Server).get(`/${code}`).redirects(0);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://example.com/dest');
  });

  it('returns 404 for an unknown code', async () => {
    const response = await request(app.getHttpServer() as Server).get('/doesNotExist').redirects(0);
    expect(response.status).toBe(404);
  });

  it('returns 410 for a deactivated link', async () => {
    const credentials = { email: 'gone@e.com', password: 'password1' };
    await request(app.getHttpServer() as Server).post('/api/auth/register').send(credentials);
    const login = await request(app.getHttpServer() as Server).post('/api/auth/login').send(credentials);
    const loginBody = login.body as { accessToken: string };
    const auth = { Authorization: `Bearer ${loginBody.accessToken}` };
    const created = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set(auth)
      .send({ url: 'https://x.com' });
    const code = (created.body as { code: string }).code;
    await request(app.getHttpServer() as Server).post(`/api/links/${code}/deactivate`).set(auth);

    const response = await request(app.getHttpServer() as Server).get(`/${code}`).redirects(0);
    expect(response.status).toBe(410);
  });

  it('rate-limits with 429 + Retry-After past the limit (AS-2)', async () => {
    const code = await createLink(app, 'https://example.com/rl');
    const ip = '203.0.113.7';
    const hit = () => request(app.getHttpServer() as Server).get(`/${code}`).set('X-Forwarded-For', ip).redirects(0);

    expect((await hit()).status).toBe(302);
    expect((await hit()).status).toBe(302);
    expect((await hit()).status).toBe(302);
    const limited = await hit();
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();
  });
});

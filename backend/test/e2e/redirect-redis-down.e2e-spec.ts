import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { ApiModule } from '../../src/api.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { startInfra, StartedInfra } from '../setup/testcontainers';

describe('Redirect with Redis down (e2e, AS-3)', () => {
  let app: INestApplication;
  let infra: StartedInfra;
  let code: string;

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

    const credentials = { email: 'as3@e.com', password: 'password1' };
    await request(app.getHttpServer() as Server).post('/api/auth/register').send(credentials);
    const login = await request(app.getHttpServer() as Server).post('/api/auth/login').send(credentials);
    const loginBody = login.body as { accessToken: string };
    const created = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set({ Authorization: `Bearer ${loginBody.accessToken}` })
      .send({ url: 'https://example.com/resilient' });
    code = (created.body as { code: string }).code;
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await infra.stop();
  });

  it('still redirects 302 after Redis is stopped (analytics dropped, redirect survives)', async () => {
    await infra.redis.stop(); // cache miss + enqueue fail + rate-limit fail-open all exercised
    const response = await request(app.getHttpServer() as Server).get(`/${code}`).redirects(0);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://example.com/resilient');
  });
});

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { ApiModule } from '../../src/api.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { startInfra, StartedInfra } from '../setup/testcontainers';

describe('GET /healthz (e2e)', () => {
  let app: INestApplication;
  let infra: StartedInfra;

  beforeAll(async () => {
    infra = await startInfra();
    // ConfigService validates the whole env at construction, so provide every
    // required key (not just db/redis) before ApiModule is compiled.
    process.env.ROLE = 'api';
    process.env.SHORT_URL_BASE = 'http://localhost:3000';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.DATABASE_URL = infra.databaseUrl;
    process.env.REDIS_URL = infra.redisUrl;

    const moduleRef = await Test.createTestingModule({ imports: [ApiModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await infra.stop();
  });

  it('reports ok when db and redis are up', async () => {
    const response = await request(app.getHttpServer() as Server).get('/healthz');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', db: 'up', redis: 'up' });
  });
});

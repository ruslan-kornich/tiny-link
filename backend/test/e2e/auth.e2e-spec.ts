import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { ApiModule } from '../../src/api.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { startInfra, StartedInfra } from '../setup/testcontainers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let infra: StartedInfra;

  beforeAll(async () => {
    infra = await startInfra();
    process.env.ROLE = 'api';
    process.env.SHORT_URL_BASE = 'http://localhost:3000';
    process.env.DATABASE_URL = infra.databaseUrl;
    process.env.REDIS_URL = infra.redisUrl;
    process.env.JWT_SECRET = 'x'.repeat(32);

    const moduleRef = await Test.createTestingModule({ imports: [ApiModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await infra.stop();
  });

  it('registers, rejects duplicate, logs in, rejects bad password', async () => {
    const credentials = { email: 'owner@example.com', password: 'password1' };

    const registered = await request(app.getHttpServer() as Server)
      .post('/api/auth/register')
      .send(credentials);
    expect(registered.status).toBe(201);
    const registeredBody = registered.body as { id: number; email: string };
    expect(typeof registeredBody.id).toBe('number');
    expect(registeredBody.email).toBe('owner@example.com');

    const duplicate = await request(app.getHttpServer() as Server)
      .post('/api/auth/register')
      .send(credentials);
    expect(duplicate.status).toBe(409);

    const loggedIn = await request(app.getHttpServer() as Server)
      .post('/api/auth/login')
      .send(credentials);
    expect(loggedIn.status).toBe(200);
    const loginBody = loggedIn.body as { accessToken: string; expiresIn: number };
    expect(typeof loginBody.accessToken).toBe('string');

    const wrong = await request(app.getHttpServer() as Server)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-pass' });
    expect(wrong.status).toBe(401);
  });

  it('rejects weak input with 400', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123' });
    expect(response.status).toBe(400);
  });
});

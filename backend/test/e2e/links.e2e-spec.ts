import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { ApiModule } from '../../src/api.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { startInfra, StartedInfra } from '../setup/testcontainers';

async function tokenFor(app: INestApplication, email: string): Promise<string> {
  const credentials = { email, password: 'password1' };
  await request(app.getHttpServer() as Server).post('/api/auth/register').send(credentials);
  const login = await request(app.getHttpServer() as Server).post('/api/auth/login').send(credentials);
  const loginBody = login.body as { accessToken: string };
  return loginBody.accessToken;
}

describe('Links (e2e)', () => {
  let app: INestApplication;
  let infra: StartedInfra;

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
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await infra.stop();
  });

  it('creates, fetches, lists, and deactivates a link', async () => {
    const token = await tokenFor(app, 'owner1@example.com');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set(auth)
      .send({ url: 'https://example.com/long/path' });
    expect(created.status).toBe(201);
    const createdBody = created.body as { code: string; shortUrl: string };
    expect(createdBody.code).toHaveLength(6);
    expect(createdBody.shortUrl).toBe(`http://localhost:3000/${createdBody.code}`);

    const code = createdBody.code;

    const fetched = await request(app.getHttpServer() as Server).get(`/api/links/${code}`).set(auth);
    expect(fetched.status).toBe(200);
    const fetchedBody = fetched.body as { longUrl: string };
    expect(fetchedBody.longUrl).toBe('https://example.com/long/path');

    const listed = await request(app.getHttpServer() as Server).get('/api/links?limit=20').set(auth);
    expect(listed.status).toBe(200);
    const listedBody = listed.body as { items: { code: string }[] };
    expect(listedBody.items.some((item) => item.code === code)).toBe(true);

    const deactivated = await request(app.getHttpServer() as Server)
      .post(`/api/links/${code}/deactivate`)
      .set(auth);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body).toEqual({ code, active: false });
  });

  it('returns 404 when another user fetches the link (FR-A4)', async () => {
    const ownerToken = await tokenFor(app, 'owner2@example.com');
    const otherToken = await tokenFor(app, 'other2@example.com');

    const created = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set({ Authorization: `Bearer ${ownerToken}` })
      .send({ url: 'https://example.com/secret' });
    const createdBody = created.body as { code: string };
    const code = createdBody.code;

    const response = await request(app.getHttpServer() as Server)
      .get(`/api/links/${code}`)
      .set({ Authorization: `Bearer ${otherToken}` });
    expect(response.status).toBe(404);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app.getHttpServer() as Server).get('/api/links');
    expect(response.status).toBe(401);
  });

  it('rejects a non-http URL with 400', async () => {
    const token = await tokenFor(app, 'owner3@example.com');
    const response = await request(app.getHttpServer() as Server)
      .post('/api/links')
      .set({ Authorization: `Bearer ${token}` })
      .send({ url: 'ftp://example.com' });
    expect(response.status).toBe(400);
  });
});

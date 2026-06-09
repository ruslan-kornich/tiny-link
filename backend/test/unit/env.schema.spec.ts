import { envSchema } from '../../src/config/env.schema';

const validEnv = {
  ROLE: 'api',
  PORT: '3000',
  SHORT_URL_BASE: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'x'.repeat(32),
  JWT_EXPIRES_IN: '3600',
  CODE_LENGTH: '6',
  CODE_MAX_RETRIES: '3',
  CLICKS_CONCURRENCY: '10',
  BATCH_SIZE: '100',
  BATCH_INTERVAL_MS: '1000',
  ROLLUP_INTERVAL_MS: '10000',
  ROLLUP_BATCH: '5000',
  REDIRECT_RATE_LIMIT: '60',
  REDIRECT_RATE_WINDOW_MS: '60000',
  REDIRECT_CACHE_TTL_MS: '30000',
};

describe('envSchema', () => {
  it('coerces numeric strings to numbers', () => {
    const parsed = envSchema.parse(validEnv);
    expect(parsed.PORT).toBe(3000);
    expect(parsed.CODE_LENGTH).toBe(6);
  });

  it('rejects a JWT secret shorter than 32 chars', () => {
    expect(() => envSchema.parse({ ...validEnv, JWT_SECRET: 'short' })).toThrow();
  });

  it('rejects an invalid ROLE', () => {
    expect(() => envSchema.parse({ ...validEnv, ROLE: 'nope' })).toThrow();
  });
});

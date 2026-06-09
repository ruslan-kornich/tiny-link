import { ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitGuard } from '../../src/modules/redirect/rate-limit.guard';
import { ConfigService } from '../../src/config/config.service';

type FakeRedis = {
  incr: (key: string) => Promise<number>;
  pexpire: (key: string, ms: number) => Promise<number>;
  pttl: (key: string) => Promise<number>;
};

function context(ip: string, setHeader: (name: string, value: string) => void): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
      getResponse: () => ({ setHeader }),
    }),
  } as unknown as ExecutionContext;
}

const config = {
  get: (key: string) => (key === 'REDIRECT_RATE_LIMIT' ? 2 : key === 'REDIRECT_RATE_WINDOW_MS' ? 60000 : ''),
} as unknown as ConfigService;

describe('RateLimitGuard', () => {
  it('allows requests up to the limit', async () => {
    let count = 0;
    const redis: FakeRedis = {
      incr: () => Promise.resolve((count += 1)),
      pexpire: () => Promise.resolve(1),
      pttl: () => Promise.resolve(60000),
    };
    const guard = new RateLimitGuard(redis as never, config);
    await expect(guard.canActivate(context('1.1.1.1', () => undefined))).resolves.toBe(true);
    await expect(guard.canActivate(context('1.1.1.1', () => undefined))).resolves.toBe(true);
  });

  it('rejects over the limit with 429 and sets Retry-After', async () => {
    let count = 2;
    const headers: Record<string, string> = {};
    const redis: FakeRedis = {
      incr: () => Promise.resolve((count += 1)),
      pexpire: () => Promise.resolve(1),
      pttl: () => Promise.resolve(30000),
    };
    const guard = new RateLimitGuard(redis as never, config);
    await expect(
      guard.canActivate(context('1.1.1.1', (name, value) => (headers[name] = value))),
    ).rejects.toBeInstanceOf(HttpException);
    expect(headers['Retry-After']).toBe('30');
  });

  it('fails open when Redis errors (NFR-2 / AS-3)', async () => {
    const redis: FakeRedis = {
      incr: () => Promise.reject(new Error('redis down')),
      pexpire: () => Promise.resolve(1),
      pttl: () => Promise.resolve(-1),
    };
    const guard = new RateLimitGuard(redis as never, config);
    await expect(guard.canActivate(context('1.1.1.1', () => undefined))).resolves.toBe(true);
  });
});

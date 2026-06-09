import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../../config/config.service';
import { LinkResolution } from '../links/links.service';
import { REDIS_CLIENT } from '../../redis/redis.constants';

@Injectable()
export class RedirectCache {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async get(code: string): Promise<LinkResolution | null> {
    try {
      const raw = await this.redis.get(this.key(code));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as LinkResolution;
    } catch {
      return null; // Redis down → treat as a miss, fall back to DB (NFR-2)
    }
  }

  async set(code: string, resolution: LinkResolution): Promise<void> {
    try {
      await this.redis.set(this.key(code), JSON.stringify(resolution), 'PX', this.config.get('REDIRECT_CACHE_TTL_MS'));
    } catch {
      // best-effort; a failed cache write just means the next hit re-reads the DB
    }
  }

  private key(code: string): string {
    return `redirect:${code}`;
  }
}

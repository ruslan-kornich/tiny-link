import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Request, Response } from 'express';
import { ConfigService } from '../../config/config.service';
import { REDIS_CLIENT } from '../../redis/redis.constants';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const ip = request.ip ?? 'unknown';
    const limit = this.config.get('REDIRECT_RATE_LIMIT');
    const windowMs = this.config.get('REDIRECT_RATE_WINDOW_MS');
    const key = `ratelimit:redirect:${ip}`;

    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.pexpire(key, windowMs);
      }
      if (count > limit) {
        const ttl = await this.redis.pttl(key);
        const retryAfterSeconds = Math.ceil((ttl > 0 ? ttl : windowMs) / 1000);
        response.setHeader('Retry-After', String(retryAfterSeconds));
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Redis unavailable → fail open so legitimate redirects keep working (NFR-2, AS-3).
      return true;
    }
  }
}

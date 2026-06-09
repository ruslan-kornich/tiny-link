import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';

export type HealthReport = { status: 'ok' | 'degraded'; db: 'up' | 'down'; redis: 'up' | 'down' };

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async check(): Promise<HealthReport> {
    const db = await this.pingDb();
    const redis = await this.pingRedis();
    const status = db === 'up' && redis === 'up' ? 'ok' : 'degraded';
    return { status, db, redis };
  }

  private async pingDb(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async pingRedis(): Promise<'up' | 'down'> {
    const client = new Redis(this.config.get('REDIS_URL'), { lazyConnect: true, maxRetriesPerRequest: 1 });
    try {
      await client.connect();
      await client.ping();
      return 'up';
    } catch {
      return 'down';
    } finally {
      client.disconnect();
    }
  }
}

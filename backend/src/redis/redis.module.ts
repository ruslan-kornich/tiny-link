import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis =>
        new Redis(config.get('REDIS_URL'), {
          // Fail fast when Redis is down so the redirect falls back instead of hanging (NFR-2).
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: false,
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleDestroy(): Promise<void> {
    const client = this.moduleRef.get<Redis>(REDIS_CLIENT, { strict: false });
    // If Redis is down, quit() rejects but the client keeps reconnecting
    // forever; disconnect() stops the retry loop so the process can exit.
    await client.quit().catch(() => client.disconnect());
  }
}

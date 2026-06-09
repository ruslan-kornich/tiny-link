import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClicksModule } from './modules/clicks/clicks.module';
import { LinksModule } from './modules/links/links.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    LinksModule,
    ClicksModule,
    RedirectModule, // keep last: its root ":code" route must not shadow /healthz or /api/*
  ],
})
export class ApiModule {}

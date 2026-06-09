import { Module } from '@nestjs/common';
import { ClicksModule } from '../clicks/clicks.module';
import { LinksModule } from '../links/links.module';
import { RateLimitGuard } from './rate-limit.guard';
import { RedirectCache } from './redirect-cache';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';

@Module({
  imports: [LinksModule, ClicksModule],
  controllers: [RedirectController],
  providers: [RedirectService, RedirectCache, RateLimitGuard],
})
export class RedirectModule {}

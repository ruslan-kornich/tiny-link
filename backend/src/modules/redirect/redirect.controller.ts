import { Controller, Get, GoneException, NotFoundException, Param, Redirect, Req, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Request } from 'express';
import { ClicksProducer } from '../clicks/clicks.producer';
import { RateLimitGuard } from './rate-limit.guard';
import { RedirectService } from './redirect.service';

@Controller()
export class RedirectController {
  constructor(
    private readonly redirectService: RedirectService,
    private readonly clicksProducer: ClicksProducer,
  ) {}

  @Get(':code')
  @UseGuards(RateLimitGuard)
  @Redirect()
  async redirect(@Param('code') code: string, @Req() request: Request): Promise<{ url: string; statusCode: number }> {
    const resolution = await this.redirectService.resolve(code);

    if (resolution.status === 'not_found') {
      throw new NotFoundException('Link not found');
    }
    if (resolution.status === 'gone') {
      throw new GoneException('Link has been deactivated');
    }

    // Fire-and-forget: the producer swallows failures, so this never blocks/breaks the redirect (NFR-2).
    void this.clicksProducer.enqueue({
      jobId: randomUUID(),
      code,
      occurredAt: new Date().toISOString(),
      ip: request.ip ?? 'unknown',
      userAgent: request.headers['user-agent'] ?? '',
      referer: [request.headers['referer'] ?? request.headers['referrer']].flat()[0] ?? null,
    });

    return { url: resolution.longUrl, statusCode: 302 }; // 302 not 301 so clicks keep flowing (ADR-0003)
  }
}

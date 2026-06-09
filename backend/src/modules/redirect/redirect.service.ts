import { Injectable } from '@nestjs/common';
import { LinksService } from '../links/links.service';
import { RedirectCache } from './redirect-cache';

export type RedirectResolution =
  | { status: 'ok'; longUrl: string }
  | { status: 'not_found' }
  | { status: 'gone' };

@Injectable()
export class RedirectService {
  constructor(
    private readonly cache: RedirectCache,
    private readonly linksService: LinksService,
  ) {}

  async resolve(code: string): Promise<RedirectResolution> {
    const cached = await this.cache.get(code);
    if (cached) {
      return cached.active ? { status: 'ok', longUrl: cached.longUrl } : { status: 'gone' };
    }

    const link = await this.linksService.resolveForRedirect(code);
    if (!link) {
      return { status: 'not_found' };
    }
    await this.cache.set(code, link);
    return link.active ? { status: 'ok', longUrl: link.longUrl } : { status: 'gone' };
  }
}

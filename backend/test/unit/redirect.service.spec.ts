import { RedirectService, RedirectResolution } from '../../src/modules/redirect/redirect.service';
import { RedirectCache } from '../../src/modules/redirect/redirect-cache';
import { LinksService, LinkResolution } from '../../src/modules/links/links.service';

function build(cacheValue: LinkResolution | null, dbValue: LinkResolution | null) {
  const sets: Array<{ code: string; value: LinkResolution }> = [];
  const cache: Partial<RedirectCache> = {
    get: async () => cacheValue,
    set: async (code, value) => {
      sets.push({ code, value });
    },
  };
  const links: Partial<LinksService> = { resolveForRedirect: async () => dbValue };
  const service = new RedirectService(cache as RedirectCache, links as LinksService);
  return { service, sets };
}

describe('RedirectService', () => {
  it('returns ok from a cache hit without touching the DB', async () => {
    const { service } = build({ longUrl: 'https://a.com', active: true }, null);
    const result = await service.resolve('abc');
    expect(result).toEqual<RedirectResolution>({ status: 'ok', longUrl: 'https://a.com' });
  });

  it('falls back to the DB on a miss and populates the cache', async () => {
    const { service, sets } = build(null, { longUrl: 'https://b.com', active: true });
    const result = await service.resolve('abc');
    expect(result).toEqual<RedirectResolution>({ status: 'ok', longUrl: 'https://b.com' });
    expect(sets).toHaveLength(1);
  });

  it('returns not_found for an unknown code', async () => {
    const { service } = build(null, null);
    expect(await service.resolve('nope')).toEqual<RedirectResolution>({ status: 'not_found' });
  });

  it('returns gone for a deactivated link', async () => {
    const { service } = build({ longUrl: 'https://c.com', active: false }, null);
    expect(await service.resolve('abc')).toEqual<RedirectResolution>({ status: 'gone' });
  });
});

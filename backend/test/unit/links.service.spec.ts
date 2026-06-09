import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LinksService } from '../../src/modules/links/links.service';
import { LinksRepository } from '../../src/modules/links/links.repository';
import { ConfigService } from '../../src/config/config.service';
import { LinkRow } from '../../src/modules/links/link.mapper';

const config = {
  get: (key: string) =>
    key === 'SHORT_URL_BASE'
      ? 'http://localhost:3000'
      : key === 'CODE_LENGTH'
        ? 6
        : key === 'CODE_MAX_RETRIES'
          ? 3
          : '',
} as unknown as ConfigService;

function row(overrides: Partial<LinkRow> = {}): LinkRow {
  return {
    id: 1n,
    code: 'Ab3xK9',
    longUrl: 'https://example.com',
    active: true,
    createdAt: new Date('2026-06-09T10:00:00Z'),
    ...overrides,
  };
}

function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' });
}

describe('LinksService', () => {
  it('retries on a code collision then succeeds', async () => {
    let attempts = 0;
    const repo: Partial<LinksRepository> = {
      insert: () => {
        attempts += 1;
        if (attempts === 1) {
          return Promise.reject(uniqueViolation());
        }
        return Promise.resolve(row());
      },
      isUniqueViolation: (error) => error instanceof Prisma.PrismaClientKnownRequestError,
    };
    const service = new LinksService(repo as LinksRepository, config);
    const result = await service.create(7n, { url: 'https://example.com' });
    expect(attempts).toBe(2);
    expect(result.code).toBe('Ab3xK9');
  });

  it('throws 404 when fetching a link the caller does not own', async () => {
    const repo: Partial<LinksRepository> = { findOwnedByCode: () => Promise.resolve(null) };
    const service = new LinksService(repo as LinksRepository, config);
    await expect(service.getByCode(7n, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 500 after exhausting all retries on persistent collisions', async () => {
    let attempts = 0;
    const repo: Partial<LinksRepository> = {
      insert: () => {
        attempts += 1;
        return Promise.reject(uniqueViolation());
      },
      isUniqueViolation: (error) => error instanceof Prisma.PrismaClientKnownRequestError,
    };
    const service = new LinksService(repo as LinksRepository, config);
    await expect(service.create(7n, { url: 'https://example.com' })).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(attempts).toBe(3); // CODE_MAX_RETRIES from the mocked config
  });

  it('returns nextCursor only when there is an extra page', async () => {
    const repo: Partial<LinksRepository> = {
      listOwned: () => Promise.resolve([row({ id: 3n }), row({ id: 2n })]),
    };
    const service = new LinksService(repo as LinksRepository, config);
    const page = await service.list(7n, { limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
  });
});

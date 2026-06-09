import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LinkRow } from './link.mapper';

const LINK_SELECT = {
  id: true,
  code: true,
  longUrl: true,
  active: true,
  createdAt: true,
} as const;

export const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class LinksRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Throws Prisma P2002 on code collision; the service catches and retries (ADR-0001).
  async insert(ownerId: bigint, code: string, longUrl: string): Promise<LinkRow> {
    return this.prisma.link.create({
      data: { ownerId, code, longUrl },
      select: LINK_SELECT,
    });
  }

  isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION;
  }

  async findOwnedByCode(ownerId: bigint, code: string): Promise<LinkRow | null> {
    return this.prisma.link.findFirst({
      where: { code, ownerId },
      select: LINK_SELECT,
    });
  }

  async listOwned(ownerId: bigint, limit: number, afterId: bigint | null): Promise<LinkRow[]> {
    return this.prisma.link.findMany({
      where: { ownerId, ...(afterId !== null ? { id: { lt: afterId } } : {}) },
      orderBy: { id: 'desc' },
      take: limit + 1, // fetch one extra to know if there is a next page
      select: LINK_SELECT,
    });
  }

  // Public, NOT owner-scoped: the redirect resolves any code regardless of caller.
  async findByCodePublic(code: string): Promise<{ longUrl: string; active: boolean } | null> {
    return this.prisma.link.findUnique({
      where: { code },
      select: { longUrl: true, active: true },
    });
  }

  async deactivateOwned(ownerId: bigint, code: string): Promise<LinkRow | null> {
    const result = await this.prisma.link.updateMany({
      where: { code, ownerId },
      data: { active: false },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findOwnedByCode(ownerId, code);
  }
}

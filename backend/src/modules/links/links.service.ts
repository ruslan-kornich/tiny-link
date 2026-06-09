import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { decodeCursor, encodeCursor, ListLinksDto } from './dto/list-links.dto';
import { LinkResponse, toLinkResponse } from './link.mapper';
import { LinksRepository } from './links.repository';
import { generateShortCode } from './short-code';

export type LinkPage = { items: LinkResponse[]; nextCursor: string | null };
export type DeactivateResult = { code: string; active: false };
export type LinkResolution = { longUrl: string; active: boolean };

@Injectable()
export class LinksService {
  constructor(
    private readonly repository: LinksRepository,
    private readonly config: ConfigService,
  ) {}

  async create(ownerId: bigint, dto: CreateLinkDto): Promise<LinkResponse> {
    const length = this.config.get('CODE_LENGTH');
    const maxRetries = this.config.get('CODE_MAX_RETRIES');

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      const code = generateShortCode(length);
      try {
        const created = await this.repository.insert(ownerId, code, dto.url);
        return toLinkResponse(created, this.config);
      } catch (error) {
        if (this.repository.isUniqueViolation(error)) {
          continue; // astronomically rare collision — try a fresh code
        }
        throw error;
      }
    }
    throw new InternalServerErrorException('Could not allocate a unique short code');
  }

  async getByCode(ownerId: bigint, code: string): Promise<LinkResponse> {
    const link = await this.repository.findOwnedByCode(ownerId, code);
    if (!link) {
      throw new NotFoundException('Link not found'); // 404 not 403 — do not leak existence (FR-A4)
    }
    return toLinkResponse(link, this.config);
  }

  async list(ownerId: bigint, dto: ListLinksDto): Promise<LinkPage> {
    const afterId = decodeCursor(dto.cursor);
    const rows = await this.repository.listOwned(ownerId, dto.limit, afterId);

    const hasMore = rows.length > dto.limit;
    const pageRows = hasMore ? rows.slice(0, dto.limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor = hasMore && lastRow ? encodeCursor(lastRow.id) : null;

    return {
      items: pageRows.map((linkRow) => toLinkResponse(linkRow, this.config)),
      nextCursor,
    };
  }

  // Used by RedirectService (service -> service). Returns null for an unknown code.
  async resolveForRedirect(code: string): Promise<LinkResolution | null> {
    return this.repository.findByCodePublic(code);
  }

  async deactivate(ownerId: bigint, code: string): Promise<DeactivateResult> {
    const updated = await this.repository.deactivateOwned(ownerId, code);
    if (!updated) {
      throw new NotFoundException('Link not found');
    }
    return { code: updated.code, active: false };
  }
}

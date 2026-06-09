import { ConfigService } from '../../config/config.service';

export type LinkRow = {
  id: bigint;
  code: string;
  longUrl: string;
  active: boolean;
  createdAt: Date;
};

export type LinkResponse = {
  code: string;
  shortUrl: string;
  longUrl: string;
  active: boolean;
  createdAt: string;
};

export function toLinkResponse(row: LinkRow, config: ConfigService): LinkResponse {
  return {
    code: row.code,
    shortUrl: `${config.get('SHORT_URL_BASE')}/${row.code}`,
    longUrl: row.longUrl,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

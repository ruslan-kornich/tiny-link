export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface RegisteredUser {
  id: number;
  email: string;
}

export interface LinkResponse {
  code: string;
  shortUrl: string;
  longUrl: string;
  active: boolean;
  createdAt: string;
}

export interface LinkListResponse {
  items: LinkResponse[];
  nextCursor: string | null;
}

export interface DailyPoint {
  day: string;
  clicks: number;
  uniqueIps: number;
}

export interface BreakdownEntry {
  value: string;
  clicks: number;
}

export interface LinkStatsResponse {
  code: string;
  range: { from: string; to: string };
  totals: { clicks: number; uniqueIps: number };
  daily: DailyPoint[];
  byCountry: BreakdownEntry[];
  byDevice: BreakdownEntry[];
  byBrowser: BreakdownEntry[];
  byReferer: BreakdownEntry[];
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

import { UAParser } from 'ua-parser-js';
import { ClickJob } from './dto/click-job.schema';

export type ClickEventInsert = {
  jobId: string;
  code: string;
  occurredAt: Date;
  ip: string;
  country: string | null;
  device: string;
  browser: string;
  refererHost: string | null;
};

const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview/i;

export function normalizeClick(job: ClickJob): ClickEventInsert {
  const parser = new UAParser(job.userAgent);
  return {
    jobId: job.jobId,
    code: job.code,
    occurredAt: new Date(job.occurredAt),
    ip: job.ip,
    country: resolveCountry(job.ip),
    device: parseDevice(job.userAgent, parser),
    browser: parser.getBrowser().name?.toLowerCase() ?? 'unknown',
    refererHost: parseRefererHost(job.referer),
  };
}

function parseDevice(userAgent: string, parser: UAParser): string {
  if (BOT_PATTERN.test(userAgent)) {
    return 'bot';
  }
  return parser.getDevice().type ?? 'desktop'; // ua-parser leaves desktop type undefined
}

function parseRefererHost(referer: string | null): string | null {
  if (!referer) {
    return null;
  }
  try {
    return new URL(referer).host;
  } catch {
    return null;
  }
}

// Seam: a GeoIP lookup (MaxMind, etc.) plugs in here. Out of scope for now → null country.
function resolveCountry(_ip: string): string | null {
  return null;
}

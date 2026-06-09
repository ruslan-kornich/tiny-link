import { normalizeClick } from '../../src/modules/clicks/click-normalizer';
import { ClickJob } from '../../src/modules/clicks/dto/click-job.schema';

const baseJob: ClickJob = {
  jobId: '00000000-0000-0000-0000-000000000000',
  code: 'Ab3xK9',
  occurredAt: '2026-06-09T10:00:00.000Z',
  ip: '8.8.8.8',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  referer: 'https://t.co/abc',
};

describe('normalizeClick', () => {
  it('maps job fields and parses occurredAt into a Date', () => {
    const event = normalizeClick(baseJob);
    expect(event.jobId).toBe(baseJob.jobId);
    expect(event.code).toBe('Ab3xK9');
    expect(event.occurredAt.toISOString()).toBe('2026-06-09T10:00:00.000Z');
  });

  it('parses a mobile user-agent into device + browser', () => {
    const event = normalizeClick(baseJob);
    expect(event.device).toBe('mobile');
    expect(event.browser).toBe('mobile safari');
  });

  it('detects a bot user-agent', () => {
    const event = normalizeClick({ ...baseJob, userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)' });
    expect(event.device).toBe('bot');
    expect(event.browser).toBe('unknown');
  });

  it('extracts the referer host and yields null for a missing/invalid referer', () => {
    expect(normalizeClick(baseJob).refererHost).toBe('t.co');
    expect(normalizeClick({ ...baseJob, referer: null }).refererHost).toBeNull();
    expect(normalizeClick({ ...baseJob, referer: 'not a url' }).refererHost).toBeNull();
  });
});

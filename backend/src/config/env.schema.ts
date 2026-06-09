import { z } from 'zod';

export const envSchema = z.object({
  ROLE: z.enum(['api', 'worker']),
  PORT: z.coerce.number().int().positive().default(3000),
  SHORT_URL_BASE: z.string().url(),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(3600),

  CODE_LENGTH: z.coerce.number().int().min(4).max(16).default(6),
  CODE_MAX_RETRIES: z.coerce.number().int().min(1).max(10).default(3),

  CLICKS_CONCURRENCY: z.coerce.number().int().positive().default(10),
  BATCH_SIZE: z.coerce.number().int().positive().default(100),
  BATCH_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  ROLLUP_INTERVAL_MS: z.coerce.number().int().positive().default(10000),
  ROLLUP_BATCH: z.coerce.number().int().positive().default(5000),

  REDIRECT_RATE_LIMIT: z.coerce.number().int().positive().default(60),
  REDIRECT_RATE_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  REDIRECT_CACHE_TTL_MS: z.coerce.number().int().positive().default(30000),
});

export type AppConfig = z.infer<typeof envSchema>;

import { z } from 'zod';

export const clickJobSchema = z.object({
  jobId: z.string().uuid(),
  code: z.string().min(1),
  occurredAt: z.string().datetime(),
  ip: z.string().min(1),
  userAgent: z.string(),
  referer: z.string().nullable(),
});

export type ClickJob = z.infer<typeof clickJobSchema>;

import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const statsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export type StatsQueryDto = z.infer<typeof statsQuerySchema>;

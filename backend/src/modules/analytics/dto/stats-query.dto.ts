import { z } from 'zod';

const isoDate = z.string().date('Expected YYYY-MM-DD');

export const statsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export type StatsQueryDto = z.infer<typeof statsQuerySchema>;

import { z } from 'zod';

const isoDate = z.string().date('Expected YYYY-MM-DD');

export const statsQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'from must be before or equal to to',
  });

export type StatsQueryDto = z.infer<typeof statsQuerySchema>;

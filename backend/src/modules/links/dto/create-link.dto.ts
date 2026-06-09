import { z } from 'zod';

export const createLinkSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), { message: 'URL must be http or https' }),
});

export type CreateLinkDto = z.infer<typeof createLinkSchema>;

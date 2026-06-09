import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export type RegisterDto = z.infer<typeof registerSchema>;

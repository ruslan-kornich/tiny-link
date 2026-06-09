import { z } from 'zod';

export const listLinksSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ListLinksDto = z.infer<typeof listLinksSchema>;

export function encodeCursor(linkId: bigint): string {
  return Buffer.from(linkId.toString(), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string | undefined): bigint | null {
  if (!cursor) {
    return null;
  }
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const value = BigInt(decoded);
    return value > 0n ? value : null;
  } catch {
    return null;
  }
}

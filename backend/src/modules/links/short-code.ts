import { customAlphabet } from 'nanoid';

export const BASE62_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generators = new Map<number, () => string>();

export function generateShortCode(length: number): string {
  let generator = generators.get(length);
  if (!generator) {
    generator = customAlphabet(BASE62_ALPHABET, length);
    generators.set(length, generator);
  }
  return generator();
}

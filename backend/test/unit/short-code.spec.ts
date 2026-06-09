import { BASE62_ALPHABET, generateShortCode } from '../../src/modules/links/short-code';

describe('generateShortCode', () => {
  it('produces a code of the requested length', () => {
    expect(generateShortCode(6)).toHaveLength(6);
    expect(generateShortCode(7)).toHaveLength(7);
  });

  it('uses only base62 characters', () => {
    const code = generateShortCode(6);
    for (const character of code) {
      expect(BASE62_ALPHABET).toContain(character);
    }
  });

  it('is case-sensitive / non-trivially random across many draws', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateShortCode(6)));
    // 1000 draws from 62^6 should essentially never collide.
    expect(codes.size).toBe(1000);
  });
});

// test/unit/zod-validation.pipe.spec.ts
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../src/common/pipes/zod-validation.pipe';

const schema = z.object({ name: z.string().min(1) });

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(schema);

  it('returns the parsed value on valid input', () => {
    expect(pipe.transform({ name: 'ok' })).toEqual({ name: 'ok' });
  });

  it('throws BadRequestException with a flat message on invalid input', () => {
    expect(() => pipe.transform({ name: '' })).toThrow(BadRequestException);
  });
});

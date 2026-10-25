import { BusinessException } from '../exceptions/business.exception.js';
import { decodeCursor, encodeCursor } from './cursor.js';

describe('cursor', () => {
  const position = {
    createdAt: new Date('2026-10-22T08:30:00.123Z'),
    id: '7b0c9a52-3f1e-4d2a-9c11-0a1b2c3d4e5f',
  };

  it('round-trips with millisecond precision', () => {
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });

  it('is opaque and URL safe', () => {
    expect(encodeCursor(position)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    'not-base64-json',
    Buffer.from('{"c":"yesterday","i":"x"}').toString('base64url'),
    Buffer.from('{"c":"2026-10-22T08:30:00.000Z","i":"not-a-uuid"}').toString('base64url'),
    Buffer.from('[]').toString('base64url'),
  ])('rejects %s with VALIDATION_FAILED on the cursor field', (cursor) => {
    const error = (() => {
      try {
        decodeCursor(cursor);
      } catch (e) {
        return e as BusinessException;
      }
    })();
    expect(error?.getResponse()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'cursor' }],
    });
  });
});

import type { CursorMeta } from '../interfaces/api-response.interface.js';

// API Contract 4.11
export class CursorResult<T> {
  readonly meta: CursorMeta;

  constructor(
    readonly items: T[],
    limit: number,
    nextCursor: string | null,
  ) {
    this.meta = { limit, nextCursor, hasNextPage: nextCursor !== null };
  }
}

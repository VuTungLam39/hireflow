import { PaginatedResult } from './paginated-result.dto.js';

describe('PaginatedResult', () => {
  it('computes pagination meta', () => {
    const result = new PaginatedResult(['a', 'b'], 25, 2, 10);
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('handles empty results', () => {
    const result = new PaginatedResult([], 0, 1, 10);
    expect(result.meta.totalPages).toBe(0);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(false);
  });
});

import type { PaginationMeta } from '../interfaces/api-response.interface.js';

/** Kết quả phân trang – TransformInterceptor sẽ tách `meta` ra ngoài response */
export class PaginatedResult<T> {
  readonly items: T[];
  readonly meta: PaginationMeta;

  constructor(items: T[], totalItems: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalItems / limit);
    this.items = items;
    this.meta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

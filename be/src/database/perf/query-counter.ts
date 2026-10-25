import type { DataSource, Logger } from 'typeorm';

export interface CapturedQuery {
  sql: string;
  params: unknown[];
}

// Backend Architecture 16.1: đếm query
export class QueryCounter {
  readonly queries: CapturedQuery[] = [];
  private active = false;

  constructor(dataSource: DataSource) {
    const original = dataSource.logger;
    const counter: Logger = {
      logQuery: (sql, params, runner) => {
        if (this.active) this.queries.push({ sql, params: params ?? [] });
        original.logQuery(sql, params, runner);
      },
      logQueryError: (...args) => original.logQueryError(...args),
      logQuerySlow: (...args) => original.logQuerySlow(...args),
      logSchemaBuild: (...args) => original.logSchemaBuild(...args),
      logMigration: (...args) => original.logMigration(...args),
      log: (...args) => original.log(...args),
    };
    Object.defineProperty(dataSource, 'logger', { value: counter, configurable: true });
  }

  async count<T>(work: () => Promise<T>): Promise<{ result: T; queries: CapturedQuery[] }> {
    this.queries.length = 0;
    this.active = true;
    try {
      const result = await work();
      return { result, queries: [...this.queries] };
    } finally {
      this.active = false;
    }
  }
}

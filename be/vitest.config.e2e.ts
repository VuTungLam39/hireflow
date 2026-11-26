import { defineConfig } from 'vitest/config';
import { coreCoverage } from './vitest.coverage.js';

// K-05
process.env.DB_DATABASE ??= 'hireflow_test';
process.env.DATABASE_URL = '';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ['./test/setup-e2e.ts'],
    globalSetup: ['./test/global-setup-e2e.ts'],
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Kickoff 8.7: e2e dùng LLM giả, giống CI
    env: { NODE_ENV: 'test', LLM_PROVIDERS: 'fake', EMBEDDING_PROVIDER: 'fake' },
    coverage: coreCoverage('coverage/e2e'),
  },
});

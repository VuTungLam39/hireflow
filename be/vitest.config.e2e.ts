import { defineConfig } from 'vitest/config';
import { coreCoverage } from './vitest.coverage.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ['./test/setup-e2e.ts'],
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Kickoff 8.7: e2e dùng LLM giả, giống CI
    env: { NODE_ENV: 'test', LLM_PROVIDERS: 'fake', EMBEDDING_PROVIDER: 'fake' },
    coverage: coreCoverage('coverage/e2e'),
  },
});

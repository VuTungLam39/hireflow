import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ['./test/setup-e2e.ts'],
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Kickoff 8.7: e2e dùng LLM giả, giống CI
    env: { NODE_ENV: 'test', LLM_PROVIDERS: 'fake', EMBEDDING_PROVIDER: 'fake' },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ['reflect-metadata'],
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Kickoff 8.7: e2e dùng LLM giả, giống CI
    env: { LLM_PROVIDERS: 'fake', EMBEDDING_PROVIDER: 'fake' },
  },
});

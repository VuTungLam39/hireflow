import { defineConfig } from 'vitest/config';
import { coreCoverage } from './vitest.coverage.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ['reflect-metadata'],
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: coreCoverage('coverage/unit'),
  },
});

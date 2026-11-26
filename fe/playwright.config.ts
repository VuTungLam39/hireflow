/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test'

// Phase 08 · master plan §08.2: chạy với stack local (docker compose + seed demo), không chạm production
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 20_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, stylePath: './e2e/screenshot.css' },
  },
  snapshotPathTemplate: '../docs/redesign/phase-08/visual-baseline/{arg}-{platform}{ext}',
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'], testMatch: /public-smoke/ },
    { name: 'webkit', use: devices['Desktop Safari'], testMatch: /public-smoke/ },
  ],
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: '../be',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})

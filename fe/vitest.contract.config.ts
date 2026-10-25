import { defineConfig } from 'vitest/config'

const apiUrl = process.env.CONTRACT_API_URL ?? 'http://localhost:3000/api/v1'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: new URL(apiUrl).origin } },
    include: ['src/test/contract/**/*.test.ts'],
    env: {
      VITE_API_URL: apiUrl,
      VITE_API_MOCKS: 'off',
      CONTRACT_EMAIL: process.env.CONTRACT_EMAIL ?? 'admin@example.com',
      CONTRACT_PASSWORD: process.env.CONTRACT_PASSWORD ?? 'Admin@123',
    },
  },
})

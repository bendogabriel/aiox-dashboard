import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4095',
    headless: true,
  },
  // Engine serves the dashboard SPA from dist/
  webServer: {
    command: 'bun run e2e:setup',
    url: 'http://localhost:4095/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});

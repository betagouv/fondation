import { defineConfig, devices } from '@playwright/test';

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: process.env.CI ? 10_000 : 5_000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'unit', testDir: './tests/unit' },
    { name: 'setup', testDir: './tests/e2e', testMatch: /.*\.setup\.ts$/ },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/sg.json' },
    },
  ],

  webServer: [
    {
      name: 'backend',
      command: 'pnpm run --filter api start:e2e',
      url: 'http://localhost:3000/_health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm run --filter client dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});

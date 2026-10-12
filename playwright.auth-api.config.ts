import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const authApiE2EPort = 4181;

/**
 * Registration is blocked in the staging E2E build. These browser contracts
 * run against local Vite API mode and intercept the reserved e2e.test host.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/auth-session.spec.ts', '**/auth-registration-mfa-setup.spec.ts'],
  grep: /@auth-api/,
  outputDir: process.env.VITTRADE_RUN_DIR
    ? path.join(process.env.VITTRADE_RUN_DIR, 'test-results')
    : 'test-results',
  globalSetup: './scripts/auth-api-e2e-global-setup.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ['github'],
        [
          'html',
          {
            open: 'never',
            outputFolder: process.env.VITTRADE_RUN_DIR
              ? path.join(process.env.VITTRADE_RUN_DIR, 'playwright-report')
              : 'playwright-report',
          },
        ],
      ]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:' + authApiE2EPort,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

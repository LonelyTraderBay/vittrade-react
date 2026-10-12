import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const authMockPort = 4182;

/**
 * Exercises the development authentication flows through the browser MSW worker.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/auth-*-mock.spec.ts',
  grep: /@auth-/,
  globalSetup: './scripts/auth-mock-e2e-global-setup.ts',
  outputDir: process.env.VITTRADE_RUN_DIR
    ? path.join(process.env.VITTRADE_RUN_DIR, 'test-results')
    : 'test-results',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
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
    baseURL: `http://127.0.0.1:${authMockPort}`,
    trace: 'retain-on-failure',
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

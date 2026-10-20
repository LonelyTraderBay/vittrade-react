import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const nodeExecutable = `"${process.execPath}"`;
const previewPort = Number(process.env.E2E_PREVIEW_PORT ?? '4173');
const previewUrl = `http://127.0.0.1:${previewPort}`;

/**
 * E2E smoke profile cho shell/auth/accessibility.
 * Critical transaction flows phải chạy thêm trên staging với backend thật.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: [
    '**/auth-*-mock.spec.ts',
    '**/ui-*-mock.spec.ts',
    '**/auth-registration-mfa-setup.spec.ts',
  ],
  grepInvert: /@auth-api/,
  outputDir: process.env.VITTRADE_RUN_DIR
    ? path.join(process.env.VITTRADE_RUN_DIR, 'test-results')
    : 'test-results',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // Contract smoke flows share an in-memory API fixture and Vite preview;
  // serial execution avoids resource contention on local and shared CI runners.
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
    baseURL: previewUrl,
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
  webServer: {
    command: `${nodeExecutable} scripts/serve-e2e.mjs`,
    // Preserve startup progress when readiness fails before the browser tests run.
    stdout: 'pipe',
    // Wait for our preview process; another service can answer the port during the build.
    wait: { stdout: new RegExp(`Local:\\s+http:\\/\\/127\\.0\\.0\\.1:${previewPort}\\/`) },
    timeout: 120_000,
  },
});

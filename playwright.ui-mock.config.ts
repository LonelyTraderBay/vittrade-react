import { defineConfig } from '@playwright/test';
import authMockConfig from './playwright.auth-mock.config';

/** Route UI verification through the real development MSW worker. */
export default defineConfig(authMockConfig, {
  globalSetup: './scripts/ui-mock-e2e-global-setup.ts',
  workers: process.env.CI ? 2 : 1,
  testMatch: '**/ui-*-mock.spec.ts',
  grep: /@ui-mock/,
});

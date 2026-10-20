import { defineConfig } from '@playwright/test';
import authMockConfig from './playwright.auth-mock.config';

/** Route UI verification through the real development MSW worker. */
export default defineConfig(authMockConfig, {
  testMatch: '**/ui-*-mock.spec.ts',
  grep: /@ui-mock/,
});

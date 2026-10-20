import { defineConfig } from '@playwright/test';
import authMockConfig from './playwright.auth-mock.config';

// Fail closed if this separate profile accidentally inherits diagnostic opt-in.
if (process.env.VITE_ENABLE_DEVTOOLS !== 'false') {
  throw new Error('Preview defaults verification requires VITE_ENABLE_DEVTOOLS=false');
}

export default defineConfig(authMockConfig, {
  testMatch: '**/auth-devtools-disabled-mock.spec.ts',
  grep: /@preview-defaults/,
});

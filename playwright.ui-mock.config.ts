import { defineConfig, type ReporterDescription } from '@playwright/test';
import authMockConfig from './playwright.auth-mock.config';
import path from 'node:path';

const shard = process.env.VITTRADE_UI_SHARD;
if (shard && !/^[123]\/3$/.test(shard)) throw new Error('Expected UI shard 1/3, 2/3 or 3/3');
const reporters: ReporterDescription[] =
  typeof authMockConfig.reporter === 'string'
    ? [[authMockConfig.reporter]]
    : (authMockConfig.reporter ?? []);

/** Route UI verification through the real development MSW worker. */
export default defineConfig(authMockConfig, {
  globalSetup: './scripts/ui-mock-e2e-global-setup.ts',
  workers: process.env.CI ? 2 : 1,
  // Native test-level sharding; each test owns its browser context and MSW state.
  fullyParallel: true,
  shard: shard ? { current: Number(shard[0]), total: 3 } : undefined,
  reporter: [
    ...reporters,
    [
      'json',
      {
        outputFile: path.join(
          process.env.VITTRADE_RUN_DIR ?? '.artifacts/ci',
          'test-results/ui-native.json',
        ),
      },
    ],
  ],
  testMatch: '**/ui-*-mock.spec.ts',
  grep: /@ui-mock/,
});

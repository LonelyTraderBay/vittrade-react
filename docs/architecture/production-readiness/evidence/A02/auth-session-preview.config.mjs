import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../');

export default {
  testDir: path.join(repositoryRoot, 'tests', 'e2e'),
  timeout: 30000,
  expect: { timeout: 5000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.VITTRADE_E2E_BASE_URL ?? 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
};

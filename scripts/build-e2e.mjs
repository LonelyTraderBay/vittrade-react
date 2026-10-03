import { spawnSync } from 'node:child_process';
import path from 'node:path';

const buildScript = path.resolve('scripts/build.mjs');
const result = spawnSync(process.execPath, [buildScript, '--mode', 'staging'], {
  env: {
    ...process.env,
    // Keep the staging build API-backed with reserved, non-routable test origins.
    VITE_DATA_SOURCE: 'api',
    VITE_API_BASE_URL: 'https://e2e.test',
    VITE_WS_URL: 'wss://e2e.test',
    VITE_APP_NAME: 'VitTrade E2E',
    VITE_RELEASE_VERSION: 'e2e',
    VITE_ENABLE_ANALYTICS: 'false',
    VITE_ENABLE_DEVTOOLS: 'false',
  },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);

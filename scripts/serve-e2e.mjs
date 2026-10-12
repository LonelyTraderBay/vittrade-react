import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildScript = path.join(projectRoot, 'scripts', 'build-e2e.mjs');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const previewPort = Number(process.env.E2E_PREVIEW_PORT ?? '4173');
const previewMode = process.env.E2E_PREVIEW_MODE ?? 'production';
if (!Number.isInteger(previewPort) || previewPort < 1 || previewPort > 65535) {
  throw new Error('E2E_PREVIEW_PORT must be an integer between 1 and 65535.');
}
if (previewMode !== 'production' && previewMode !== 'development') {
  throw new Error('E2E_PREVIEW_MODE must be production or development.');
}
const previewEnvironment = {
  ...process.env,
  VITE_DATA_SOURCE: 'api',
  VITE_API_BASE_URL: 'https://e2e.test',
  VITE_WS_URL: 'wss://e2e.test',
};

const startPreview = () => {
  const viteArgs =
    previewMode === 'development'
      ? [viteCli, '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort']
      : [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'];
  const preview = spawn(process.execPath, viteArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: previewEnvironment,
  });

  preview.on('error', (error) => {
    console.error('Failed to start the E2E preview server:', error.message);
    process.exit(1);
  });

  preview.on('exit', (previewCode) => process.exit(previewCode ?? 1));
  process.on('SIGINT', () => preview.kill('SIGINT'));
  process.on('SIGTERM', () => preview.kill('SIGTERM'));
};

if (previewMode === 'development') {
  startPreview();
} else {
  const build = spawn(process.execPath, [buildScript], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  build.on('error', (error) => {
    console.error('Failed to start the E2E staging build:', error.message);
    process.exit(1);
  });

  build.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code ?? 1);
      return;
    }

    startPreview();
  });
}

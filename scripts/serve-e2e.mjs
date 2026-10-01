import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildScript = path.join(projectRoot, 'scripts', 'build-e2e.mjs');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const previewEnvironment = {
  ...process.env,
  VITE_DATA_SOURCE: 'api',
  VITE_API_BASE_URL: 'https://e2e.test',
  VITE_WS_URL: 'wss://e2e.test',
};

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

  const preview = spawn(
    process.execPath,
    [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
    { cwd: projectRoot, stdio: 'inherit', env: previewEnvironment },
  );

  preview.on('error', (error) => {
    console.error('Failed to start the E2E preview server:', error.message);
    process.exit(1);
  });

  preview.on('exit', (previewCode) => process.exit(previewCode ?? 1));
  process.on('SIGINT', () => preview.kill('SIGINT'));
  process.on('SIGTERM', () => preview.kill('SIGTERM'));
});

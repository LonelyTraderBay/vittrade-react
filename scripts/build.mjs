import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const typescriptCli = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

function run(label, args) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Failed to start ${label}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('TypeScript app typecheck', [typescriptCli, '--noEmit', '-p', 'tsconfig.json']);
run('TypeScript scripts typecheck', [typescriptCli, '--noEmit', '-p', 'tsconfig.node.json']);
run('Vite production build', [viteCli, 'build', ...process.argv.slice(2)]);

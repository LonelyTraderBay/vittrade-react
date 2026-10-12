import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isProductionBuildInput, sourceSnapshot } from './run-with-artifacts.mjs';

export function findBuildArtifact(root) {
  const runs = path.resolve(root, '.artifacts/runs');
  const snapshot = sourceSnapshot(root);
  const candidates = fs.existsSync(runs)
    ? fs
        .readdirSync(runs)
        .flatMap((name) => {
          const directory = path.join(runs, name);
          const manifestPath = path.join(directory, 'run.json');
          if (!fs.existsSync(manifestPath)) return [];
          const manifest = JSON.parse(fs.readFileSync(manifestPath));
          return manifest.command === 'build' &&
            isProductionBuildInput(manifest.args, manifest.buildEnvironment?.nodeEnv) &&
            manifest.status === 'passed' &&
            manifest.sourceUnchanged &&
            JSON.stringify(manifest.snapshot) === JSON.stringify(snapshot)
            ? [{ directory, manifest }]
            : [];
        })
        .sort((a, b) => b.manifest.finishedAt.localeCompare(a.manifest.finishedAt))
    : [];
  if (!candidates.length)
    throw new Error(
      'No successful production build for the current source snapshot. Run npm run build first.',
    );
  return candidates[0].directory;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const kind = process.argv[2];
  if (!['mocks', 'bundle', 'preview'].includes(kind))
    throw new Error('Expected mocks, bundle or preview');
  const directory = findBuildArtifact(process.cwd());
  console.log(`Checking current build: ${path.relative(process.cwd(), directory)}`);
  const args =
    kind === 'preview'
      ? [
          'node_modules/vite/bin/vite.js',
          'preview',
          '--outDir',
          path.join(directory, 'dist'),
          ...process.argv.slice(3),
        ]
      : [`scripts/check-${kind === 'mocks' ? 'production-mocks' : 'bundle-budget'}.mjs`];
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env, VITTRADE_RUN_DIR: directory },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

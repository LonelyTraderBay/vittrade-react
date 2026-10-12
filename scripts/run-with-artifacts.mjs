import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commands = {
  vitest: 'node_modules/vitest/vitest.mjs',
  playwright: 'node_modules/@playwright/test/cli.js',
  build: 'scripts/build.mjs',
};

export function isProductionBuildInput(args, nodeEnv) {
  return (
    Array.isArray(args) &&
    (args.length === 0 ||
      (args.length === 1 && args[0] === '--mode=production') ||
      (args.length === 2 && args[0] === '--mode' && args[1] === 'production')) &&
    (nodeEnv === null || nodeEnv === 'production')
  );
}

export function sourceSnapshot(projectRoot) {
  const files = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
    },
  )
    .split('\0')
    .filter(Boolean);
  const hashes = {};
  for (const file of [...new Set(files)].sort()) {
    // Ledger/report metadata changes after a run; executable readiness owners still belong to it.
    if (
      file.startsWith('docs/architecture/production-readiness/') &&
      !/\.(?:[cm]?[jt]sx?)$/.test(file)
    )
      continue;
    hashes[file] = createHash('sha256')
      .update(readFileSync(path.join(projectRoot, file)))
      .digest('hex');
  }
  return {
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8' }).trim(),
    hashes,
  };
}

export function runWithArtifacts(command, args, projectRoot = root) {
  if (!commands[command]) throw new Error('Expected vitest, playwright or build.');
  const nodeEnv = process.env.NODE_ENV ?? null;
  if (command === 'build' && !isProductionBuildInput(args, nodeEnv))
    throw new Error('Owned builds require production mode and repository output/configuration.');
  // Each invocation owns a fresh directory. Existing reports and evidence are never cleaned here.
  const id = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${command}-${randomUUID()}`;
  const directory = path.join(projectRoot, '.artifacts', 'runs', id);
  mkdirSync(directory, { recursive: true });
  const manifestPath = path.join(directory, 'run.json');
  const manifest = {
    schemaVersion: 1,
    id,
    command,
    args,
    ownerPid: process.pid,
    startedAt: new Date().toISOString(),
    status: 'running',
    retention: 'manual-review-only',
    ...(command === 'build' ? { buildEnvironment: { nodeEnv } } : {}),
    snapshot: sourceSnapshot(projectRoot),
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(`Artifacts: ${path.relative(projectRoot, directory)}`);
  const child = spawn(process.execPath, [path.join(projectRoot, commands[command]), ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, VITTRADE_RUN_DIR: directory },
  });
  const finish = (code, signal, error) => {
    manifest.status = error || signal || code !== 0 ? 'failed' : 'passed';
    manifest.finishedAt = new Date().toISOString();
    manifest.exitCode = code;
    manifest.signal = signal;
    if (error) manifest.error = error.message;
    manifest.snapshotAfter = sourceSnapshot(projectRoot);
    manifest.sourceUnchanged =
      JSON.stringify(manifest.snapshot) === JSON.stringify(manifest.snapshotAfter);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    process.exitCode = manifest.sourceUnchanged ? (code ?? 1) : 1;
    if (!manifest.sourceUnchanged)
      console.error('Source changed during this run; evidence is not a final snapshot.');
  };
  child.once('error', (error) => finish(null, null, error));
  child.once('exit', (code, signal) => finish(code, signal));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
  return child;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runWithArtifacts(process.argv[2], process.argv.slice(3));
}

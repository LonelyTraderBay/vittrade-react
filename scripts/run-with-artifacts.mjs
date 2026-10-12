import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cleanupPolicy,
  ensureArtifactDirectory,
  isProductionBuildInput,
  withArtifactLock,
  writeArtifactJson,
} from './artifact-lifecycle.mjs';
import { assertStorageBudget, cleanupArtifacts } from './cleanup-artifacts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commands = {
  vitest: 'node_modules/vitest/vitest.mjs',
  playwright: 'node_modules/@playwright/test/cli.js',
  build: 'scripts/build.mjs',
};

export { isProductionBuildInput } from './artifact-lifecycle.mjs';

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
  // Recover disposable output from normally finished runs; unknown/legacy runs remain protected.
  const previousCleanup = cleanupArtifacts(projectRoot);
  if (previousCleanup.errors.length)
    throw new Error('Artifact cleanup failed; inspect .artifacts/cleanup-report.json.');
  const id = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${command}-${randomUUID()}`;
  const directory = path.join(projectRoot, '.artifacts', 'runs', id);
  const manifestPath = path.join(directory, 'run.json');
  const manifest = {
    schemaVersion: 1,
    id,
    command,
    args,
    ownerPid: process.pid,
    startedAt: new Date().toISOString(),
    status: 'running',
    retention: cleanupPolicy,
    childPid: null,
    childClosed: false,
    ...(command === 'build' ? { buildEnvironment: { nodeEnv } } : {}),
    snapshot: sourceSnapshot(projectRoot),
  };
  const child = withArtifactLock(projectRoot, () => {
    assertStorageBudget(projectRoot);
    ensureArtifactDirectory(projectRoot, `.artifacts/runs/${id}`);
    writeArtifactJson(projectRoot, manifestPath, manifest);
    console.log(`Artifacts: ${path.relative(projectRoot, directory)}`);
    const processChild = spawn(
      process.execPath,
      [path.join(projectRoot, commands[command]), ...args],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, VITTRADE_RUN_DIR: directory },
      },
    );
    manifest.childPid = processChild.pid ?? null;
    writeArtifactJson(projectRoot, manifestPath, manifest);
    return processChild;
  });
  let spawnError;
  const finish = (code, signal) => {
    const error = spawnError;
    manifest.status = error || signal || code !== 0 ? 'failed' : 'passed';
    manifest.finishedAt = new Date().toISOString();
    manifest.exitCode = code;
    manifest.signal = signal;
    manifest.childClosed = true;
    if (error) manifest.error = error.message;
    manifest.snapshotAfter = sourceSnapshot(projectRoot);
    manifest.sourceUnchanged =
      JSON.stringify(manifest.snapshot) === JSON.stringify(manifest.snapshotAfter);
    withArtifactLock(projectRoot, () => writeArtifactJson(projectRoot, manifestPath, manifest));
    process.exitCode = manifest.sourceUnchanged && !error && !signal ? (code ?? 1) : 1;
    if (!manifest.sourceUnchanged)
      console.error('Source changed during this run; evidence is not a final snapshot.');
    try {
      const cleanup = cleanupArtifacts(projectRoot, { completedRun: directory });
      console.log(
        `Cleanup: ${cleanup.deletedFiles} files, ${cleanup.deletedLogicalBytes} logical bytes; ${cleanup.errors.length} errors.`,
      );
      if (cleanup.errors.length) process.exitCode = 1;
    } catch (cleanupError) {
      console.error('Artifact cleanup failed:', cleanupError.message);
      process.exitCode = 1;
    }
  };
  child.once('error', (error) => {
    spawnError = error;
  });
  child.once('close', finish);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
  return child;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runWithArtifacts(process.argv[2], process.argv.slice(3));
}

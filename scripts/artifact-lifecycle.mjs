import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const cleanupPolicy = 'ephemeral-cache-output-v1';

export function isProductionBuildInput(args, nodeEnv) {
  return (
    Array.isArray(args) &&
    (args.length === 0 ||
      (args.length === 1 && args[0] === '--mode=production') ||
      (args.length === 2 && args[0] === '--mode' && args[1] === 'production')) &&
    (nodeEnv === null || nodeEnv === 'production')
  );
}

export function assertRegularTree(root, target) {
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error('Outside owned run directory');
  let current = root;
  for (const part of ['', ...relative.split(path.sep)]) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || fs.realpathSync(current) !== path.resolve(current))
      throw new Error('Reparse/link path refused');
    if (!stat.isDirectory() && (!stat.isFile() || stat.nlink !== 1))
      throw new Error('Special/hard-linked file refused');
  }
}

export function processAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Invalid process owner');
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    if (error.code === 'EPERM') return true;
    throw error;
  }
}

export function ensureArtifactDirectory(root, relative) {
  if (
    relative.split('/')[0] !== '.artifacts' ||
    relative.split('/').some((part) => !part || part === '..' || part === '.')
  )
    throw new Error('Expected an owned artifact path');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) fs.mkdirSync(current);
    assertRegularTree(root, current);
    if (!fs.statSync(current).isDirectory()) throw new Error('Expected artifact directory');
  }
  return current;
}

export function writeArtifactJson(root, target, value) {
  assertRegularTree(root, path.dirname(target));
  if (fs.existsSync(target)) assertRegularTree(root, target);
  const temporary = `${target}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  try {
    if (fs.existsSync(target)) assertRegularTree(root, target);
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function withArtifactLock(root, action) {
  root = fs.realpathSync(root);
  // Never turn a source directory into disposable storage when ignore rules are missing.
  execFileSync('git', ['check-ignore', '--no-index', '--quiet', '.artifacts/lifecycle-probe'], {
    cwd: root,
  });
  ensureArtifactDirectory(root, '.artifacts');
  const lock = path.join(root, '.artifacts/lifecycle.lock');
  let fd;
  try {
    fd = fs.openSync(lock, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST')
      throw new Error(
        'Artifact lifecycle is locked; preserve output and retry after its owner exits.',
        { cause: error },
      );
    throw error;
  }
  const identity = fs.fstatSync(fd, { bigint: true }).ino;
  let value, actionError;
  try {
    fs.writeFileSync(
      fd,
      JSON.stringify({ ownerPid: process.pid, startedAt: new Date().toISOString() }),
    );
    value = action(root);
  } catch (error) {
    actionError = error;
  }
  try {
    fs.closeSync(fd);
    assertRegularTree(root, lock);
    if (fs.lstatSync(lock, { bigint: true }).ino !== identity)
      throw new Error('Artifact lifecycle lock changed; refusing to remove it.');
    fs.unlinkSync(lock);
  } catch (error) {
    if (actionError)
      throw new AggregateError([actionError, error], 'Artifact operation and lock release failed', {
        cause: error,
      });
    throw error;
  }
  if (actionError) throw actionError;
  return value;
}

export function acquireArtifactConsumer(root, selectDirectory) {
  let target, lease;
  withArtifactLock(root, () => {
    const directory = selectDirectory();
    assertRegularTree(root, directory);
    assertRegularTree(root, path.join(directory, 'dist'));
    target = path.join(directory, `.consumer-${randomUUID()}.json`);
    lease = { ownerPid: process.pid, childPid: null };
    writeArtifactJson(root, target, lease);
  });
  return {
    directory: path.dirname(target),
    started(childPid) {
      withArtifactLock(root, () => {
        lease.childPid = childPid;
        writeArtifactJson(root, target, lease);
      });
    },
    release() {
      withArtifactLock(root, () => {
        if (lease.childPid && processAlive(lease.childPid))
          throw new Error('Artifact consumer child is still alive');
        assertRegularTree(root, target);
        fs.unlinkSync(target);
      });
    },
  };
}

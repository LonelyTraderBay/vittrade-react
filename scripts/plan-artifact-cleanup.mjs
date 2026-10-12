import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assertRegularTree, processAlive } from './artifact-lifecycle.mjs';

const hash = (data) => createHash('sha256').update(data).digest('hex');
const removable = new Set(['cache', 'dist']);

function finishedRun(root, directory, completedRun) {
  assertRegularTree(root, directory);
  const relative = path.relative(root, directory).split(path.sep);
  if (relative.length !== 3 || relative[0] !== '.artifacts' || relative[1] !== 'runs')
    throw new Error('Expected one owned .artifacts/runs/<id> directory');
  assertRegularTree(root, path.join(directory, 'run.json'));
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'run.json')));
  if (
    manifest.schemaVersion !== 1 ||
    manifest.id !== relative[2] ||
    !manifest.finishedAt ||
    !['passed', 'failed'].includes(manifest.status)
  )
    throw new Error('Unfinished or unowned run refused');
  if (
    processAlive(manifest.ownerPid) &&
    !(
      directory === completedRun &&
      manifest.ownerPid === process.pid &&
      manifest.childClosed === true
    )
  )
    throw new Error('Run owner is still alive');
  if (manifest.childPid && processAlive(manifest.childPid))
    throw new Error('Run child is still alive');
  return manifest;
}

export function fileFingerprint(target) {
  const fd = fs.openSync(target, 'r');
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    const digest = createHash('sha256');
    const buffer = Buffer.alloc(64 * 1024);
    let bytes;
    while ((bytes = fs.readSync(fd, buffer, 0, buffer.length, null)))
      digest.update(buffer.subarray(0, bytes));
    const after = fs.fstatSync(fd, { bigint: true });
    if (before.size !== after.size || before.mtimeNs !== after.mtimeNs)
      throw new Error('File changed during inventory');
    return {
      bytes: Number(after.size),
      fileId: `${after.dev}:${after.ino}`,
      sha256: digest.digest('hex'),
    };
  } finally {
    fs.closeSync(fd);
  }
}

function inventory(root, directory) {
  const files = [];
  const directories = [];
  const visit = (target) => {
    assertRegularTree(root, target);
    const stat = fs.lstatSync(target);
    if (stat.isDirectory()) {
      const identity = fs.lstatSync(target, { bigint: true });
      directories.push({
        path: path.relative(root, target).split(path.sep).join('/'),
        fileId: `${identity.dev}:${identity.ino}`,
      });
      for (const name of fs.readdirSync(target).sort()) visit(path.join(target, name));
    } else if (stat.isFile()) {
      files.push({
        path: path.relative(root, target).split(path.sep).join('/'),
        ...fileFingerprint(target),
      });
    } else throw new Error('Special file refused');
  };
  for (const name of fs.readdirSync(directory).sort()) {
    // Coverage JSON, failure screenshots/videos/traces, reports and run manifests remain evidence.
    if (removable.has(name)) visit(path.join(directory, name));
  }
  return { files, directories };
}

export function planCleanup(root, directory, { completedRun } = {}) {
  root = fs.realpathSync(root);
  directory = path.resolve(directory);
  const manifest = finishedRun(root, directory, completedRun);
  const { files, directories } = inventory(root, directory);
  return {
    schemaVersion: 1,
    mode: 'dry-run',
    root,
    run: path.relative(root, directory).split(path.sep).join('/'),
    manifestSha256: hash(fs.readFileSync(path.join(directory, 'run.json'))),
    runStatus: manifest.status,
    files,
    directories,
    bytes: files.reduce((total, file) => total + file.bytes, 0),
  };
}

export function validateCleanup(plan) {
  if (plan.schemaVersion !== 1 || plan.mode !== 'dry-run') throw new Error('Invalid plan');
  const current = planCleanup(plan.root, path.resolve(plan.root, plan.run));
  if (JSON.stringify(current) !== JSON.stringify(plan))
    throw new Error('Run changed since review; new approval required');
  return current;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, argument] = process.argv.slice(2);
  if (command === '--validate' && argument) {
    const plan = validateCleanup(JSON.parse(fs.readFileSync(argument)));
    console.log(
      `Review still valid: ${plan.files.length} files, ${plan.bytes} bytes. No files deleted.`,
    );
  } else if (command === '--run' && argument) {
    console.log(JSON.stringify(planCleanup(process.cwd(), path.resolve(argument)), null, 2));
  } else
    throw new Error(
      'Use --run <directory> to print a dry-run plan, or --validate <plan.json>. Permanent deletion requires separate approval; this tool never deletes.',
    );
}

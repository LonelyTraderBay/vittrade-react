import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  assertRegularTree,
  cleanupPolicy,
  isProductionBuildInput,
  processAlive,
  withArtifactLock,
  writeArtifactJson,
} from './artifact-lifecycle.mjs';
import { fileFingerprint, planCleanup } from './plan-artifact-cleanup.mjs';

const GiB = 1024 ** 3;

function gitFiles(root) {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
}

function referencedRuns(root, files) {
  const references = new Set();
  for (const file of files) {
    if (!/\.(?:json|md|txt|log|[cm]?[jt]sx?|ya?ml|html)$/.test(file)) continue;
    const target = path.join(root, file);
    assertRegularTree(root, target);
    const text = fs.readFileSync(target, 'utf8').replaceAll('\\', '/');
    // JSON-escaped Windows paths and relative Markdown paths identify the same run.
    for (const match of text.replace(/\/+/g, '/').matchAll(/\.artifacts\/runs\/([^/\s"')<>]+)/g))
      references.add(match[1]);
  }
  return references;
}

function activeConsumer(root, directory) {
  for (const name of fs.readdirSync(directory)) {
    if (!/^\.consumer-.*\.json$/.test(name)) continue;
    const target = path.join(directory, name);
    assertRegularTree(root, target);
    const lease = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (!lease.childPid && !processAlive(lease.ownerPid))
      throw new Error('Incomplete artifact consumer ownership; output preserved');
    if (processAlive(lease.ownerPid) || (lease.childPid && processAlive(lease.childPid)))
      return true;
  }
  return false;
}

function directoryBytes(root, directory) {
  let bytes = 0;
  for (const name of fs.readdirSync(directory)) {
    const target = path.join(directory, name);
    assertRegularTree(root, target);
    const stat = fs.lstatSync(target);
    bytes += stat.isDirectory() ? directoryBytes(root, target) : stat.size;
  }
  return bytes;
}

export function storageWarnings({ freeBytes, artifactBytes }) {
  const warnings = [];
  if (freeBytes < 20 * GiB) warnings.push('Less than 20 GiB free on the artifact volume.');
  if (artifactBytes > GiB)
    warnings.push('Artifacts exceed 1 GiB; protected evidence requires review.');
  return warnings;
}

export function assertStorageBudget(root) {
  const stat = fs.statfsSync(root);
  const freeBytes = stat.bavail * stat.bsize;
  if (freeBytes < 5 * GiB)
    throw new Error('Less than 5 GiB free; stop generating output and review storage.');
  const directory = path.join(root, '.artifacts');
  const artifactBytes = fs.existsSync(directory) ? directoryBytes(root, directory) : 0;
  for (const warning of storageWarnings({ freeBytes, artifactBytes })) console.warn(warning);
}

function cleanupLocked(root, { dryRun = false, completedRun } = {}) {
  const runs = path.join(root, '.artifacts/runs');
  const report = {
    schemaVersion: 1,
    policy: cleanupPolicy,
    mode: dryRun ? 'dry-run' : 'apply',
    observedAt: new Date().toISOString(),
    deletedFiles: 0,
    deletedLogicalBytes: 0,
    eligibleFiles: 0,
    eligibleLogicalBytes: 0,
    retained: [],
    errors: [],
  };
  if (!fs.existsSync(runs)) return report;
  assertRegularTree(root, runs);
  const manifests = [];
  for (const id of fs.readdirSync(runs).sort()) {
    const directory = path.join(runs, id);
    try {
      assertRegularTree(root, directory);
      const target = path.join(directory, 'run.json');
      assertRegularTree(root, target);
      const manifest = JSON.parse(fs.readFileSync(target, 'utf8'));
      if (manifest.id !== id) throw new Error('Run identity mismatch');
      manifests.push({ id, directory, manifest });
    } catch (error) {
      report.retained.push({ run: id, reason: `Unknown run: ${error.message}` });
    }
  }
  // Keep the last successful production build even after a source edit, until a replacement passes.
  const latestBuild = manifests
    .filter(
      ({ directory, manifest }) =>
        manifest.command === 'build' &&
        isProductionBuildInput(manifest.args, manifest.buildEnvironment?.nodeEnv) &&
        manifest.status === 'passed' &&
        manifest.sourceUnchanged &&
        typeof manifest.finishedAt === 'string' &&
        fs.existsSync(path.join(directory, 'dist')),
    )
    .sort((a, b) => b.manifest.finishedAt.localeCompare(a.manifest.finishedAt))[0]?.id;
  for (const { id, directory, manifest } of manifests) {
    try {
      if (
        manifest.retention !== cleanupPolicy ||
        manifest.childClosed !== true ||
        manifest.signal ||
        manifest.error ||
        !Number.isSafeInteger(manifest.childPid) ||
        manifest.childPid <= 0
      ) {
        report.retained.push({
          run: id,
          reason: 'Legacy, unfinished or incomplete ownership metadata',
        });
        continue;
      }
      const options = { completedRun };
      const plan = planCleanup(root, directory, options);
      const keepDist =
        id === latestBuild || manifest.status !== 'passed' || !manifest.sourceUnchanged;
      const selected = plan.files.filter(
        (file) => !keepDist || !file.path.startsWith(`${plan.run}/dist/`),
      );
      const directories = plan.directories.filter(
        (dir) =>
          !keepDist ||
          !(dir.path === `${plan.run}/dist` || dir.path.startsWith(`${plan.run}/dist/`)),
      );
      if (!selected.length && !directories.length) {
        if (keepDist && fs.existsSync(path.join(directory, 'dist')))
          report.retained.push({
            run: id,
            reason: 'Latest production build or diagnostic output',
            area: 'dist',
          });
        continue;
      }
      const files = gitFiles(root);
      if (
        referencedRuns(root, files).has(id) ||
        files.some((file) => file.startsWith(`.artifacts/runs/${id}/`))
      ) {
        report.retained.push({
          run: id,
          reason: 'Source/evidence reference or Git-managed output',
        });
        continue;
      }
      if (activeConsumer(root, directory)) {
        report.retained.push({ run: id, reason: 'Active artifact consumer' });
        continue;
      }
      report.eligibleFiles += selected.length;
      report.eligibleLogicalBytes += selected.reduce((total, file) => total + file.bytes, 0);
      if (dryRun) continue;
      if (JSON.stringify(planCleanup(root, directory, options)) !== JSON.stringify(plan))
        throw new Error('Run changed during cleanup; output preserved');
      const currentFiles = gitFiles(root);
      if (
        referencedRuns(root, currentFiles).has(id) ||
        currentFiles.some((file) => file.startsWith(`${plan.run}/`))
      )
        throw new Error('Source/evidence reference changed before deletion; output preserved');
      for (const file of selected) {
        const target = path.resolve(root, file.path);
        for (const dir of plan.directories.filter((dir) => file.path.startsWith(`${dir.path}/`))) {
          const parent = path.resolve(root, dir.path);
          assertRegularTree(root, parent);
          const identity = fs.lstatSync(parent, { bigint: true });
          if (`${identity.dev}:${identity.ino}` !== dir.fileId)
            throw new Error('Parent directory changed before deletion');
        }
        assertRegularTree(root, target);
        const current = fileFingerprint(target);
        if (
          current.fileId !== file.fileId ||
          current.sha256 !== file.sha256 ||
          current.bytes !== file.bytes
        )
          throw new Error('File changed before deletion; remaining output preserved');
        fs.unlinkSync(target);
        report.deletedFiles++;
        report.deletedLogicalBytes += file.bytes;
      }
      // Remove only inventoried, now-empty directories; never recursively follow a replacement tree.
      for (const dir of directories.reverse()) {
        const target = path.resolve(root, dir.path);
        assertRegularTree(root, target);
        const stat = fs.lstatSync(target, { bigint: true });
        if (`${stat.dev}:${stat.ino}` !== dir.fileId)
          throw new Error('Directory changed before removal');
        fs.rmdirSync(target);
      }
      if (keepDist && fs.existsSync(path.join(directory, 'dist')))
        report.retained.push({
          run: id,
          reason: 'Latest production build or diagnostic output',
          area: 'dist',
        });
    } catch (error) {
      if (/still alive/.test(error.message))
        report.retained.push({ run: id, reason: error.message });
      else report.errors.push({ run: id, reason: error.message });
    }
  }
  return report;
}

export function cleanupArtifacts(root, options = {}) {
  if (options.dryRun) return cleanupLocked(fs.realpathSync(root), options);
  return withArtifactLock(root, (canonicalRoot) => {
    const report = cleanupLocked(canonicalRoot, options);
    if (!options.dryRun)
      writeArtifactJson(
        canonicalRoot,
        path.join(canonicalRoot, '.artifacts/cleanup-report.json'),
        report,
      );
    return report;
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 1 && args[0] === '--dry-run'))
    throw new Error(
      'Use no arguments to clean eligible owned output, or --dry-run. Arbitrary paths are refused.',
    );
  const report = cleanupArtifacts(process.cwd(), { dryRun: args[0] === '--dry-run' });
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}

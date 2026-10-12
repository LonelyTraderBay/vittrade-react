import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanupArtifacts, storageWarnings } from './cleanup-artifacts.mjs';
import { acquireArtifactConsumer, cleanupPolicy, withArtifactLock } from './artifact-lifecycle.mjs';

const fixtures = [];
const children = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const child of children.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) {
      const closed = once(child, 'close');
      child.kill();
      await closed;
    }
  }
  for (const root of fixtures.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vittrade-cleanup-owned-'));
  fixtures.push(root);
  fs.writeFileSync(path.join(root, '.gitignore'), '.artifacts/\n');
  fs.writeFileSync(path.join(root, 'source.txt'), 'preserve');
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  return root;
}
function run(root, id = 'run', overrides = {}) {
  const directory = path.join(root, '.artifacts/runs', id);
  for (const part of ['cache', 'dist', 'coverage', 'test-results', 'playwright-report']) {
    fs.mkdirSync(path.join(directory, part), { recursive: true });
    fs.writeFileSync(path.join(directory, part, 'sentinel'), part);
  }
  fs.writeFileSync(
    path.join(directory, 'run.json'),
    JSON.stringify({
      schemaVersion: 1,
      id,
      ownerPid: 2147483647,
      childPid: 2147483646,
      childClosed: true,
      retention: cleanupPolicy,
      command: 'vitest',
      args: [],
      buildEnvironment: { nodeEnv: null },
      status: 'passed',
      sourceUnchanged: true,
      finishedAt: '2026-10-12T00:00:00Z',
      ...overrides,
    }),
  );
  return directory;
}

it('dry-runs, then deletes only disposable cache/output, preserves evidence bytes and is idempotent', () => {
  const root = fixture(),
    directory = run(root);
  const manifest = fs.readFileSync(path.join(directory, 'run.json'));
  expect(cleanupArtifacts(root, { dryRun: true }).eligibleFiles).toBe(2);
  expect(fs.existsSync(path.join(directory, 'cache/sentinel'))).toBe(true);
  const report = cleanupArtifacts(root);
  expect(report.errors).toEqual([]);
  expect(report.deletedFiles).toBe(2);
  for (const part of ['cache', 'dist'])
    expect(fs.existsSync(path.join(directory, part))).toBe(false);
  for (const part of ['coverage', 'test-results', 'playwright-report'])
    expect(fs.readFileSync(path.join(directory, part, 'sentinel'), 'utf8')).toBe(part);
  expect(fs.readFileSync(path.join(directory, 'run.json'))).toEqual(manifest);
  expect(fs.readFileSync(path.join(root, 'source.txt'), 'utf8')).toBe('preserve');
  expect(cleanupArtifacts(root).deletedFiles).toBe(0);
});

it('keeps the latest production build until a replacement passes, and keeps failed/changed-source output', () => {
  const root = fixture();
  const old = run(root, 'old', { command: 'build' });
  const latest = run(root, 'latest', { command: 'build', finishedAt: '2026-10-12T01:00:00Z' });
  const failed = run(root, 'failed', {
    status: 'failed',
    command: 'build',
    finishedAt: '2026-10-12T02:00:00Z',
  });
  const changed = run(root, 'changed', { sourceUnchanged: false });
  expect(cleanupArtifacts(root).errors).toEqual([]);
  expect(fs.existsSync(path.join(old, 'dist'))).toBe(false);
  for (const directory of [latest, failed, changed]) {
    expect(fs.existsSync(path.join(directory, 'dist/sentinel'))).toBe(true);
    expect(fs.existsSync(path.join(directory, 'cache'))).toBe(false);
  }
});

it('protects legacy, interrupted, malformed and unfinished runs', () => {
  const root = fixture();
  const kept = [
    run(root, 'legacy', { retention: 'manual-review-only' }),
    run(root, 'interrupted', { signal: 'SIGTERM' }),
    run(root, 'running', { childClosed: false, status: 'running' }),
    run(root, 'malformed'),
  ];
  fs.writeFileSync(path.join(kept[3], 'run.json'), '{');
  const report = cleanupArtifacts(root);
  expect(report.deletedFiles).toBe(0);
  expect(report.retained).toHaveLength(4);
  for (const directory of kept)
    expect(fs.existsSync(path.join(directory, 'cache/sentinel'))).toBe(true);
});

it('protects both a live owner and an orphaned live child', async () => {
  const root = fixture();
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
  children.push(child);
  await once(child, 'spawn');
  run(root, 'live-owner', { ownerPid: process.pid });
  run(root, 'live-child', { childPid: child.pid });
  const report = cleanupArtifacts(root);
  expect(report.deletedFiles).toBe(0);
  expect(report.retained.map((x) => x.reason)).toEqual([
    'Run child is still alive',
    'Run owner is still alive',
  ]);
});

it('serializes consumers with cleanup and retains a build being used by a preview/gate', async () => {
  const root = fixture();
  const old = run(root, 'old', { command: 'build' });
  run(root, 'latest', { command: 'build', finishedAt: '2026-10-12T01:00:00Z' });
  const consumer = acquireArtifactConsumer(root, () => old);
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
  children.push(child);
  await once(child, 'spawn');
  consumer.started(child.pid);
  expect(cleanupArtifacts(root).retained).toContainEqual({
    run: 'old',
    reason: 'Active artifact consumer',
  });
  expect(fs.existsSync(path.join(old, 'dist/sentinel'))).toBe(true);
  expect(() => withArtifactLock(root, () => cleanupArtifacts(root))).toThrow(/locked/);
  expect(() => consumer.release()).toThrow(/still alive/);
  const closed = once(child, 'close');
  child.kill();
  await closed;
  consumer.release();
  expect(cleanupArtifacts(root).errors).toEqual([]);
  expect(fs.existsSync(path.join(old, 'dist'))).toBe(false);
});

it('keeps both relative and JSON-escaped absolute evidence references, including uncommitted evidence', () => {
  const root = fixture();
  const relative = run(root, 'relative');
  const absolute = run(root, 'absolute');
  fs.writeFileSync(path.join(root, 'evidence.md'), '[run](.artifacts/runs/relative/run.json)');
  fs.writeFileSync(
    path.join(root, 'evidence.json'),
    JSON.stringify({ path: path.join(absolute, 'run.json').replaceAll('/', '\\') }),
  );
  const report = cleanupArtifacts(root);
  expect(report.deletedFiles).toBe(0);
  for (const directory of [relative, absolute])
    expect(fs.existsSync(path.join(directory, 'cache/sentinel'))).toBe(true);
});

it('never deletes force-tracked output even if the directory is ignored', () => {
  const root = fixture(),
    directory = run(root);
  execFileSync('git', ['add', '--force', '.artifacts/runs/run/cache/sentinel'], { cwd: root });
  expect(cleanupArtifacts(root).deletedFiles).toBe(0);
  expect(fs.readFileSync(path.join(directory, 'cache/sentinel'), 'utf8')).toBe('cache');
});

it('refuses junctions, hard links and a missing ignore policy without touching outside data', () => {
  const root = fixture(),
    directory = run(root);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'vittrade-cleanup-outside-'));
  fixtures.push(outside);
  fs.writeFileSync(path.join(outside, 'sentinel'), 'outside');
  fs.symlinkSync(
    outside,
    path.join(directory, 'cache/link'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  expect(cleanupArtifacts(root).errors[0].reason).toMatch(/Reparse/);
  expect(fs.readFileSync(path.join(outside, 'sentinel'), 'utf8')).toBe('outside');
  fs.unlinkSync(path.join(directory, 'cache/link'));
  fs.linkSync(path.join(outside, 'sentinel'), path.join(directory, 'cache/hard-link'));
  expect(cleanupArtifacts(root).errors[0].reason).toMatch(/hard-linked/);
  fs.writeFileSync(path.join(root, '.gitignore'), '');
  expect(() => cleanupArtifacts(root)).toThrow();
  expect(fs.existsSync(path.join(directory, 'cache/sentinel'))).toBe(true);
});

it('reports partial deletion and preserves remaining output when a file changes during deletion', () => {
  const root = fixture(),
    directory = run(root);
  const original = fs.unlinkSync;
  vi.spyOn(fs, 'unlinkSync').mockImplementation((target) => {
    original(target);
    if (target === path.join(directory, 'cache/sentinel'))
      fs.writeFileSync(path.join(directory, 'dist/sentinel'), 'changed during deletion');
  });
  const report = cleanupArtifacts(root);
  expect(report.deletedFiles).toBe(1);
  expect(report.errors[0].reason).toMatch(/changed before deletion/);
  expect(fs.readFileSync(path.join(directory, 'dist/sentinel'), 'utf8')).toBe(
    'changed during deletion',
  );
});

it('warns at measured storage thresholds without authorizing deletion of protected evidence', () => {
  expect(storageWarnings({ freeBytes: 19 * 1024 ** 3, artifactBytes: 2 * 1024 ** 3 })).toHaveLength(
    2,
  );
  expect(storageWarnings({ freeBytes: 30 * 1024 ** 3, artifactBytes: 0 })).toEqual([]);
});

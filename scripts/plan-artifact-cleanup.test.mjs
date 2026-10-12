import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { planCleanup, validateCleanup } from './plan-artifact-cleanup.mjs';

const fixtures = [];
afterEach(() => {
  for (const root of fixtures.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vittrade-retention-test-'));
  fixtures.push(root);
  const run = path.join(root, '.artifacts/runs/test-run');
  fs.mkdirSync(path.join(run, 'cache'), { recursive: true });
  fs.mkdirSync(path.join(run, 'coverage'));
  fs.mkdirSync(path.join(run, 'test-results'));
  fs.writeFileSync(
    path.join(run, 'run.json'),
    JSON.stringify({
      schemaVersion: 1,
      id: 'test-run',
      ownerPid: 2147483647,
      status: 'passed',
      finishedAt: '2026-10-12T00:00:00Z',
    }),
  );
  fs.writeFileSync(path.join(run, 'cache', 'temporary'), 'temporary-cache');
  fs.writeFileSync(path.join(run, 'coverage', 'coverage-final.json'), '{}');
  fs.writeFileSync(path.join(run, 'test-results', 'failure.png'), 'golden');
  return { root, run };
}
it('plans only cache/build outputs and leaves coverage, failure assets and owner manifest intact', () => {
  const { root, run } = fixture();
  const plan = planCleanup(root, run);
  expect(plan.files.map((x) => x.path)).toEqual(['.artifacts/runs/test-run/cache/temporary']);
  expect(validateCleanup(plan)).toEqual(plan);
  expect(fs.readFileSync(path.join(run, 'cache/temporary'), 'utf8')).toBe('temporary-cache');
});
it('rejects source, evidence, dependencies and sibling worktrees', () => {
  const { root } = fixture();
  for (const relative of ['src', 'docs/evidence', 'node_modules', '../other-worktree']) {
    expect(() => planCleanup(root, path.resolve(root, relative))).toThrow();
  }
});
it('refuses an unfinished run and a finished manifest whose owner is still alive', () => {
  const { root, run } = fixture();
  const manifest = path.join(run, 'run.json');
  fs.writeFileSync(
    manifest,
    JSON.stringify({ schemaVersion: 1, id: 'test-run', ownerPid: process.pid, status: 'running' }),
  );
  expect(() => planCleanup(root, run)).toThrow(/Unfinished/);
  fs.writeFileSync(
    manifest,
    JSON.stringify({
      schemaVersion: 1,
      id: 'test-run',
      ownerPid: process.pid,
      status: 'passed',
      finishedAt: 'now',
    }),
  );
  expect(() => planCleanup(root, run)).toThrow(/still alive/);
});
it('invalidates a plan after content changes, added files or changed owner metadata', () => {
  for (const mutation of ['content', 'new', 'manifest']) {
    const { root, run } = fixture();
    const plan = planCleanup(root, run);
    const relative =
      mutation === 'content' ? 'cache/temporary' : mutation === 'new' ? 'cache/new' : 'run.json';
    if (mutation === 'manifest') fs.appendFileSync(path.join(run, relative), ' ');
    else fs.writeFileSync(path.join(run, relative), 'changed');
    expect(() => validateCleanup(plan)).toThrow(/changed since review/);
  }
});
it('refuses a junction/reparse child and a directory replaced after review', () => {
  const { root, run } = fixture();
  const plan = planCleanup(root, run);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'vittrade-retention-outside-'));
  fixtures.push(outside);
  fs.writeFileSync(path.join(outside, 'sentinel'), 'keep');
  fs.renameSync(path.join(run, 'cache'), path.join(run, 'cache-preserved'));
  fs.symlinkSync(
    outside,
    path.join(run, 'cache'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  expect(() => validateCleanup(plan)).toThrow(/Reparse/);
  expect(fs.readFileSync(path.join(outside, 'sentinel'), 'utf8')).toBe('keep');
});
it('invalidates review when a file is replaced with identical bytes under a different file ID', () => {
  const { root, run } = fixture();
  const original = path.join(run, 'cache/temporary');
  const plan = planCleanup(root, run);
  const identity = fs.lstatSync(original, { bigint: true });
  expect(plan.files[0].fileId).toBe(`${identity.dev}:${identity.ino}`);
  fs.renameSync(original, path.join(run, 'preserved-original'));
  fs.writeFileSync(original, 'temporary-cache');
  const replacement = planCleanup(root, run);
  expect(replacement.files[0].sha256).toBe(plan.files[0].sha256);
  expect(replacement.files[0].fileId).not.toBe(plan.files[0].fileId);
  expect(() => validateCleanup(plan)).toThrow(/changed since review/);
});
it('rejects modified plans that try to add an arbitrary source file', () => {
  const { root, run } = fixture();
  const plan = planCleanup(root, run);
  plan.files.push({ path: 'src/main.tsx', bytes: 1, fileId: 'x', sha256: 'x' });
  expect(() => validateCleanup(plan)).toThrow(/changed since review/);
});

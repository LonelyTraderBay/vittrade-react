import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { sourceSnapshot } from './run-with-artifacts.mjs';
import { findBuildArtifact } from './check-build-artifact.mjs';

const fixtures = [];
afterEach(() => {
  for (const root of fixtures.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vittrade-output-owner-'));
  fixtures.push(root);
  fs.writeFileSync(path.join(root, '.gitignore'), '.artifacts/\nnode_modules/\n');
  fs.writeFileSync(path.join(root, 'source.txt'), 'original');
  for (const args of [
    ['init', '--quiet'],
    ['config', 'user.name', 'Output test'],
    ['config', 'user.email', 'output@example.test'],
    ['add', '.'],
    ['commit', '--quiet', '-m', 'fixture'],
  ])
    execFileSync('git', args, { cwd: root });
  return root;
}
it('isolates repeated runs without copying source or touching pre-existing output', () => {
  const root = fixture();
  fs.mkdirSync(path.join(root, 'node_modules/vitest'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'node_modules/vitest/vitest.mjs'),
    "import fs from 'node:fs'; fs.writeFileSync(process.env.VITTRADE_RUN_DIR+'/observed.txt',process.env.VITTRADE_RUN_DIR);",
  );
  // Deliberately ignored old output remains untouched by the owner wrapper.
  fs.appendFileSync(path.join(root, '.gitignore'), 'dist/\n');
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'dist/old'), 'keep');
  const moduleUrl = pathToFileURL(path.resolve('scripts/run-with-artifacts.mjs')).href;
  for (let i = 0; i < 2; i++) {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import {runWithArtifacts} from ${JSON.stringify(moduleUrl)};runWithArtifacts('vitest',[],${JSON.stringify(root)});`,
      ],
      { encoding: 'utf8' },
    );
    expect(result.status, result.stderr).toBe(0);
  }
  const names = fs.readdirSync(path.join(root, '.artifacts/runs'));
  expect(names).toHaveLength(2);
  for (const name of names) {
    const run = path.join(root, '.artifacts/runs', name);
    const manifest = JSON.parse(fs.readFileSync(path.join(run, 'run.json')));
    expect(manifest.status).toBe('passed');
    expect(manifest.sourceUnchanged).toBe(true);
    expect(fs.existsSync(path.join(run, 'source.txt'))).toBe(false);
  }
  expect(fs.readFileSync(path.join(root, 'dist/old'), 'utf8')).toBe('keep');
});
it('refuses old or unfinished builds, and invalidates a successful artifact after a source edit', () => {
  const root = fixture();
  const readinessOwner = path.join(
    root,
    'docs/architecture/production-readiness/check-tracking.mjs',
  );
  fs.mkdirSync(path.dirname(readinessOwner), { recursive: true });
  fs.writeFileSync(readinessOwner, 'export const checkerVersion = 1;');
  expect(() => findBuildArtifact(root)).toThrow(/No successful/);
  const run = path.join(root, '.artifacts/runs/build');
  fs.mkdirSync(run, { recursive: true });
  const snapshot = sourceSnapshot(root);
  const manifest = {
    command: 'build',
    args: [],
    buildEnvironment: { nodeEnv: null },
    status: 'running',
    sourceUnchanged: true,
    snapshot,
    finishedAt: '2026-10-12T00:00:00Z',
  };
  fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify(manifest));
  expect(() => findBuildArtifact(root)).toThrow(/No successful/);
  manifest.status = 'passed';
  fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify(manifest));
  expect(findBuildArtifact(root)).toBe(run);
  manifest.args = ['--mode', 'development'];
  fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify(manifest));
  expect(() => findBuildArtifact(root)).toThrow(/No successful/);
  manifest.args = [];
  manifest.buildEnvironment.nodeEnv = 'development';
  fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify(manifest));
  expect(() => findBuildArtifact(root)).toThrow(/No successful/);
  manifest.buildEnvironment.nodeEnv = null;
  fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify(manifest));
  fs.writeFileSync(readinessOwner, 'export const checkerVersion = 2;');
  expect(() => findBuildArtifact(root)).toThrow(/No successful/);
  fs.writeFileSync(readinessOwner, 'export const checkerVersion = 1;');
  fs.writeFileSync(path.join(root, 'source.txt'), 'modified');
  expect(() => findBuildArtifact(root)).toThrow(/No successful/);
});
it('refuses build output overrides before creating a run or launching the child', () => {
  const root = fixture();
  const moduleUrl = pathToFileURL(path.resolve('scripts/run-with-artifacts.mjs')).href;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {runWithArtifacts} from ${JSON.stringify(moduleUrl)};runWithArtifacts('build',['--outDir','dist'],${JSON.stringify(root)});`,
    ],
    { encoding: 'utf8' },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/Owned builds require production/);
  expect(fs.existsSync(path.join(root, '.artifacts'))).toBe(false);
});
it('marks evidence invalid and fails the wrapper when source changes while the child runs', () => {
  const root = fixture();
  fs.mkdirSync(path.join(root, 'node_modules/vitest'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'node_modules/vitest/vitest.mjs'),
    "import fs from 'node:fs'; fs.writeFileSync('source.txt','modified during test');",
  );
  const moduleUrl = pathToFileURL(path.resolve('scripts/run-with-artifacts.mjs')).href;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {runWithArtifacts} from ${JSON.stringify(moduleUrl)};runWithArtifacts('vitest',[],${JSON.stringify(root)});`,
    ],
    { encoding: 'utf8' },
  );
  expect(result.status).toBe(1);
  const name = fs.readdirSync(path.join(root, '.artifacts/runs'))[0];
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, '.artifacts/runs', name, 'run.json')),
  );
  expect(manifest.sourceUnchanged).toBe(false);
});

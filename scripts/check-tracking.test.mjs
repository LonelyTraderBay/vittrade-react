import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkerPath = path.join(
  repositoryRoot,
  'docs/architecture/production-readiness/check-tracking.mjs',
);
const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function createFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vittrade-check-tracking-'));
  temporaryRoots.push(root);
  const trackingDirectory = path.join(root, 'docs/architecture/production-readiness');
  mkdirSync(trackingDirectory, { recursive: true });
  mkdirSync(path.join(root, 'docs/architecture'), { recursive: true });
  mkdirSync(path.join(root, 'src'), { recursive: true });

  const sources = {
    'AI_RULES.md': '# Protected project instructions\n',
    'docs/architecture/page-inventory.json': JSON.stringify({ pages: [], routes: [] }, null, 2),
    'src/example.ts': 'export const example = true;\n',
  };
  for (const [relativePath, content] of Object.entries(sources)) {
    const absolutePath = path.join(root, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }

  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Tracking checker test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'tracking-checker@example.test'], { cwd: root });
  execFileSync('git', ['add', '--all'], { cwd: root });
  execFileSync('git', ['commit', '--quiet', '--allow-empty', '-m', 'tracking checker fixture'], {
    cwd: root,
  });
  const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const taskFile = (relativePath, role) => ({
    path: relativePath,
    baselineSha256: null,
    cataloguedSourceHead: sourceHead,
    cataloguedSha256: createHash('sha256')
      .update(readFileSync(path.join(root, relativePath)))
      .digest('hex'),
    lifecycle: 'active',
    taskIds: ['T01'],
    disposition: 'scoped',
    reason: '',
    evidenceIds: [],
    changeIds: [],
    executionScope: {
      ownerTaskId: 'T01',
      role,
      stepIds: ['T01.01'],
      action: 'review_then_fix_only_if_acceptance_gap',
    },
  });
  const tracking = {
    schemaVersion: 1,
    baseline: { sourceHead },
    executionPlan: {
      version: 1,
      canonicalStepFileMapping: 'files[].executionScope.stepIds',
      protectedPaths: ['AI_RULES.md'],
    },
    checkpoint: { nextTask: 'T01', nextStep: 'T01.01' },
    milestones: [],
    tasks: [
      {
        id: 'T01',
        status: 'todo',
        evidenceIds: [],
        dependsOn: [],
        pageIds: [],
        routeIds: [],
        operationIds: [],
        changeIds: [],
        sourceFiles: ['src/example.ts'],
        steps: [{ id: 'T01.01', status: 'todo', evidenceIds: [] }],
      },
    ],
    pages: [],
    routes: [],
    operations: [],
    files: [
      taskFile('AI_RULES.md', 'protected_instruction'),
      taskFile('docs/architecture/page-inventory.json', 'inventory'),
      taskFile('src/example.ts', 'source'),
    ],
    changes: [],
    evidence: [],
    decisions: [],
  };
  const trackingPath = path.join(trackingDirectory, 'TRACKING.json');
  const inventoryPath = path.join(root, 'docs/architecture/page-inventory.json');
  writeFileSync(trackingPath, `${JSON.stringify(tracking, null, 2)}\n`);
  writeFileSync(path.join(trackingDirectory, 'PLAN.md'), '### T01 — Fixture\n\n**T01.01**\n');
  return { root, tracking, trackingPath, inventoryPath };
}

function runChecker(root) {
  const result = spawnSync(process.execPath, [checkerPath, '--root', root], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  const report = JSON.parse(result.stdout);
  return { status: result.status, report };
}

function saveTracking(fixture) {
  writeFileSync(fixture.trackingPath, `${JSON.stringify(fixture.tracking, null, 2)}\n`);
}

describe('production-readiness tracking checker', () => {
  it('accepts a complete catalog with valid step mapping and source hashes', () => {
    const fixture = createFixture();
    const result = runChecker(fixture.root);

    expect(result.status).toBe(0);
    expect(result.report.errorCount).toBe(0);
  });

  it('rejects a repository path missing from the catalog', () => {
    const fixture = createFixture();
    writeFileSync(path.join(fixture.root, 'src/unregistered.ts'), 'export {};\n');

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain('Files: missing ledger entry src/unregistered.ts');
  });

  it('rejects a file scope that references an unknown step', () => {
    const fixture = createFixture();
    fixture.tracking.files[0].executionScope.stepIds = ['T99.01'];
    saveTracking(fixture);

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain(
      'AI_RULES.md: executionScope references unknown step T99.01',
    );
  });

  it('requires the execution-scope owner to be listed in taskIds', () => {
    const fixture = createFixture();
    fixture.tracking.files[0].taskIds = [];
    saveTracking(fixture);

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain(
      'AI_RULES.md: executionScope owner is missing from taskIds',
    );
  });

  it('rejects a step removed from every file mapping', () => {
    const fixture = createFixture();
    for (const file of fixture.tracking.files) file.executionScope.stepIds = [];
    saveTracking(fixture);

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain('T01.01: no file is mapped to this step');
  });

  it('rejects an inventory that no longer matches the ledger', () => {
    const fixture = createFixture();
    writeFileSync(
      fixture.inventoryPath,
      JSON.stringify({ pages: [{ path: 'src/pages/stale.tsx' }], routes: [] }, null, 2),
    );

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain('Pages: missing ledger entry src/pages/stale.tsx');
  });

  it('rejects a stale catalogued source hash', () => {
    const fixture = createFixture();
    fixture.tracking.files.find((file) => file.path === 'src/example.ts').cataloguedSha256 =
      '0'.repeat(64);
    saveTracking(fixture);

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain(
      'src/example.ts: cataloguedSha256 does not match cataloguedSourceHead',
    );
  });

  it('rejects source content changed after the catalogued source commit', () => {
    const fixture = createFixture();
    writeFileSync(path.join(fixture.root, 'src/example.ts'), 'export const example = false;\n');

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain(
      'src/example.ts: current source differs from cataloguedSourceHead',
    );
  });

  it('requires source snapshot hashes for every active repository file', () => {
    const fixture = createFixture();
    const source = fixture.tracking.files.find((file) => file.path === 'src/example.ts');
    delete source.cataloguedSourceHead;
    delete source.cataloguedSha256;
    saveTracking(fixture);

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain('src/example.ts: missing catalogued source head/hash');
  });

  it('requires protected instruction paths to remain explicitly protected', () => {
    const fixture = createFixture();
    fixture.tracking.files[0].executionScope.role = 'source';
    saveTracking(fixture);

    const result = runChecker(fixture.root);

    expect(result.status).toBe(1);
    expect(result.report.errors).toContain(
      'Protected instruction has the wrong scope role: AI_RULES.md',
    );
  });
});

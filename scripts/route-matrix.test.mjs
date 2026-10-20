import { execFileSync, spawnSync } from 'node:child_process';
import { copyFile, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = 'docs/architecture/production-readiness/evidence/C06/generate-route-matrix.mjs';
const matrixPath =
  'docs/architecture/production-readiness/evidence/C06/c06-01-route-matrix-2026-10-15-19593f88.json';
const inventoryPath = 'docs/architecture/page-inventory.json';
const trackingPath = 'docs/architecture/production-readiness/TRACKING.json';
const workspaces = [];

afterEach(async () => {
  for (const root of workspaces.splice(0)) {
    const absolute = resolve(root);
    if (
      dirname(absolute) !== resolve(tmpdir()) ||
      !absolute.startsWith(join(resolve(tmpdir()), 'vittrade-route-matrix-')) ||
      (await lstat(absolute)).isSymbolicLink()
    )
      throw new Error('Refusing to remove an unowned fixture workspace');
    await rm(absolute, { recursive: true, force: true });
  }
});

async function workspace() {
  const root = await mkdtemp(join(tmpdir(), 'vittrade-route-matrix-'));
  workspaces.push(root);
  const pagePath = 'src/features/sample/pages/SamplePage.tsx';
  const route = {
    id: 'ROUTE-sample',
    lifecycle: 'active',
    source: 'src/features/sample/routes.ts',
    path: 'sample',
    component: 'SamplePage',
    classification: 'implemented',
    resolvedUrls: ['/sample'],
    pageIds: ['PAGE-sample'],
  };
  const inventory = {
    pages: [{ path: pagePath }],
    routes: [{ ...route }],
    components: [{ path: 'src/shared/ui/Existing.tsx' }],
    dataModules: [],
    services: [],
    mocks: [],
  };
  const tracking = {
    pages: [{ id: 'PAGE-sample', lifecycle: 'active', path: pagePath }],
    routes: [route],
  };
  for (const [file, value] of [
    [inventoryPath, JSON.stringify(inventory)],
    [trackingPath, JSON.stringify(tracking)],
    [pagePath, 'export const SamplePage = () => null;'],
  ]) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), value);
  }
  await mkdir(dirname(join(root, scriptPath)), { recursive: true });
  await copyFile(scriptPath, join(root, scriptPath));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '--quiet');
  git('config', 'user.name', 'Route Matrix Test');
  git('config', 'user.email', 'route-matrix@example.invalid');
  git('add', '--', '.');
  git('commit', '--quiet', '-m', 'Baseline fixture');
  const head = git('rev-parse', 'HEAD');
  const run = (mode, sourceHead = head) =>
    spawnSync(process.execPath, [join(root, scriptPath), '--source-head', sourceHead, mode], {
      cwd: root,
      encoding: 'utf8',
    });
  const generated = run('--write');
  expect(generated.status, generated.stderr).toBe(0);
  const originalMatrix = await readFile(join(root, matrixPath), 'utf8');
  return { root, head, inventory, tracking, originalMatrix, run };
}

describe('Frozen route matrix and live topology contract', () => {
  it('allows module inventory growth while preserving baseline counts and bytes', async () => {
    const fixture = await workspace();
    fixture.inventory.components.push({ path: 'src/shared/ui/NewSlot.tsx' });
    fixture.inventory.services.push({ path: 'src/shared/service/new.ts' });
    await writeFile(join(fixture.root, inventoryPath), JSON.stringify(fixture.inventory));
    const result = fixture.run('--check');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('runtime rows tested: 0');
    expect(await readFile(join(fixture.root, matrixPath), 'utf8')).toBe(fixture.originalMatrix);
  });

  it.each(['module-count', 'runtime-coverage'])(
    'rejects frozen snapshot tampering: %s',
    async (kind) => {
      const fixture = await workspace();
      const matrix = JSON.parse(fixture.originalMatrix);
      if (kind === 'module-count') matrix.scope.inventory.componentFiles = 999;
      else matrix.scope.runtimeCoverage.c06BaselineExecution.routeRowsWithBrowserRuntimeChecks = 1;
      await writeFile(join(fixture.root, matrixPath), JSON.stringify(matrix, null, 2) + '\n');
      expect(fixture.run('--check').status).toBe(1);
    },
  );

  it.each(['alias', 'owner', 'inventory-ledger-mismatch'])(
    'rejects live topology drift: %s',
    async (kind) => {
      const fixture = await workspace();
      if (kind === 'alias') fixture.tracking.routes[0].resolvedUrls = ['/another'];
      if (kind === 'owner') {
        fixture.tracking.pages[0].path = 'src/features/sample/pages/OtherPage.tsx';
        fixture.inventory.pages[0].path = fixture.tracking.pages[0].path;
        await writeFile(
          join(fixture.root, fixture.tracking.pages[0].path),
          'export const OtherPage = () => null;',
        );
      }
      if (kind === 'inventory-ledger-mismatch') fixture.inventory.routes[0].path = 'untracked';
      await writeFile(join(fixture.root, inventoryPath), JSON.stringify(fixture.inventory));
      await writeFile(join(fixture.root, trackingPath), JSON.stringify(fixture.tracking));
      expect(fixture.run('--check').status).toBe(1);
      expect(await readFile(join(fixture.root, matrixPath), 'utf8')).toBe(fixture.originalMatrix);
    },
  );

  it('fails closed when the pinned baseline Git inputs are missing', async () => {
    const fixture = await workspace();
    const result = fixture.run('--check', '0'.repeat(40));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Cannot read baseline Git inputs');
  });
});

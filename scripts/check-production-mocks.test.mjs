import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { it } from 'vitest';

const checkerPath = resolve(process.cwd(), 'scripts', 'check-production-mocks.mjs');

async function runGate(outputFiles) {
  const root = await mkdtemp(join(tmpdir(), 'vittrade-production-mocks-'));
  const dist = join(root, 'dist');
  try {
    for (const [relativePath, contents] of Object.entries(outputFiles)) {
      const filePath = join(dist, relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, contents);
    }

    const result = spawnSync(process.execPath, [checkerPath], {
      cwd: root,
      encoding: 'utf8',
    });
    if (result.error) throw result.error;
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

it('accepts a clean production artifact with a valid Vite manifest', async () => {
  const result = await runGate({
    'index.html': '<html><script type="module" src="/assets/app.js"></script></html>',
    'assets/app.js': 'console.log("production app");',
    'assets/app.css': 'body { color: black; }',
    '.vite/manifest.json': JSON.stringify({
      'src/main.tsx': { file: 'assets/app.js', isEntry: true, css: ['assets/app.css'] },
    }),
  });

  assert.equal(result.status, 0, result.output);
  assert.match(
    result.output,
    /4 output files inventoried, 1 JavaScript files and 1 manifests inspected/,
  );
});

it('rejects a copied worker by output path even when its content has no known marker', async () => {
  const result = await runGate({
    'assets/app.js': 'console.log("production app");',
    'mockServiceWorker.js': 'self.addEventListener("install", () => {});',
  });

  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /mockServiceWorker\.js: forbidden development worker file path/);
});

it('rejects a Vite manifest reference to the worker even when it is not emitted', async () => {
  const result = await runGate({
    'assets/app.js': 'console.log("production app");',
    '.vite/manifest.json': JSON.stringify({
      'public/mockServiceWorker.js': { file: 'mockServiceWorker.js', isEntry: true },
    }),
  });

  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /manifest\.json: references forbidden mockServiceWorker\.js/);
});

it('retains the existing development fixture marker check in JavaScript', async () => {
  const result = await runGate({ 'assets/app.js': 'const leakedFixture = launchpadData;' });

  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /assets\/app\.js: launchpadData/);
});

it('fails closed when an emitted manifest cannot be parsed', async () => {
  const result = await runGate({
    'assets/app.js': 'console.log("production app");',
    '.vite/manifest.json': '{not-json',
  });

  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /manifest\.json: invalid JSON manifest/);
});

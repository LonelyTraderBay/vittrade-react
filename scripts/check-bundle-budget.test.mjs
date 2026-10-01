import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = path.join(process.cwd(), 'scripts/check-bundle-budget.mjs');
const sourceCommit = 'a'.repeat(40);
let workspace;

async function createWorkspace() {
  workspace = await mkdtemp(path.join(tmpdir(), 'vittrade-bundle-budget-'));
  await mkdir(path.join(workspace, 'dist/assets'), { recursive: true });
}

function runCheck(sha = sourceCommit, writeManifest = true) {
  return spawnSync(
    process.execPath,
    writeManifest ? [scriptPath, '--manifest', 'ci-evidence/bundle-manifest.json'] : [scriptPath],
    {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_SHA: sha,
        GITHUB_REPOSITORY: 'example/vittrade-react',
        GITHUB_RUN_ID: '12345',
        GITHUB_RUN_ATTEMPT: '2',
        GITHUB_SERVER_URL: 'https://github.com',
      },
    },
  );
}

afterEach(async () => {
  if (workspace) await rm(workspace, { recursive: true, force: true });
  workspace = undefined;
});

describe('bundle budget CI manifest', () => {
  it('records the exact commit and stable per-chunk measurements', async () => {
    await createWorkspace();
    const files = {
      'z.js': 'console.log("z");\n',
      'a.js': 'console.log("a");\n',
    };
    for (const [name, content] of Object.entries(files)) {
      await writeFile(path.join(workspace, 'dist/assets', name), content, 'utf8');
    }

    const result = runCheck();
    const manifest = JSON.parse(
      await readFile(path.join(workspace, 'ci-evidence/bundle-manifest.json'), 'utf8'),
    );

    expect(result.status).toBe(0);
    expect(manifest).toMatchObject({
      purpose: expect.stringContaining('not a deployable'),
      sourceCommit,
      deployableArtifact: false,
      workflowRun: {
        repository: 'example/vittrade-react',
        runId: '12345',
        runAttempt: '2',
        url: 'https://github.com/example/vittrade-react/actions/runs/12345',
      },
      budget: { result: 'pass', chunkCount: 2, failedChunkCount: 0 },
    });
    expect(manifest.chunks.map(({ path: file }) => file)).toEqual(['assets/a.js', 'assets/z.js']);
    expect(manifest.chunks[0]).toMatchObject({
      sha256: createHash('sha256').update(files['a.js']).digest('hex'),
      rawBytes: Buffer.byteLength(files['a.js']),
      withinBudget: true,
    });
  });

  it('writes a failing manifest when a chunk exceeds the raw-size budget', async () => {
    await createWorkspace();
    await writeFile(path.join(workspace, 'dist/assets/large.js'), 'a'.repeat(500_001), 'utf8');

    const result = runCheck();
    const manifest = JSON.parse(
      await readFile(path.join(workspace, 'ci-evidence/bundle-manifest.json'), 'utf8'),
    );

    expect(result.status).toBe(1);
    expect(manifest.budget).toMatchObject({ result: 'fail', failedChunkCount: 1 });
    expect(manifest.chunks[0]).toMatchObject({ path: 'assets/large.js', withinBudget: false });
  });

  it('rejects a missing or abbreviated source commit before writing a manifest', async () => {
    await createWorkspace();

    const result = runCheck('short-sha');

    expect(result.status).toBe(2);
    await expect(
      readFile(path.join(workspace, 'ci-evidence/bundle-manifest.json'), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves the existing budget-only invocation without requiring CI metadata', async () => {
    await createWorkspace();
    await writeFile(path.join(workspace, 'dist/assets/app.js'), 'console.log("app");\n', 'utf8');

    const result = runCheck('not-a-commit-sha', false);

    expect(result.status).toBe(0);
    await expect(
      readFile(path.join(workspace, 'ci-evidence/bundle-manifest.json'), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

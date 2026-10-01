import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const checkerPath = path.join(process.cwd(), 'scripts/check-ci-evidence-artifact.mjs');
const sourceCommit = 'b'.repeat(40);
let root;

async function createArtifact({
  includeReport = true,
  includeDist = false,
  includeTestResults = true,
} = {}) {
  root = await mkdtemp(path.join(os.tmpdir(), 'vittrade-ci-artifact-'));
  await mkdir(path.join(root, 'ci-evidence'), { recursive: true });
  await mkdir(path.join(root, 'coverage'), { recursive: true });
  await writeFile(path.join(root, 'coverage/coverage-final.json'), '{}\n');
  if (includeTestResults) {
    await mkdir(path.join(root, 'test-results/retry-case'), { recursive: true });
    await writeFile(path.join(root, 'test-results/.last-run.json'), '{}\n');
    await writeFile(path.join(root, 'test-results/retry-case/trace.zip'), 'trace fixture');
  }
  await mkdir(path.join(root, 'playwright-report'), { recursive: true });
  if (includeReport)
    await writeFile(path.join(root, 'playwright-report/index.html'), '<html></html>\n');
  if (includeDist) {
    await mkdir(path.join(root, 'dist/assets'), { recursive: true });
    await writeFile(path.join(root, 'dist/assets/app.js'), '');
  }

  const metadata = {
    sourceCommit,
    repository: 'LonelyTraderBay/vittrade-react',
    runId: '36838559109',
    runAttempt: '1',
  };
  const manifest = {
    sourceCommit,
    deployableArtifact: false,
    workflowRun: {
      repository: metadata.repository,
      runId: metadata.runId,
      runAttempt: metadata.runAttempt,
      url: `https://github.com/${metadata.repository}/actions/runs/${metadata.runId}`,
    },
    budget: { result: 'pass', chunkCount: 1, failedChunkCount: 0 },
    chunks: [
      {
        sha256: 'c'.repeat(64),
        rawBytes: 1024,
        gzipBytes: 512,
        withinBudget: true,
      },
    ],
  };
  await writeFile(
    path.join(root, 'ci-evidence/run-metadata.json'),
    `${JSON.stringify(metadata)}\n`,
  );
  await writeFile(
    path.join(root, 'ci-evidence/bundle-manifest.json'),
    `${JSON.stringify(manifest)}\n`,
  );
  return {
    metadataPath: path.join(root, 'ci-evidence/run-metadata.json'),
    manifestPath: path.join(root, 'ci-evidence/bundle-manifest.json'),
  };
}

function runCheck(expectedCommit = sourceCommit) {
  return spawnSync(process.execPath, [checkerPath, root], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_SHA: expectedCommit,
      GITHUB_REPOSITORY: 'LonelyTraderBay/vittrade-react',
      GITHUB_RUN_ID: '36838559109',
      GITHUB_RUN_ATTEMPT: '1',
      GITHUB_SERVER_URL: 'https://github.com',
    },
  });
}

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

describe('uploaded CI evidence artifact checker', () => {
  it('accepts exact-run metadata, coverage, report, and non-deployable bundle inventory', async () => {
    await createArtifact();

    const result = runCheck();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`verified for ${sourceCommit}`);
    expect(result.stdout).toContain('1 retained traces');
  });

  it('rejects metadata for a different source commit', async () => {
    const { metadataPath } = await createArtifact();
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    metadata.sourceCommit = 'd'.repeat(40);
    await writeFile(metadataPath, JSON.stringify(metadata));

    const result = runCheck();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('sourceCommit does not match GITHUB_SHA');
  });

  it('rejects missing reports and accidental dist upload', async () => {
    await createArtifact({ includeReport: false, includeDist: true });

    const result = runCheck();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('missing the Playwright HTML report');
    expect(result.stderr).toContain('must not contain dist/');
  });

  it('rejects an artifact without Playwright test results for retained traces', async () => {
    await createArtifact({ includeTestResults: false });

    const result = runCheck();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('missing Playwright test-results');
  });

  it('rejects a deployable artifact claim or a failed bundle budget', async () => {
    const { manifestPath } = await createArtifact();
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.deployableArtifact = true;
    manifest.budget.result = 'fail';
    manifest.budget.failedChunkCount = 1;
    manifest.chunks[0].withinBudget = false;
    await writeFile(manifestPath, JSON.stringify(manifest));

    const result = runCheck();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('must not describe a deployable artifact');
    expect(result.stderr).toContain('bundle budget result must pass');
    expect(result.stderr).toContain('valid measurements for every JavaScript chunk');
  });
});

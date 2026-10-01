import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const rootArgument = process.argv[2];
const sourceCommit = process.env.GITHUB_SHA ?? '';
const repository = process.env.GITHUB_REPOSITORY ?? '';
const runId = process.env.GITHUB_RUN_ID ?? '';
const runAttempt = process.env.GITHUB_RUN_ATTEMPT ?? '';
const serverUrl = process.env.GITHUB_SERVER_URL ?? '';

if (!rootArgument) {
  console.error(
    'Usage: node scripts/check-ci-evidence-artifact.mjs <downloaded-artifact-directory>',
  );
  process.exit(2);
}

if (!/^[a-f0-9]{40}$/i.test(sourceCommit) || !repository || !runId || !runAttempt || !serverUrl) {
  console.error('GitHub run metadata is incomplete; cannot verify the CI evidence artifact.');
  process.exit(2);
}

const root = path.resolve(rootArgument);
const errors = [];

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function collectFiles(directory, prefix = '') {
  let entries;
  try {
    entries = await readdir(path.join(directory, prefix), { withFileTypes: true });
  } catch (error) {
    errors.push(`${prefix || '.'}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(directory, relativePath)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
}

const [metadata, manifest, files] = await Promise.all([
  readJson('ci-evidence/run-metadata.json'),
  readJson('ci-evidence/bundle-manifest.json'),
  collectFiles(root),
]);

if (metadata) {
  if (metadata.sourceCommit !== sourceCommit)
    errors.push('run metadata sourceCommit does not match GITHUB_SHA');
  if (metadata.repository !== repository)
    errors.push('run metadata repository does not match GITHUB_REPOSITORY');
  if (metadata.runId !== runId) errors.push('run metadata runId does not match GITHUB_RUN_ID');
  if (metadata.runAttempt !== runAttempt) {
    errors.push('run metadata runAttempt does not match GITHUB_RUN_ATTEMPT');
  }
}

if (manifest) {
  const workflowRunUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;
  if (manifest.sourceCommit !== sourceCommit)
    errors.push('bundle manifest sourceCommit does not match GITHUB_SHA');
  if (manifest.deployableArtifact !== false)
    errors.push('bundle manifest must not describe a deployable artifact');
  if (manifest.workflowRun?.repository !== repository)
    errors.push('bundle manifest repository does not match the workflow');
  if (manifest.workflowRun?.runId !== runId)
    errors.push('bundle manifest runId does not match GITHUB_RUN_ID');
  if (manifest.workflowRun?.runAttempt !== runAttempt) {
    errors.push('bundle manifest runAttempt does not match GITHUB_RUN_ATTEMPT');
  }
  if (manifest.workflowRun?.url !== workflowRunUrl)
    errors.push('bundle manifest URL does not match the workflow run');
  if (manifest.budget?.result !== 'pass' || manifest.budget?.failedChunkCount !== 0) {
    errors.push('bundle budget result must pass with zero failed chunks');
  }
  if (
    !Array.isArray(manifest.chunks) ||
    manifest.chunks.length === 0 ||
    manifest.budget?.chunkCount !== manifest.chunks.length ||
    manifest.chunks.some(
      (chunk) =>
        chunk.withinBudget !== true ||
        !/^[a-f0-9]{64}$/i.test(String(chunk.sha256)) ||
        !Number.isInteger(chunk.rawBytes) ||
        !Number.isInteger(chunk.gzipBytes),
    )
  ) {
    errors.push('bundle manifest must contain valid measurements for every JavaScript chunk');
  }
}

if (!files.some((file) => file.startsWith('coverage/'))) {
  errors.push('uploaded artifact is missing coverage files');
}
if (!files.includes('playwright-report/index.html')) {
  errors.push('uploaded artifact is missing the Playwright HTML report');
}
if (files.some((file) => file === 'dist' || file.startsWith('dist/') || file.includes('/dist/'))) {
  errors.push('uploaded artifact must not contain dist/');
}

if (errors.length > 0) {
  console.error('CI evidence artifact verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `CI evidence artifact verified for ${sourceCommit}: ${files.length} files, ${manifest.chunks.length} bundle chunks, ${files.filter((file) => file.startsWith('coverage/')).length} coverage files, ${files.filter((file) => file.startsWith('test-results/') && /(?:^|\/)trace\.zip$/i.test(file)).length} retained traces, Playwright report present, no dist/.`,
);

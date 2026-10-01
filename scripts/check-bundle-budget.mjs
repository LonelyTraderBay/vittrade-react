import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const distAssets = path.resolve('dist/assets');
const maxRawBytes = 500 * 1000;
const maxGzipBytes = 250 * 1024;
const args = process.argv.slice(2);
const manifestPath =
  args.length === 0 ? null : args[0] === '--manifest' && args.length === 2 ? args[1] : null;

if (args.length > 0 && manifestPath === null) {
  console.error('Usage: node scripts/check-bundle-budget.mjs [--manifest <path>]');
  process.exit(2);
}

const sourceCommit = process.env.GITHUB_SHA ?? '';
if (manifestPath && !/^[a-f0-9]{40}$/i.test(sourceCommit)) {
  console.error('GITHUB_SHA must be a full 40-character commit SHA when writing a CI manifest.');
  process.exit(2);
}

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJavaScriptFiles(entryPath)));
    else if (entry.name.endsWith('.js')) files.push(entryPath);
  }
  return files;
}

try {
  const files = (await collectJavaScriptFiles(distAssets)).sort();
  const failures = [];
  const chunks = [];
  for (const file of files) {
    const contents = await readFile(file);
    const rawBytes = contents.byteLength;
    const gzipBytes = gzipSync(contents, { level: 9 }).byteLength;
    const withinBudget = rawBytes <= maxRawBytes && gzipBytes <= maxGzipBytes;
    if (manifestPath) {
      chunks.push({
        path: path.relative(path.resolve('dist'), file).split(path.sep).join('/'),
        sha256: createHash('sha256').update(contents).digest('hex'),
        rawBytes,
        gzipBytes,
        withinBudget,
      });
    }
    if (!withinBudget) {
      failures.push(
        `${path.relative('dist', file)}: ${(rawBytes / 1000).toFixed(1)} kB raw / ${(gzipBytes / 1024).toFixed(1)} KiB gzip`,
      );
    }
  }

  if (manifestPath) {
    const manifest = {
      schemaVersion: 1,
      purpose: 'CI-only production build inventory; this is not a deployable build artifact.',
      sourceCommit,
      workflowRun: {
        repository: process.env.GITHUB_REPOSITORY ?? null,
        runId: process.env.GITHUB_RUN_ID ?? null,
        runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
        url:
          process.env.GITHUB_SERVER_URL &&
          process.env.GITHUB_REPOSITORY &&
          process.env.GITHUB_RUN_ID
            ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
            : null,
      },
      generatedAt: new Date().toISOString(),
      deployableArtifact: false,
      budget: {
        maxRawBytes,
        maxGzipBytes,
        result: failures.length === 0 ? 'pass' : 'fail',
        chunkCount: chunks.length,
        failedChunkCount: failures.length,
      },
      chunks,
    };
    const absoluteManifestPath = path.resolve(manifestPath);
    await mkdir(path.dirname(absoluteManifestPath), { recursive: true });
    await writeFile(absoluteManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Bundle manifest written: ${path.relative(process.cwd(), absoluteManifestPath)}`);
  }

  if (failures.length > 0) {
    console.error(
      `Bundle budget exceeded (${maxRawBytes / 1000} kB raw and ${maxGzipBytes / 1024} KiB gzip per JS chunk):`,
    );
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Bundle budget passed: ${files.length} JS chunks <= ${maxRawBytes / 1000} kB raw and ${maxGzipBytes / 1024} KiB gzip.`,
    );
  }
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.error('dist/assets not found. Run npm run build before bundle:check.');
  } else {
    throw error;
  }
  process.exitCode = 1;
}

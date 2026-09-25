import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const distAssets = path.resolve('dist/assets');
const maxRawBytes = 500 * 1000;
const maxGzipBytes = 250 * 1024;

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
  const files = await collectJavaScriptFiles(distAssets);
  const failures = [];
  for (const file of files) {
    const contents = await readFile(file);
    const rawBytes = contents.byteLength;
    const gzipBytes = gzipSync(contents, { level: 9 }).byteLength;
    if (rawBytes > maxRawBytes || gzipBytes > maxGzipBytes) {
      failures.push(
        `${path.relative('dist', file)}: ${(rawBytes / 1000).toFixed(1)} kB raw / ${(gzipBytes / 1024).toFixed(1)} KiB gzip`,
      );
    }
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

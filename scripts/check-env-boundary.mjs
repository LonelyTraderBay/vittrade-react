import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const repositoryRoot = process.cwd();
const sourceRoot = join(repositoryRoot, 'src');
const environmentBoundary = 'src/shared/config/env.ts';
const sourceExtensions = new Set(['.ts', '.tsx']);
const violations = [];
let scannedFiles = 0;

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(absolutePath);
      continue;
    }

    const relativePath = relative(repositoryRoot, absolutePath).replaceAll('\\', '/');
    if (relativePath === environmentBoundary) continue;
    if (!sourceExtensions.has(absolutePath.slice(absolutePath.lastIndexOf('.')))) continue;

    scannedFiles += 1;
    const source = await readFile(absolutePath, 'utf8');
    if (/\bimport\.meta\.env\b/.test(source)) violations.push(relativePath);
  }
}

await visit(sourceRoot);

if (violations.length > 0) {
  console.error('Environment boundary check failed:');
  console.error(`Only ${environmentBoundary} may read import.meta.env.`);
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`Environment boundary check passed: ${scannedFiles} source files inspected.`);

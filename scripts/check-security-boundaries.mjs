import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const sourceRoot = join(process.cwd(), 'src');
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const ignoredPathParts = ['__tests__', '.test.', '.spec.'];

const storagePattern = /\b(?:localStorage|sessionStorage|document\.cookie)\b/i;
const credentialPattern =
  /\b(?:accessToken|refreshToken|idToken|authToken|jwt|authorization|bearer|token)\b/i;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(path)));
      continue;
    }

    if (
      sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf('.'))) &&
      !ignoredPathParts.some((part) => path.includes(part))
    ) {
      files.push(path);
    }
  }

  return files;
}

const files = await collectSourceFiles(sourceRoot);
const violations = [];

for (const file of files) {
  const contents = await readFile(file, 'utf8');
  const lines = contents.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (storagePattern.test(line) && credentialPattern.test(line)) {
      violations.push(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error(
    'Security boundary check failed: credentials must not be persisted in browser storage or cookies.',
  );
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Security boundary check passed: ${files.length} source files enforce memory-only credential storage.`,
);

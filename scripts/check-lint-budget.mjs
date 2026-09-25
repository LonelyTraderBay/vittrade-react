import { readFile } from 'node:fs/promises';
import { ESLint } from 'eslint';

const baseline = JSON.parse(
  await readFile(new URL('../config/lint-warning-baseline.json', import.meta.url), 'utf8'),
);
const eslint = new ESLint();
const results = await eslint.lintFiles(['.']);
const errors = results.reduce((total, result) => total + result.errorCount, 0);
const warnings = results.reduce((total, result) => total + result.warningCount, 0);

if (errors > 0) {
  console.error(`Lint gate failed: ${errors} error(s).`);
  process.exit(1);
}

if (warnings > baseline.warnings) {
  console.error(
    `Lint warning budget exceeded: ${warnings} > ${baseline.warnings}. ` +
      'New code must not increase the migration debt.',
  );
  process.exit(1);
}

console.log(`Lint gate passed: ${errors} errors, ${warnings} warnings (budget ${baseline.warnings}).`);

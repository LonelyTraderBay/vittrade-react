import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const protectedInstructionFiles = new Set([
  'AGENTS.md',
  'AI_RULES.md',
  'PROJECT_BOOTSTRAP_PROMPT.txt',
]);

const output = execFileSync(
  'git',
  ['-c', 'core.quotePath=false', 'ls-files', '--eol', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
);

const paths = output
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    const separator = line.indexOf('\t');
    if (separator < 0) {
      throw new Error(`Cannot parse git ls-files --eol row: ${line}`);
    }

    const metadata = line.slice(0, separator).trim().split(/\s+/);
    return {
      path: line.slice(separator + 1),
      workingTreeEol: metadata[1],
      attributes: metadata.slice(2),
    };
  });

const counts = { lf: 0, noTerminator: 0, preservedNonText: 0, protectedWindowsCrlf: 0 };
const violations = [];

for (const entry of paths) {
  if (!existsSync(entry.path)) {
    violations.push(`missing ${entry.path}`);
    continue;
  }

  if (entry.workingTreeEol === 'w/-text' || entry.attributes.includes('attr/-text')) {
    counts.preservedNonText += 1;
    continue;
  }

  if (entry.workingTreeEol === 'w/lf') {
    counts.lf += 1;
    continue;
  }

  if (entry.workingTreeEol === 'w/none') {
    counts.noTerminator += 1;
    continue;
  }

  if (
    process.platform === 'win32' &&
    protectedInstructionFiles.has(entry.path) &&
    entry.workingTreeEol === 'w/crlf'
  ) {
    counts.protectedWindowsCrlf += 1;
    continue;
  }

  violations.push(`${entry.workingTreeEol} ${entry.path}`);
}

console.log(
  `Git EOL check: ${paths.length} paths; ${counts.lf} LF, ${counts.noTerminator} without line terminators, ${counts.preservedNonText} preserved non-text, ${counts.protectedWindowsCrlf} protected Windows CRLF.`,
);

if (violations.length > 0) {
  console.error(`Expected LF for managed text paths; found ${violations.length} violation(s):`);
  console.error(violations.join('\n'));
  process.exitCode = 1;
}

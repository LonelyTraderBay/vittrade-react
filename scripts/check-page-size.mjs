import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const featurePagesRoot = path.join(root, 'src', 'features');
const legacyPagesRoot = path.join(root, 'src', 'app', 'pages');
const maxFeaturePageLines = 600;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return /\.(tsx|ts)$/.test(entry.name) ? [file] : [];
  });
}

const featureViolations = walk(featurePagesRoot)
  .filter((file) => file.includes(`${path.sep}pages${path.sep}`))
  .map((file) => ({ file, lines: fs.readFileSync(file, 'utf8').split(/\r?\n/).length }))
  .filter(({ lines }) => lines > maxFeaturePageLines);

if (featureViolations.length > 0) {
  console.error('Feature page size gate failed:');
  for (const violation of featureViolations) {
    console.error(
      `- ${path.relative(root, violation.file)}: ${violation.lines} lines (max ${maxFeaturePageLines})`,
    );
  }
  process.exit(1);
}

const oversizedFeatureModules = walk(featurePagesRoot)
  .filter((file) => !/\.test\.(tsx|ts)$/.test(file))
  .map((file) => ({
    file,
    lines: fs.readFileSync(file, 'utf8').split(/\r?\n/).length,
  }))
  .filter(({ lines }) => lines > maxFeaturePageLines);

if (oversizedFeatureModules.length > 0) {
  console.error(`Feature module size gate failed (max ${maxFeaturePageLines} lines):`);
  for (const violation of oversizedFeatureModules) {
    console.error(`- ${path.relative(root, violation.file)}: ${violation.lines} lines`);
  }
  process.exit(1);
}

const legacyOverLimit = walk(legacyPagesRoot)
  .map((file) => ({ file, lines: fs.readFileSync(file, 'utf8').split(/\r?\n/).length }))
  .filter(({ lines }) => lines > maxFeaturePageLines);

if (legacyOverLimit.length > 0) {
  console.error(`Legacy page size gate failed (max ${maxFeaturePageLines} lines):`);
  for (const violation of legacyOverLimit) {
    console.error(`- ${path.relative(root, violation.file)}: ${violation.lines} lines`);
  }
  process.exit(1);
}

console.log(
  `Page size gate passed: no page or feature module exceeds ${maxFeaturePageLines} lines.`,
);

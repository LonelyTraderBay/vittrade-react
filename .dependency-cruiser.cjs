/** @type {import('dependency-cruiser').IConfiguration} */
const { readdirSync } = require('node:fs');
const path = require('node:path');

const featureRoot = path.join(__dirname, 'src', 'features');
const featureDomains = readdirSync(featureRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  forbidden: [
    {
      name: 'feature-must-not-import-app',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'development-code-must-not-import-app',
      severity: 'error',
      from: { path: '^src/dev/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'shared-must-not-import-upward',
      severity: 'error',
      from: { path: '^src/shared' },
      to: { path: '^src/(app|features)' },
    },
    {
      name: 'no-imports-from-retired-root-source-directories',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^src/(components|types|utils)/' },
    },
    {
      name: 'feature-and-shared-layers-must-not-import-development-code',
      severity: 'error',
      from: { path: '^src/(features|shared)/' },
      to: { path: '^src/dev/' },
    },
    ...featureDomains.map((domain) => ({
      name: `feature-${domain}-may-only-use-public-apis-of-other-features`,
      severity: 'error',
      from: { path: `^src/features/${escapeRegExp(domain)}/` },
      to: {
        path: '^src/features/',
        pathNot: [
          `^src/features/${escapeRegExp(domain)}/`,
          '^src/features/[^/]+/index\\.(?:ts|tsx)$',
        ],
      },
    })),
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
  },
};

import { readdir, readFile } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';

// Fixture data belongs in src/dev/mocks; legacy pages may not import fixture modules.
const maxFilesWithLegacyMockImports = 0;
const maxDevelopmentOnlyFixtureConsumers = 0;
const roots = [
  'src/app/pages',
  'src/app/components',
  'src/app/services',
  'src/dev/legacy/trading',
  'src/dev/legacy/launchpad',
  'src/dev/legacy/auth',
  'src/dev/legacy/market',
  'src/dev/legacy/wallet',
  'src/dev/legacy/p2p',
  'src/dev/legacy/arena',
  'src/dev/legacy/earn',
  'src/dev/legacy/predictions',
  'src/dev/legacy/profile',
  'src/dev/legacy/referral',
  'src/dev/legacy/rewards',
  'src/dev/legacy/tools',
  'src/dev/legacy/web',
];
const inventory = JSON.parse(
  await readFile(join(process.cwd(), 'docs', 'architecture', 'page-inventory.json'), 'utf8'),
);
const legacyFixturePattern =
  /(?:from\s+|import\s*\()\s*['"]([^'"]*(?:mockData|predictionMockData|launchpadData|dev\/legacy\/[^'"]*fixture)[^'"]*)['"]/gi;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectSourceFiles(path)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

const files = (await Promise.all(roots.map(collectSourceFiles))).flat();
const developmentSupportFiles = await collectSourceFiles(join(process.cwd(), 'src', 'dev', 'mocks'));
const violations = [];
const developmentOnlyFixtureConsumers = new Set();

function repositoryPath(absolutePath) {
  return relative(process.cwd(), absolutePath).split(sep).join('/');
}

function resolveLocalImport(importerPath, importPath) {
  if (importPath.startsWith('@/')) return posix.normalize(`src/${importPath.slice(2)}`);
  if (importPath.startsWith('.')) {
    return posix.normalize(posix.join(posix.dirname(importerPath), importPath));
  }
  return undefined;
}

function importMatchesTarget(importerPath, importPath, targetPath) {
  const resolved = resolveLocalImport(importerPath, importPath);
  if (!resolved) return false;
  const base = resolved.replace(/\.(?:ts|tsx|js|jsx)$/, '');
  const target = targetPath.replace(/\.(?:ts|tsx|js|jsx)$/, '');
  return base === target;
}

const developmentSupportImports = new Set();
for (const file of developmentSupportFiles) {
  const importerPath = repositoryPath(file);
  const contents = await readFile(file, 'utf8');
  for (const match of contents.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g)) {
    const resolved = resolveLocalImport(importerPath, match[1]);
    if (resolved) developmentSupportImports.add(resolved.replace(/\.(?:ts|tsx|js|jsx)$/, ''));
  }
}

function isStaleAppFixtureImport(importerPath, importPath) {
  const resolved = resolveLocalImport(importerPath, importPath);
  return importPath.startsWith('@/app/data/') || resolved?.startsWith('src/app/data/') === true;
}

function routesForPage(pagePath) {
  const fileName = pagePath
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '');
  return inventory.routes.filter(
    (route) =>
      route.pageTarget === pagePath ||
      route.compositionTargets?.includes(pagePath) === true ||
      route.component === fileName ||
      route.target
        ?.split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '') === fileName,
  );
}

function hasOnlyDevelopmentRoutes(page) {
  if (page.routePaths.length === 0) return true;
  const pageRoutes = routesForPage(page.path);
  return pageRoutes.length > 0 && pageRoutes.every((route) => route.developmentOnly);
}

for (const file of files) {
  const contents = await readFile(file, 'utf8');
  const importerPath = repositoryPath(file);
  const fixtureImports = [...contents.matchAll(legacyFixturePattern)];
  for (const match of fixtureImports) {
    const importedPath = match[1];
    if (isStaleAppFixtureImport(importerPath, importedPath)) {
      violations.push(`${importerPath}: stale app-owned fixture import ${importedPath}`);
      continue;
    }

    const directPage = inventory.pages.find((page) => page.path === importerPath);
    if (directPage) {
      if (hasOnlyDevelopmentRoutes(directPage)) {
        if (directPage.routePaths.length > 0) {
          developmentOnlyFixtureConsumers.add(importerPath);
        }
      } else {
        violations.push(
          `${importerPath}: legacy fixture import is not isolated to development routes`,
        );
      }
      continue;
    }

    const consumers = importerPath.startsWith('src/app/pages/')
      ? inventory.pages.filter((page) =>
          page.dependencies.localImports.some((pageImport) =>
            importMatchesTarget(page.path, pageImport, importerPath),
          ),
        )
      : importerPath.startsWith('src/dev/legacy/')
        ? inventory.pages.filter((page) => page.developmentTargets?.includes(importerPath) === true)
        : [];
    const isDevMockSupportModule =
      importerPath.startsWith('src/dev/legacy/') &&
      developmentSupportImports.has(importerPath.replace(/\.(?:ts|tsx|js|jsx)$/, ''));
    if (consumers.length === 0 && isDevMockSupportModule) continue;
    if (
      (importerPath.startsWith('src/app/pages/') || importerPath.startsWith('src/dev/legacy/')) &&
      consumers.length > 0 &&
      consumers.every(hasOnlyDevelopmentRoutes)
    ) {
      for (const page of consumers) {
        if (page.routePaths.length) developmentOnlyFixtureConsumers.add(page.path);
      }
    } else {
      violations.push(
        `${importerPath}: legacy fixture module has no verified development-only page consumers`,
      );
    }
  }
}

if (developmentOnlyFixtureConsumers.size > maxDevelopmentOnlyFixtureConsumers) {
  violations.push(
    `legacy fixture consumers remain: ${developmentOnlyFixtureConsumers.size}/${maxDevelopmentOnlyFixtureConsumers}`,
  );
}

if (violations.length > maxFilesWithLegacyMockImports) {
  console.error('Production mock import boundary failed:');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Production mock import boundary passed: ${developmentOnlyFixtureConsumers.size} legacy fixture page consumers; fixture data is isolated under src/dev/mocks.`,
);

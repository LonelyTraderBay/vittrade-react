import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const repositoryRoot = process.cwd();
const routeConfigPath = join(repositoryRoot, 'src', 'app', 'routeConfig.ts');
const routesPath = join(repositoryRoot, 'src', 'app', 'routes.ts');
const p2pRoutesPath = join(repositoryRoot, 'src', 'app', 'routes', 'p2pProtectedRoutes.ts');
const tradingRoutesPath = join(repositoryRoot, 'src', 'app', 'routes', 'tradingProtectedRoutes.ts');
const walletProfileRoutesPath = join(
  repositoryRoot,
  'src',
  'app',
  'routes',
  'walletProfileProtectedRoutes.ts',
);
const inventoryPath = join(repositoryRoot, 'docs', 'architecture', 'page-inventory.json');
const source = await readFile(routeConfigPath, 'utf8');
const routesSource = await readFile(routesPath, 'utf8');
const p2pRoutesSource = await readFile(p2pRoutesPath, 'utf8');
const tradingRoutesSource = await readFile(tradingRoutesPath, 'utf8');
const walletProfileRoutesSource = await readFile(walletProfileRoutesPath, 'utf8');
const protectedRouteBindings = `${source}\n${p2pRoutesSource}\n${tradingRoutesSource}\n${walletProfileRoutesSource}`;
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));

// Những page này còn dùng mock/simulation hoặc chưa có contract giao dịch hoàn chỉnh.
// Route vẫn tồn tại để không phá public URL, nhưng production chỉ được trỏ tới boundary an toàn.
const protectedPages = [
  'AdminHome',
  'AnalyticsDashboard',
  'ABTestDashboard',
  'FunnelDashboard',
  'P2PTransactionLimitsPage',
  'P2PInsuranceFundPage',
  'P2PContributionHistoryPage',
  'P2PKYCStatusPage',
  'P2PSecurityCenterPage',
  'P2PWalletPage',
  'PerformanceAttributionPage',
  'ProviderApplicationPage',
  'ProviderGovernancePage',
  'CopySafetyCenterPage',
];

const protectedShellPages = [
  'ShellTemplatePage',
  'WebRegisterPage',
  'WebArenaHomePage',
];

const developmentOnlyBindings = ['RouteChecker', 'PerformanceMonitor'];

// Một số web-shell route dùng tên component khác tên file legacy.
const protectedInventoryAliases = new Set(['P2POrderPage']);

async function isDevelopmentCompatibilityShim(page) {
  if (!page.path.startsWith('src/app/pages/')) return false;
  const relativePath = page.path.slice('src/app/pages/'.length).replace(/\.(?:tsx?|jsx?)$/, '');
  const extension = page.path.match(/\.[^.]+$/)?.[0] ?? '';
  const expectedTarget = `src/dev/legacy/${relativePath}${extension}`;
  if (!page.developmentTargets?.includes(expectedTarget)) return false;

  const compatibilityPath = `@/dev/legacy/${relativePath}`;
  const pageSource = await readFile(join(repositoryRoot, page.path), 'utf8');
  const exports = [
    ...pageSource.matchAll(/export\s+(?:\*|\{\s*default\s*\})\s+from\s+['"]([^'"]+)['"]/g),
  ].map((match) => match[1]);
  return (
    exports.length >= 1 &&
    exports.length <= 2 &&
    exports.every((target) => target === compatibilityPath) &&
    exports.includes(compatibilityPath) &&
    /export\s+\*\s+from\s+['"]@\/dev\/legacy\//.test(pageSource)
  );
}

const developmentCompatibilityShims = new Set(
  (
    await Promise.all(
      inventory.pages
        .filter(
          (page) =>
            page.status === 'demo' &&
            page.path.startsWith('src/app/pages/') &&
            page.developmentTargets?.some((target) => target.startsWith('src/dev/legacy/')),
        )
        .map(async (page) =>
          (await isDevelopmentCompatibilityShim(page)) ? page.path : undefined,
        ),
    )
  ).filter(Boolean),
);

const violations = protectedPages.filter((pageName) => {
  const declaration = new RegExp(
    `const ${pageName}\\s*=\\s*(?:import\\.meta\\.env\\.DEV|isDevelopmentBuild)[\\s\\S]*?IntegrationPendingPage;`,
  );
  return !declaration.test(protectedRouteBindings);
});

for (const component of developmentOnlyBindings) {
  const declaration = new RegExp(
    `const ${component}\\s*=\\s*isDevelopmentBuild\\s*\\?[\\s\\S]*?:\\s*IntegrationPendingPage;`,
  );
  if (!declaration.test(source)) {
    violations.push(`${component} must be guarded by isDevelopmentBuild`);
  }
}

for (const [sourcePath, routeSource] of [
  ['src/app/routeConfig.ts', source],
  ['src/app/routes.ts', routesSource],
  ['src/app/routes/p2pProtectedRoutes.ts', p2pRoutesSource],
  ['src/app/routes/tradingProtectedRoutes.ts', tradingRoutesSource],
]) {
  for (const match of routeSource.matchAll(/import\(\s*(['"])([^'"]+)\1\s*\)/g)) {
    const target = match[2];
    if (!target.startsWith('./pages/')) continue;
    const developmentOnlyRoute = inventory.routes.find(
      (route) => route.source === sourcePath && route.target === target && route.developmentOnly,
    );
    if (developmentOnlyRoute) {
      violations.push(
        `development-only route must import its dev implementation directly: ${sourcePath} -> ${target}`,
      );
    }
  }
}

const advancedDcaPaths = [
  'dca/rebalance/config',
  'dca/rebalance/:configId',
  'dca/schedule/config',
  'dca/schedule/:configId',
  'dca/portfolio-optimizer',
  'dca/dynamic-amount',
  'dca/backtester',
  'dca/multi-asset',
  'dca/performance-compare',
  'dca/smart-rules',
];
const dcaDevelopmentStart = source.indexOf('const dcaDevelopmentRoutes: RouteObject[]');
const dcaProductionStart = source.indexOf('const dcaProductionPendingRoutes: RouteObject[]');
const dcaDevelopmentBlock =
  dcaDevelopmentStart >= 0 && dcaProductionStart > dcaDevelopmentStart
    ? source.slice(dcaDevelopmentStart, dcaProductionStart)
    : '';
const dcaProductionBlock = source.match(
  /const dcaProductionPendingRoutes:\s*RouteObject\[\]\s*=\s*isDevelopmentBuild\s*\?\s*\[\]\s*:\s*\[([\s\S]*?)\n\s*\];/,
)?.[1];

if (!dcaProductionBlock || !source.includes('...dcaProductionPendingRoutes')) {
  violations.push('advanced DCA route production composition');
}
for (const routePath of advancedDcaPaths) {
  const routeLiteral = `path: '${routePath}'`;
  if (!dcaDevelopmentBlock.includes(routeLiteral)) {
    violations.push(`advanced DCA development route ${routePath}`);
  }
  if (!dcaProductionBlock?.includes(`${routeLiteral}, Component: IntegrationPendingPage`)) {
    violations.push(`advanced DCA production boundary ${routePath}`);
  }
}

for (const pageName of protectedShellPages) {
  const declaration = new RegExp(
    `const ${pageName}\\s*=\\s*(?:import\\.meta\\.env\\.DEV|isDevelopmentBuild)[\\s\\S]*?IntegrationPendingPage;`,
  );
  if (!declaration.test(`${routesSource}\n${walletProfileRoutesSource}`)) violations.push(pageName);
}

const protectedPageNames = new Set([...protectedPages, ...protectedShellPages]);
const routedMockPagesWithoutBoundary = inventory.pages
  .filter(
    (page) =>
      page.path.startsWith('src/app/pages/') &&
      !developmentCompatibilityShims.has(page.path) &&
      page.routePaths.length > 0 &&
      page.dependencies.mockReferences.length > 0,
  )
  .filter((page) => {
    const routes = inventory.routes.filter((route) => page.routePaths.includes(route.path));
    if (routes.length > 0 && routes.every((route) => route.developmentOnly)) return false;

    const fileName = page.path
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '');
    return !protectedPageNames.has(fileName) && !protectedInventoryAliases.has(fileName);
  })
  .map((page) => page.path);

const routedMockPagesWithoutDevelopmentBoundary = inventory.pages
  .filter((page) => page.routePaths.length > 0 && page.dependencies.mockReferences.length > 0)
  .filter((page) => {
    const fileName = page.path
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '');
    const routes = inventory.routes.filter(
      (route) => route.component === fileName || route.target?.split('/').pop() === fileName,
    );
    return routes.length === 0 || routes.some((route) => !route.developmentOnly);
  })
  .map((page) => `routed mock page is not development-only: ${page.path}`);
violations.push(...routedMockPagesWithoutDevelopmentBoundary);

const routedDemoPagesWithoutDevelopmentBoundary = inventory.pages
  .filter((page) => page.status === 'demo' && page.routePaths.length > 0)
  .flatMap((page) => {
    const routes = inventory.routes.filter(
      (route) =>
        route.pageTarget === page.path || route.compositionTargets?.includes(page.path) === true,
    );
    if (routes.length === 0) {
      return [`routed demo page has no exact route evidence: ${page.path}`];
    }
    return routes
      .filter((route) => !route.developmentOnly)
      .map((route) => `demo page has a non-development route ${route.path}: ${page.path}`);
  });
violations.push(...routedDemoPagesWithoutDevelopmentBoundary);

for (const pagePath of routedMockPagesWithoutBoundary) {
  violations.push(`routed mock page missing boundary: ${pagePath}`);
}

if (!source.includes("from './pages/system/IntegrationPendingPage'")) {
  violations.push('IntegrationPendingPage import');
}
if (!routesSource.includes("from './pages/system/IntegrationPendingPage'")) {
  violations.push('routes.ts IntegrationPendingPage import');
}
if (!source.includes("from '@/shared/config/env'") || !source.includes('isDevelopmentBuild')) {
  violations.push('routeConfig.ts environment boundary import');
}
if (
  !routesSource.includes("from '@/shared/config/env'") ||
  !routesSource.includes('isDevelopmentBuild')
) {
  violations.push('routes.ts environment boundary import');
}
if (
  !routesSource.includes("import('@/features/auth/pages/PasswordResetPages')") ||
  routesSource.includes("import('./pages/web/WebForgotPasswordPage')") ||
  routesSource.includes("import('./pages/web/WebResetPasswordPage')")
) {
  violations.push('web password-reset routes must use the contract-backed auth feature');
}

if (violations.length > 0) {
  console.error('Production route boundary check failed:');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Production route boundary check passed: ${protectedPages.length + protectedShellPages.length} explicit route guards, ${inventory.pages.filter((page) => page.routePaths.length > 0 && page.dependencies.mockReferences.length > 0).length} routed mock pages and ${inventory.pages.filter((page) => page.status === 'demo' && page.routePaths.length > 0).length} routed demo pages are development-only.`,
);

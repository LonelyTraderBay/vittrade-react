import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '../../../../..');
const planDirectory = path.join(root, 'docs/architecture/production-readiness');
const outputPath = path.join(
  planDirectory,
  'evidence/C06/c06-01-route-matrix-2026-10-15-19593f88.json',
);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : (process.argv[index + 1] ?? null);
}

const sourceHead = argument('--source-head');
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');
if (!/^[a-f0-9]{40}$/.test(sourceHead ?? ''))
  throw new Error('Pass --source-head with the 40-character source revision.');
if (write === check) throw new Error('Pass exactly one of --write or --check.');

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const liveInventory = readJson('docs/architecture/page-inventory.json');
const liveTracking = readJson('docs/architecture/production-readiness/TRACKING.json');
// This file describes a historical baseline, not today's module counts or runtime coverage.
// Pin both JSON inputs and file existence to that Git revision; never trust counts from the artifact itself.
const gitInput = (...args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
let inventory, tracking, baselinePaths;
try {
  inventory = JSON.parse(gitInput('show', `${sourceHead}:docs/architecture/page-inventory.json`));
  tracking = JSON.parse(
    gitInput('show', `${sourceHead}:docs/architecture/production-readiness/TRACKING.json`),
  );
  baselinePaths = new Set(gitInput('ls-tree', '-r', '--name-only', '-z', sourceHead).split('\0'));
} catch (error) {
  throw new Error(`Cannot read baseline Git inputs at ${sourceHead}`, { cause: error });
}
const currentRoutes = tracking.routes.filter((route) => route.lifecycle === 'active');
const currentPages = tracking.pages.filter((page) => page.lifecycle === 'active');
const plannedPages = tracking.pages.filter((page) => page.lifecycle === 'planned');
const pagesById = new Map(tracking.pages.map((page) => [page.id, page]));

function routeKey(route) {
  return JSON.stringify([
    route.source,
    route.path,
    route.component,
    Boolean(route.developmentOnly),
  ]);
}

function multiset(items, key) {
  const result = new Map();
  for (const item of items) result.set(key(item), (result.get(key(item)) ?? 0) + 1);
  return result;
}

const inventoryRoutes = multiset(inventory.routes, routeKey);
const trackerRoutes = multiset(currentRoutes, routeKey);
const routeMismatches = [
  ...[...inventoryRoutes].flatMap(([key, count]) =>
    trackerRoutes.get(key) === count ? [] : [{ side: 'inventory', key, count }],
  ),
  ...[...trackerRoutes].flatMap(([key, count]) =>
    inventoryRoutes.get(key) === count ? [] : [{ side: 'tracking', key, count }],
  ),
];
if (routeMismatches.length > 0)
  throw new Error(`Route identity mismatch: ${JSON.stringify(routeMismatches.slice(0, 5))}`);

const inventoryPagePaths = new Set(inventory.pages.map((page) => page.path));
const activePagePaths = new Set(currentPages.map((page) => page.path));
const missingActivePagePaths = [...activePagePaths].filter((file) => !inventoryPagePaths.has(file));
const untrackedInventoryPagePaths = [...inventoryPagePaths].filter(
  (file) => !activePagePaths.has(file),
);
if (missingActivePagePaths.length || untrackedInventoryPagePaths.length)
  throw new Error(
    `Page identity mismatch: ${JSON.stringify({ missingActivePagePaths, untrackedInventoryPagePaths })}`,
  );

const routeIds = new Set(currentRoutes.map((route) => route.id));
const missingRouteUrlIds = currentRoutes
  .filter((route) => !Array.isArray(route.resolvedUrls) || route.resolvedUrls.length === 0)
  .map((route) => route.id);
const invalidPageRefs = currentRoutes.flatMap((route) =>
  (route.pageIds ?? [])
    .filter((id) => !pagesById.has(id))
    .map((id) => ({ routeId: route.id, pageId: id })),
);
const invalidPlannedRouteRefs = plannedPages.flatMap((page) =>
  (page.routeIds ?? [])
    .filter((id) => !routeIds.has(id))
    .map((id) => ({ pageId: page.id, routeId: id })),
);
if (missingRouteUrlIds.length || invalidPageRefs.length || invalidPlannedRouteRefs.length)
  throw new Error(
    `Incomplete route ledger: ${JSON.stringify({ missingRouteUrlIds, invalidPageRefs, invalidPlannedRouteRefs })}`,
  );

const shellForUrl = (url) => {
  if (url === '/w' || url.startsWith('/w/')) return 'web';
  if (url === '/t' || url.startsWith('/t/')) return 'tablet';
  if (url === '/r' || url.startsWith('/r/')) return 'responsive-route-context';
  return 'phone';
};

const classifications = Object.fromEntries(
  Object.entries(
    currentRoutes.reduce((counts, route) => {
      counts[route.classification] = (counts[route.classification] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort(([left], [right]) => left.localeCompare(right)),
);
const allUrls = currentRoutes.flatMap((route) => route.resolvedUrls);
const shellConfig = {
  platformEnum: ['phone', 'tablet', 'web'],
  pathPrefixDetection: { web: '/w', tablet: '/t', default: 'phone' },
  viewportBreakpointsCssPx: {
    phone: { min: 0, maxExclusive: 768 },
    tablet: { min: 768, maxExclusive: 1024 },
    web: { min: 1024 },
  },
  platformConfig: {
    phone: {
      contentMaxWidth: 440,
      contentPadding: 20,
      gridColumns: 1,
      minTouchTarget: 44,
      modalStyle: 'sheet',
    },
    tablet: {
      contentMaxWidth: 960,
      contentPadding: 24,
      gridColumns: 2,
      minTouchTarget: 40,
      modalStyle: 'floating',
    },
    web: {
      contentMaxWidth: 1600,
      contentPadding: 32,
      gridColumns: 3,
      minTouchTarget: 32,
      modalStyle: 'dialog',
    },
  },
  source: 'src/app/hooks/usePlatform.ts',
  responsiveRouteContext: {
    prefix: '/r',
    isPlatformEnumValue: false,
    note: 'Route context present in generated registrations; runtime treatment must be validated with its owning shell.',
  },
};
const dimensionDefinitions = {
  interactionStates: {
    status: 'not_assessed',
    candidateStates: [
      'default',
      'hover',
      'focus-visible',
      'active',
      'selected',
      'disabled',
      'readonly',
      'loading-submitting',
      'empty',
      'no-results',
      'error',
      'success',
      'partial-data',
      'permission-denied',
    ],
    reason:
      'Applicability must be derived from the page/component behavior; no runtime state review was performed in C06.01.',
  },
  viewport: {
    status: 'not_run',
    requiredProfiles: ['phone', 'tablet', 'web'],
    breakpoints: shellConfig.viewportBreakpointsCssPx,
    orientationAndTextScaling: 'not_run',
  },
  theme: {
    configuredModes: ['light', 'dark'],
    status: 'not_run',
    source: 'src/shared/theme/ThemeContext.tsx',
  },
  locale: {
    status: 'not_established',
    documentLanguage: 'en',
    supportedLocales: null,
    reason:
      'Supported product locales and runtime translations were not established in this baseline step.',
  },
  roleAndFeatureFlags: {
    status: 'not_classified',
    reason: 'Route role/flag applicability and authorization behavior need source/runtime review.',
  },
  runtime: {
    status: 'not_run',
    reason:
      'C06.01 freezes scope only; browser checks are required in the pilot and rollout steps.',
  },
};

function routeRows(routeRecords, pageRecords, pathExists) {
  return routeRecords.map((route) => {
    const pageTargets = (route.pageIds ?? []).map((id) => {
      const page = pageRecords.get(id);
      if (!page) throw new Error(`Incomplete live route/page binding: ${route.id} -> ${id}`);
      return {
        pageId: id,
        lifecycle: page.lifecycle,
        path: page.path,
        pathExistsAtBaseline: pathExists(page.path),
      };
    });
    const resolvedUrls = [...(route.resolvedUrls ?? [])].sort();
    const registeredShells = [...new Set(resolvedUrls.map(shellForUrl))].sort();
    const pilotOwnerStep =
      route.path.includes('markets') || route.path.includes('market')
        ? 'C06.11'
        : route.path.includes('withdraw')
          ? 'C06.12'
          : 'C06.13';
    const c06Coverage = route.c06Coverage;
    return {
      routeId: route.id,
      registry: route.source,
      declaredPath: route.path,
      component: route.component,
      target: route.target ?? null,
      classification: route.classification,
      developmentOnly: Boolean(route.developmentOnly),
      resolvedUrls,
      registeredShells,
      pageTargets,
      personaMappingStatus: route.personaMapping?.status ?? 'not_recorded',
      coverage: {
        interactionStates: dimensionDefinitions.interactionStates.status,
        viewport: dimensionDefinitions.viewport.status,
        theme: dimensionDefinitions.theme.status,
        locale: dimensionDefinitions.locale.status,
        roleAndFeatureFlags:
          c06Coverage?.roleAndFeatureFlags?.status ??
          dimensionDefinitions.roleAndFeatureFlags.status,
        runtime: c06Coverage?.runtime?.status ?? dimensionDefinitions.runtime.status,
        ownerStep: pilotOwnerStep,
      },
      ...(c06Coverage ? { c06Coverage } : {}),
    };
  });
}
const routes = routeRows(currentRoutes, pagesById, (file) => baselinePaths.has(file));
const routeRowsWithLocalUiMockPass = routes.filter(
  (route) => route.coverage.runtime === 'local_ui_mock_pass',
).length;

if (check) {
  const liveRoutes = liveTracking.routes.filter((route) => route.lifecycle === 'active');
  const livePages = liveTracking.pages.filter((page) => page.lifecycle === 'active');
  const sameMultiset = (left, right, key) => {
    const a = multiset(left, key),
      b = multiset(right, key);
    return a.size === b.size && [...a].every(([value, count]) => b.get(value) === count);
  };
  if (!sameMultiset(liveInventory.routes, liveRoutes, routeKey))
    throw new Error('Live route identity mismatch between inventory and ledger.');
  if (
    !sameMultiset(liveInventory.pages, livePages, (page) => page.path) ||
    !sameMultiset(livePages, currentPages, (page) =>
      JSON.stringify([page.id, page.path, page.lifecycle]),
    )
  )
    throw new Error('Live page inventory differs from the locked baseline.');
  const liveRows = routeRows(
    liveRoutes,
    new Map(liveTracking.pages.map((page) => [page.id, page])),
    (file) => fs.existsSync(path.join(root, file)),
  );
  if (JSON.stringify(liveRows) !== JSON.stringify(routes))
    throw new Error('Live route URLs, owners or declarations differ from the locked baseline.');
}

const plannedWithRoutes = plannedPages.filter((page) => (page.routeIds ?? []).length > 0);
const linkedPlannedRouteIds = new Set(plannedWithRoutes.flatMap((page) => page.routeIds));
const matrix = {
  schemaVersion: 1,
  sourceHead,
  inventorySource: 'docs/architecture/page-inventory.json',
  trackingSource: 'docs/architecture/production-readiness/TRACKING.json',
  scope: {
    inventory: {
      pageFiles: inventory.pages.length,
      activeRouteDeclarations: inventory.routes.length,
      componentFiles: inventory.components.length,
      dataModules: inventory.dataModules.length,
      services: inventory.services.length,
      mocks: inventory.mocks.length,
      routeSourceFiles: [...new Set(inventory.routes.map((route) => route.source))].sort(),
    },
    tracking: {
      pageRecords: tracking.pages.length,
      activePageRecords: currentPages.length,
      plannedPageRecords: plannedPages.length,
      plannedPageRecordsWithMissingSource: plannedPages.filter(
        (page) => !baselinePaths.has(page.path),
      ).length,
      plannedPageRecordsWithRouteLinks: plannedWithRoutes.length,
      uniqueRouteRowsLinkedFromPlannedPages: linkedPlannedRouteIds.size,
      routeRecordsTotal: tracking.routes.length,
      activeRouteRecords: currentRoutes.length,
      retiredRouteRecords: tracking.routes.filter((route) => route.lifecycle === 'retired').length,
      activeRoutesWithoutResolvedUrls: missingRouteUrlIds.length,
      urlRegistrations: allUrls.length,
      uniqueResolvedUrls: new Set(allUrls).size,
      routeClassifications: classifications,
    },
    reconciliation: {
      routeIdentityMultisetMatchesInventory: routeMismatches.length === 0,
      activePagePathsMatchInventory:
        missingActivePagePaths.length === 0 && untrackedInventoryPagePaths.length === 0,
      plannedTargetsAreNotCountedAsImplementedPages: true,
    },
    runtimeCoverage: {
      c06BaselineExecution: {
        routeRowsInScope: currentRoutes.length,
        routeRowsWithBrowserRuntimeChecks: 0,
        routeRowsWithScreenshots: 0,
        routeRowsWithA11yAutomation: 0,
      },
      latestLocalEvidence: {
        routeRowsWithBrowserRuntimeChecks: routeRowsWithLocalUiMockPass,
        routeRowsWithScreenshots: 0,
        routeRowsWithA11yAutomation: 0,
        evidenceIds: [
          ...new Set(routes.map((route) => route.c06Coverage?.runtime?.evidenceId).filter(Boolean)),
        ],
        scope:
          'Local UI mock evidence only; not backend, staging, UAT, visual or accessibility acceptance.',
      },
      historicalProjectEvidenceReconciledInThisStep: false,
      stateViewportThemeLocaleRoleCells:
        'Interaction-state, viewport, theme and locale cells remain pending unless separately evidenced; role/flag classification and runtime details are recorded per route below.',
    },
    worktreePreservation: {
      originalCheckoutBranch: 'codex/frontend-readiness-remediation-20261013',
      originalCheckoutHeadAtStart: '074ed3bedfbbcac9e7c31697911ebf234845f0ad',
      originalCheckoutDirtyPathsPreserved: 54,
      trackedDirtyPaths: 51,
      untrackedPaths: 3,
      dirtyPathContentsCopiedIntoThisMigration: false,
    },
  },
  implementation: {
    platform: shellConfig,
    themes: {
      configuredModes: ['light', 'dark'],
      providerSource: 'src/shared/theme/ThemeContext.tsx',
      initialMode: 'light',
      applicationTiming: 'ThemeProvider applies the document class in useEffect.',
      runtimeFlickerStatus: 'not_verified',
    },
    locale: {
      htmlLanguage: 'en',
      source: 'index.html',
      supportedProductLocales: null,
      runtimeStatus: 'not_established',
    },
    interactionStatesToClassify: [
      'default',
      'hover',
      'focus-visible',
      'active',
      'selected',
      'disabled',
      'readonly',
      'loading-submitting',
      'empty',
      'no-results',
      'error',
      'success',
      'partial-data',
      'permission-denied',
    ],
  },
  dimensionDefinitions,
  matrixStatus:
    routeRowsWithLocalUiMockPass > 0
      ? 'partial_local_ui_mock_runtime_coverage'
      : 'baseline_only_runtime_not_run',
  routes,
};

const serialized = `${JSON.stringify(matrix, null, 2)}\n`;
if (write) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, 'utf8');
  process.stdout.write(
    `Wrote ${path.relative(root, outputPath)}: ${routes.length} routes; ${new Set(allUrls).size} unique URLs; local UI mock runtime rows: ${routeRowsWithLocalUiMockPass}.\n`,
  );
} else {
  if (!fs.existsSync(outputPath)) throw new Error(`Missing matrix artifact: ${outputPath}`);
  const actual = fs.readFileSync(outputPath, 'utf8');
  if (actual !== serialized)
    throw new Error(`Route matrix differs from source inputs: ${outputPath}`);
  process.stdout.write(
    `PASS ${path.relative(root, outputPath)}: ${routes.length} route rows reconcile; local UI mock runtime rows: ${routeRowsWithLocalUiMockPass}.\n`,
  );
}

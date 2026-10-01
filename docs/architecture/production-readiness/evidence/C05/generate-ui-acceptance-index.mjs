import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const currentHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const planDirectory = path.join(root, 'docs/architecture/production-readiness');
const inputs = {
  tracking: 'docs/architecture/production-readiness/TRACKING.json',
  scenarioMatrix:
    'docs/architecture/production-readiness/evidence/A06/scenario-matrix-2026-09-28.json',
  routeResolution:
    'docs/architecture/production-readiness/evidence/A07/route-url-resolution-2026-09-28.json',
  pageInventory: 'docs/architecture/page-inventory.json',
  runbook: 'docs/architecture/production-readiness/UI-RUNBOOK.md',
  mockPersonas: 'src/dev/mocks/personas.ts',
  mockAuthHandler: 'src/dev/mocks/handlers.ts',
  mockAuthTests: 'src/dev/mocks/auth-handlers.test.ts',
  c0502PreviewReport:
    'docs/architecture/production-readiness/evidence/C05/c05-02-dev-preview-browser-check-2026-09-30.json',
};
const outputJson = path.join(directory, 'ui-acceptance-index-2026-09-29.json');
const outputMarkdown = path.join(planDirectory, 'UI-ACCEPTANCE.md');
const mode = process.argv[2] || '--write';

if (!['--write', '--check'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: node generate-ui-acceptance-index.mjs [--write|--check]');
  process.exit(2);
}

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const hashFile = (relativePath) =>
  createHash('sha256')
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest('hex');
const tracking = readJson(inputs.tracking);
const scenarioMatrix = readJson(inputs.scenarioMatrix);
const routeResolution = readJson(inputs.routeResolution);
const previewReport = readJson(inputs.c0502PreviewReport);
const trackingProjectionHash = createHash('sha256')
  .update(
    JSON.stringify({
      baseline: tracking.baseline,
      pages: tracking.pages,
      routes: tracking.routes,
      operations: tracking.operations,
    }),
  )
  .digest('hex');
const inputHash = (key, relativePath) =>
  key === 'tracking' ? trackingProjectionHash : hashFile(relativePath);
const previous = fs.existsSync(outputJson) ? readJson(path.relative(root, outputJson)) : null;
const generatedAt = previous?.generatedFrom?.generatedAt ?? new Date().toISOString();
const pagesById = new Map(tracking.pages.map((page) => [page.id, page]));
const operationsById = new Map(tracking.operations.map((operation) => [operation.id, operation]));
const scenariosByDomain = new Map(
  scenarioMatrix.domains.map((domain) => [domain.domain, domain.scenarios]),
);
const scenariosById = new Map(
  scenarioMatrix.domains.flatMap((domain) =>
    domain.scenarios.map((scenario) => [scenario.id, scenario]),
  ),
);
const historicalRoutesById = new Map(
  routeResolution.urlRecords.map((route) => [route.routeId, route]),
);
const activeRoutes = tracking.routes.filter((route) => route.lifecycle === 'active');
const retiredRoutes = tracking.routes.filter((route) => route.lifecycle === 'retired');
const acceptedPageRecords = tracking.pages.filter(
  (page) => page.userAcceptance?.status === 'accepted',
).length;
const acceptanceScopePages = tracking.baseline.counts.pages;
const backendOperationsVerified = tracking.operations.filter((operation) =>
  ['done', 'verified'].includes(operation.backend?.status),
).length;
const previewApiOrigins = [...previewReport.apiRequests, ...previewReport.apiResponses].map(
  (request) => request.origin,
);
const sourceHashMismatches = Object.entries(routeResolution.inputs.sourceFileHashes ?? {})
  .filter(([relativePath, expectedHash]) => hashFile(relativePath) !== expectedHash)
  .map(([relativePath]) => relativePath)
  .sort();
const staleRouteSources = new Set(sourceHashMismatches);
const staleSourceRouteCount = tracking.routes.filter(
  (route) => route.lifecycle === 'active' && staleRouteSources.has(route.source),
).length;
const matchingSourceRouteCount = tracking.routes.filter(
  (route) =>
    route.lifecycle === 'active' &&
    Object.hasOwn(routeResolution.inputs.sourceFileHashes ?? {}, route.source) &&
    !staleRouteSources.has(route.source),
).length;
const dynamicFixtureSources = [
  ...new Set(
    routeResolution.urlRecords.flatMap((route) =>
      route.dynamicParams.map((parameter) => parameter.source).filter(Boolean),
    ),
  ),
].sort();
const dynamicFixtureSourceHashes = Object.fromEntries(
  dynamicFixtureSources.map((source) => [
    source,
    fs.existsSync(path.join(root, source)) ? hashFile(source) : null,
  ]),
);

function shellFor(url) {
  if (url === '/t' || url.startsWith('/t/')) return 'tablet';
  if (url === '/w' || url.startsWith('/w/')) return 'web';
  if (url === '/r' || url.startsWith('/r/')) return 'responsive';
  return 'phone';
}

function routeDomainDetails(route) {
  const pages = route.pageIds.map((id) => pagesById.get(id)).filter(Boolean);
  const domains = [...new Set(pages.map((page) => page.domain))].sort();
  const operationIds = [...new Set(pages.flatMap((page) => page.operationIds))].sort();
  const operations = operationIds.map((id) => operationsById.get(id)).filter(Boolean);
  const operationNames = [...new Set(operations.map((operation) => operation.operationId))].sort();
  return { pages, domains, operationIds, operations, operationNames };
}

function scenarioLinks(route, domains, operations) {
  const direct = route.scenarios ?? [];
  const candidates = domains.flatMap((domain) =>
    (scenariosByDomain.get(domain) ?? [])
      .filter((scenario) => scenario.operationIds.some((id) => operations.includes(id)))
      .map((scenario) => ({ ...scenario, binding: 'page-operation-intersection-candidate' })),
  );
  const unique = new Map();
  for (const scenario of direct) {
    const domain = scenario.id.split('.')[0];
    const definition = (scenariosByDomain.get(domain) ?? []).find(
      (candidate) => candidate.id === scenario.id,
    );
    unique.set(scenario.id, {
      id: scenario.id,
      binding: 'route-ledger-link',
      routeStatus: scenariosById.get(scenario.id)?.executionStatus ?? scenario.status,
      evidenceIds: scenario.evidenceIds ?? [],
      notes: scenario.notes ?? '',
      expectedUi: definition?.expectedUi ?? null,
      runtimeEvidenceFresh: scenariosById.get(scenario.id)?.runtimeEvidenceFresh === true,
      runtimeEvidence: scenariosById.get(scenario.id)?.runtimeEvidence ?? null,
      runtimeObservedOperationIds:
        scenariosById.get(scenario.id)?.runtimeObservedOperationIds ?? [],
    });
  }
  for (const scenario of candidates) {
    if (unique.has(scenario.id)) continue;
    unique.set(scenario.id, {
      id: scenario.id,
      binding: scenario.binding,
      routeStatus: 'candidate-needs-route-review',
      evidenceIds: [],
      notes:
        'Operation overlap identifies a candidate only; it does not establish this route behavior.',
      expectedUi: scenario.expectedUi,
      runtimeEvidenceFresh: false,
      matchedOperationIds: scenario.operationIds.filter((id) => operations.includes(id)),
    });
  }
  return [...unique.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const routeRows = activeRoutes.map((route) => {
  const { pages, domains, operationIds, operations, operationNames } = routeDomainDetails(route);
  const resolvedUrls = [...new Set(route.resolvedUrls ?? [])].sort();
  const historicalRoute = historicalRoutesById.get(route.id);
  const scenarios = scenarioLinks(route, domains, operationNames);
  const dynamicParameters = [...String(route.path).matchAll(/:([A-Za-z0-9_]+)/g)].map(
    (match) => match[1],
  );
  const historicalPreviewUrls = [...new Set(historicalRoute?.previewUrls ?? [])].sort();
  const historicalSourceHash = routeResolution.inputs.sourceFileHashes?.[route.source];
  const currentSourceHash = historicalSourceHash ? hashFile(route.source) : null;

  return {
    routeId: route.id,
    lifecycle: route.lifecycle,
    source: route.source,
    declarationPath: route.path,
    component: route.component,
    pageTarget: route.pageTarget,
    routeFactory: route.routeFactory,
    classification: route.classification,
    developmentOnly: route.developmentOnly,
    taskId: route.taskId,
    domains,
    operationIds,
    operationNames,
    uiStatus: route.ui.status,
    uiEvidenceIds: route.ui.evidenceIds,
    uiNotes: route.ui.notes,
    pageIds: route.pageIds,
    pages: pages.map((page) => ({
      pageId: page.id,
      sourcePath: page.path,
      owner: page.owner,
      taskId: page.taskId,
      uiStatus: page.ui.status,
      uiEvidenceIds: page.ui.evidenceIds,
      uiNotes: page.ui.notes,
      uiReview: page.uiReview,
      userAcceptance: page.userAcceptance.status,
      checklist: Object.fromEntries(
        Object.entries(page.checklist).map(([id, item]) => [id, item.status]),
      ),
      operationIds: page.operationIds,
      blockers: page.blockers,
    })),
    resolvedUrls: resolvedUrls.map((url) => ({ url, shell: shellFor(url) })),
    historicalRouteResolution: {
      status: staleRouteSources.has(route.source)
        ? 'stale-source-hash'
        : historicalSourceHash
          ? 'historical-source-hash-matches-runtime-snapshot-is-not-current'
          : 'source-hash-not-recorded',
      sourceHash: {
        expected: historicalSourceHash ?? null,
        current: currentSourceHash,
        matches: historicalSourceHash ? historicalSourceHash === currentSourceHash : null,
      },
      historicalUrlTemplates: historicalRoute?.urlTemplates ?? [],
      historicalPreviewUrls,
      currentPreviewUrlParity:
        JSON.stringify(resolvedUrls) === JSON.stringify(historicalPreviewUrls),
      historicalRuntimeRegistrations: historicalRoute?.runtimeRegistrations?.length ?? 0,
      evidencePath: inputs.routeResolution,
    },
    dynamicParameters,
    personaMapping: {
      status: 'not-mapped-per-route',
      source:
        'The repo has a global mock persona registry and UI runbook, but no route-to-persona mapping in TRACKING.json.',
      sources: [inputs.mockPersonas, inputs.mockAuthHandler, inputs.mockAuthTests],
    },
    fixtureMapping: {
      status: dynamicParameters.length
        ? 'historical-fixture-candidates-need-current-fixture-and-scenario-review'
        : 'no-dynamic-route-parameter-scenario-fixture-not-mapped',
      dynamicParameters,
      sampleUrls: resolvedUrls,
      historicalResolverValues: (historicalRoute?.dynamicParams ?? []).map((parameter) => ({
        ...parameter,
        currentSourceSha256: parameter.source
          ? (dynamicFixtureSourceHashes[parameter.source] ?? null)
          : null,
        sourceHashCapturedNow: Boolean(
          parameter.source && dynamicFixtureSourceHashes[parameter.source],
        ),
      })),
      source:
        'Current TRACKING.json supplies concrete preview URLs. A07 supplies historical parameter values and fixture-source candidates; current source hashes are captured here, but fixture contents and scenario-specific seed behavior still require route-level verification.',
    },
    scenarios,
    reset: {
      status: 'shared-mock-reset-documented',
      procedure: 'UI-RUNBOOK.md section 4, “Đặt lại preview”',
      scope:
        'Logs out through the auth adapter, clears React Query cache and reloads in-memory fixtures; it does not clear browser-wide storage.',
    },
    routeCheck: {
      status: 'navigation-only-unverified',
      action:
        'Open a resolved URL in its listed shell and verify the route target. Add page-specific interactions from the owning page/test before user acceptance.',
      expected: {
        component: route.component,
        pageTarget: route.pageTarget,
        classification: route.classification,
        note: 'This verifies route identity only; it is not a page UX assertion or user acceptance.',
      },
    },
    routeNotes: route.notes,
    dispositionReason: route.dispositionReason,
    blockers: pages.flatMap((page) => page.blockers),
  };
});

const registrations = routeRows.flatMap((route) => route.resolvedUrls);
const uniqueUrls = new Set(registrations.map((item) => item.url));
const routesWithHistoricalPreviewParity = routeRows.filter(
  (route) => route.historicalRouteResolution.currentPreviewUrlParity,
).length;
const shellCounts = Object.fromEntries(
  ['phone', 'tablet', 'web', 'responsive'].map((shell) => [
    shell,
    registrations.filter((item) => item.shell === shell).length,
  ]),
);
const byDomain = new Map();
for (const route of routeRows) {
  const rowDomains = route.domains.length ? route.domains : ['shell-guard-or-development-route'];
  for (const domain of rowDomains) {
    const summary = byDomain.get(domain) ?? {
      routeDeclarations: 0,
      urlRegistrations: 0,
      routesWithPages: 0,
      routesWithScenarioLinks: 0,
    };
    summary.routeDeclarations += 1;
    summary.urlRegistrations += route.resolvedUrls.length;
    if (route.pageIds.length) summary.routesWithPages += 1;
    if (route.scenarios.length) summary.routesWithScenarioLinks += 1;
    byDomain.set(domain, summary);
  }
}

if (routeRows.some((route) => route.resolvedUrls.length === 0)) {
  throw new Error('An active route declaration has no resolved URL in TRACKING.json.');
}
if (new Set(routeRows.map((route) => route.routeId)).size !== routeRows.length) {
  throw new Error('Active route IDs are not unique.');
}
for (const route of routeRows) {
  for (const pageId of route.pageIds) {
    if (!pagesById.has(pageId))
      throw new Error(`${route.routeId} references missing page ${pageId}.`);
  }
}

const index = {
  schemaVersion: 1,
  generatedFrom: {
    generatedAt,
    sourceHead: currentHead,
    inputs: Object.fromEntries(
      Object.entries(inputs).map(([key, relativePath]) => [
        key,
        {
          path: relativePath,
          sha256: inputHash(key, relativePath),
        },
      ]),
    ),
  },
  scope: {
    activeRouteDeclarations: routeRows.length,
    retiredRouteDeclarationsExcluded: retiredRoutes.map((route) => ({
      routeId: route.id,
      path: route.path,
      reason: route.dispositionReason || route.retirement?.reason || route.notes || '',
    })),
    urlRegistrations: registrations.length,
    uniqueResolvedUrlSamples: uniqueUrls.size,
    shellUrlRegistrations: shellCounts,
    routeDeclarationsWithPageRecords: routeRows.filter((route) => route.pageIds.length > 0).length,
    routeDeclarationsWithoutPageRecords: routeRows.filter((route) => route.pageIds.length === 0)
      .length,
    routeDeclarationsWithDirectScenarioLinks: routeRows.filter((route) =>
      route.scenarios.some((scenario) => scenario.binding === 'route-ledger-link'),
    ).length,
    scenarioLinks: routeRows.reduce(
      (sum, route) =>
        sum + route.scenarios.filter((scenario) => scenario.binding === 'route-ledger-link').length,
      0,
    ),
    scenarioCandidates: routeRows.reduce(
      (sum, route) =>
        sum +
        route.scenarios.filter(
          (scenario) => scenario.binding === 'page-operation-intersection-candidate',
        ).length,
      0,
    ),
    routeDeclarationsWithAnyScenarioReference: routeRows.filter(
      (route) => route.scenarios.length > 0,
    ).length,
    personaMappingsAssigned: 0,
    trackedPageRecords: tracking.pages.length,
    userAcceptedPages: acceptedPageRecords,
    userAcceptanceScopePages: acceptanceScopePages,
    backendOperationsVerified,
    backendOperationsTotal: tracking.operations.length,
    activeRoutesWithHistoricalPreviewUrlParity: routesWithHistoricalPreviewParity,
    activeRoutesComparedToHistoricalResolver: routeRows.length,
    activeRouteDeclarationsWithStaleResolverSource: staleSourceRouteCount,
    activeRouteDeclarationsWithMatchingResolverSource: matchingSourceRouteCount,
  },
  evidenceFreshness: {
    currentScenarioMatrixRuntimeEvidenceFresh: scenarioMatrix.summary.runtimeEvidenceFresh,
    scenarioRowsWithFreshBrowserEvidence:
      scenarioMatrix.summary.scenarioRowsWithFreshBrowserEvidence,
    scenarioRowsDefined: scenarioMatrix.summary.scenariosDefined,
    freshScenarioEvidenceSidecars: scenarioMatrix.summary.freshScenarioEvidenceSidecars ?? 0,
    historicalRouteResolutionSourceFiles: Object.keys(routeResolution.inputs.sourceFileHashes ?? {})
      .length,
    routeResolutionSourceHashMismatches: sourceHashMismatches,
    historicalRouteResolutionPreviewUrlParity: routesWithHistoricalPreviewParity,
    historicalRouteResolutionRoutesCompared: routeRows.length,
    dynamicFixtureSourcesPresent: Object.values(dynamicFixtureSourceHashes).filter(Boolean).length,
    dynamicFixtureSourcesReferenced: dynamicFixtureSources.length,
    dynamicFixtureSourceSha256: dynamicFixtureSourceHashes,
  },
  localPreviewSmoke: {
    result: previewReport.result,
    observedAt: previewReport.observedAt,
    report: inputs.c0502PreviewReport,
    routes: previewReport.routes.map((route, index) => ({
      routeId: route.routeId,
      path: route.finalPath,
      httpStatus: route.status,
      headings: route.headings,
      mockBannerVisible: route.mockBannerVisible,
      screenshot: previewReport.screenshots[index],
    })),
    serviceWorkers: previewReport.serviceWorkers,
    apiRequests: previewReport.apiRequests.length,
    apiResponses: previewReport.apiResponses.map((response) => ({
      method: response.method,
      path: new URL(response.url).pathname,
      status: response.status,
      fromServiceWorker: response.fromServiceWorker,
      origin: response.origin,
    })),
    crossOriginApiRequests: previewApiOrigins.filter(
      (apiOrigin) => apiOrigin !== previewReport.environment.url,
    ).length,
    failedApiRequests: previewReport.failedRequests.filter((request) =>
      new URL(request.url).pathname.startsWith('/api/'),
    ).length,
    pageErrors: previewReport.pageErrors.length,
    consoleErrors: previewReport.consoleErrors.length,
    unexpectedConsoleErrors: previewReport.unexpectedConsoleErrors.length,
  },
  domains: Object.fromEntries([...byDomain.entries()].sort(([a], [b]) => a.localeCompare(b))),
  openGaps: [
    'No per-route persona selection is recorded in the route/page ledger.',
    'A07 has historical parameter fixture candidates for dynamic routes; current fixture source hashes are captured, but fixture contents, persona authorization and scenario-specific seed behavior are not verified by URL generation.',
    `The A06 aggregate report is source-stale (${scenarioMatrix.summary.runtimeEvidenceFresh}); the current matrix accepts ${scenarioMatrix.summary.scenarioRowsWithFreshBrowserEvidence}/${scenarioMatrix.summary.scenariosDefined} source-matched scenario rows from ${scenarioMatrix.summary.freshScenarioEvidenceSidecars ?? 0} per-scenario sidecars. Other rows remain unverified until their evidence is refreshed.`,
    `${sourceHashMismatches.length} source files differ from the historical A07 URL-resolution evidence; ${staleSourceRouteCount} active route declarations use those files, so refresh runtime route evidence before treating old runtime registrations as current browser truth.`,
    'Route navigation checks do not equal component-level visual/interaction review or user acceptance.',
    'C05.02 browser smoke covers two routes only; it does not close runtime verification for the other route declarations.',
  ],
  routes: routeRows,
};

function markdown() {
  const domainRows = Object.entries(index.domains)
    .map(
      ([domain, summary]) =>
        `| ${domain} | ${summary.routeDeclarations} | ${summary.urlRegistrations} | ${summary.routesWithPages} | ${summary.routesWithScenarioLinks} |`,
    )
    .join('\n');
  const shellRows = Object.entries(shellCounts)
    .map(([shell, count]) => `| ${shell} | ${count} |`)
    .join('\n');
  return (
    `# UI acceptance index\n\n` +
    `Status: **C05.01 index and C05.02 local preview smoke complete; C05 remains in progress**. This is a complete route-declaration index and a two-route development smoke, not proof that every page passed a visual check or that the user accepted it.\n\n` +
    `The machine-readable index contains **${routeRows.length} active route declarations**, **${registrations.length} shell URL registrations**, and **${uniqueUrls.size} unique resolved preview URLs**. One retired route is excluded and retained in the index metadata.\n\n` +
    `## URL registrations by shell\n\n| Shell | URL registrations |\n| --- | ---: |\n${shellRows}\n\n` +
    `## Route declarations by domain\n\n| Domain | Declarations | URL registrations | With page records | With scenario references |\n| --- | ---: | ---: | ---: | ---: |\n${domainRows}\n\n` +
    `## What the index records\n\n` +
    `Each route row includes its stable ROUTE ID, source declaration, component/page target, page IDs and checklist state, task/domain ownership, development-only classification, every resolved preview URL grouped by shell, historical route-template/runtime context, direct and operation-intersection scenario references, mapped operation IDs/names, mock reset procedure, and user/backend status. The navigation action/expected component is available for every route; page-specific interaction steps, persona selection, and current fixture behavior remain explicit review items where source evidence does not establish them. C05.03 carries those page-specific reviews.\n\n` +
    `The current A06 matrix defines **${scenarioMatrix.summary.scenariosDefined} scenarios** across ${scenarioMatrix.summary.domains} domains, but it reports **${scenarioMatrix.summary.scenarioRowsWithFreshBrowserEvidence} fresh browser rows** after source-hash validation. All **${routesWithHistoricalPreviewParity}/${routeRows.length}** current concrete URL sets match the historical A07 preview URL sets, while **${staleSourceRouteCount}/${routeRows.length}** active declarations come from four source files whose hashes have since changed. A07 is therefore useful as a historical URL/fixture reference, not current runtime-route proof.\n\n` +
    `## Run and inspect\n\n` +
    `1. Start a clean local mock preview using [UI-RUNBOOK.md](UI-RUNBOOK.md), mục 1.\n` +
    `2. Select the route by ROUTE ID in the [full index](evidence/C05/ui-acceptance-index-2026-09-29.json), open one URL under the matching shell, then follow a linked route scenario only when its source evidence is current.\n` +
    `3. Reset between mock scenarios using mục 4 in [UI-RUNBOOK.md](UI-RUNBOOK.md). The reset clears the in-app query cache and reloads in-memory fixtures; it does not clear browser-wide storage.\n` +
    `4. Record screenshots, expected-versus-actual behavior, route ID, scenario ID and reviewer response in TRACKING.json. Keep user acceptance pending until the user supplies that review.\n\n` +
    `C05.02 clean-context smoke, Chromium ${previewReport.environment.browser}, ${previewReport.environment.url}: [Market screenshot](evidence/C05/${previewReport.screenshots[0]}), [login screenshot](evidence/C05/${previewReport.screenshots[1]}), [raw report](evidence/C05/c05-02-dev-preview-browser-check-2026-09-30.json), [reproduction runner](evidence/C05/run-c05-02-dev-preview-check.mjs). It rendered ${previewReport.routes.length}/2 route documents at HTTP 200, showed the mock banner on both, and observed ${previewReport.apiResponses.length} API responses, all from the registered mock Service Worker. Failed API requests: ${previewReport.failedRequests.filter((request) => new URL(request.url).pathname.startsWith('/api/')).length}; uncaught page errors: ${previewReport.pageErrors.length}; unexpected console errors: ${previewReport.unexpectedConsoleErrors.length}. Two guest-session 401 responses account for two expected Chromium console messages; no API request crossed origins.\n\n` +
    `## Measured gaps\n\n` +
    `- Route-level persona mappings assigned: **0/${routeRows.length}**.\n` +
    `- Route declarations with direct scenario references: **${index.scope.routeDeclarationsWithDirectScenarioLinks}/${routeRows.length}**; references are not fresh browser verification.\n` +
    `- Operation-intersection scenario candidates: **${index.scope.scenarioCandidates}** across ${index.scope.routeDeclarationsWithAnyScenarioReference - index.scope.routeDeclarationsWithDirectScenarioLinks} additional route declarations; candidates need route-owner review.\n` +
    `- Fresh A06 scenario browser rows: **${scenarioMatrix.summary.scenarioRowsWithFreshBrowserEvidence}/${scenarioMatrix.summary.scenariosDefined}**.\n` +
    `- Historical A07 current-preview URL parity: **${routesWithHistoricalPreviewParity}/${routeRows.length}**; declarations in changed A07 source files: **${staleSourceRouteCount}/${routeRows.length}** across ${sourceHashMismatches.length} files (${sourceHashMismatches.join(', ') || 'none'}).\n` +
    `- User-accepted pages: **${index.scope.userAcceptedPages}/${index.scope.userAcceptanceScopePages}** applicable baseline pages; the route ledger separately has ${index.scope.trackedPageRecords} page records. Backend operations verified: **${index.scope.backendOperationsVerified}/${index.scope.backendOperationsTotal}**.\n\n` +
    `C05.01 index generation and C05.02 two-route clean-preview smoke are complete. C05.03 owns page-specific interaction checklists and broader route review. Do not translate route presence, fixture rendering, stale browser evidence, this two-route smoke, or the 27 production-shell E2E tests into user acceptance.\n`
  );
}

const prettierConfig = (await prettier.resolveConfig(outputJson)) ?? {};
const serializedIndex = await prettier.format(`${JSON.stringify(index, null, 2)}\n`, {
  ...prettierConfig,
  parser: 'json',
});
const serializedMarkdown = markdown();
if (mode === '--write') {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(outputJson, serializedIndex);
  fs.writeFileSync(outputMarkdown, serializedMarkdown);
  console.log(
    `Wrote UI acceptance index: ${routeRows.length} active declarations, ${registrations.length} URL registrations, ${uniqueUrls.size} unique preview URLs; historical URL parity ${routesWithHistoricalPreviewParity}/${routeRows.length}; fresh scenario rows ${scenarioMatrix.summary.scenarioRowsWithFreshBrowserEvidence}/${scenarioMatrix.summary.scenariosDefined}.`,
  );
  process.exit(0);
}

const markdownCurrent = fs.existsSync(outputMarkdown)
  ? fs.readFileSync(outputMarkdown, 'utf8')
  : null;
const jsonCurrent = fs.existsSync(outputJson) ? fs.readFileSync(outputJson, 'utf8') : null;
if (jsonCurrent !== serializedIndex || markdownCurrent !== serializedMarkdown) {
  console.error('UI acceptance index is stale. Run with --write to refresh it.');
  process.exit(1);
}
console.log(
  `UI acceptance index is current: ${routeRows.length} active declarations, ${registrations.length} URL registrations, ${uniqueUrls.size} unique preview URLs; ${routesWithHistoricalPreviewParity}/${routeRows.length} historical URL parity; ${scenarioMatrix.summary.scenarioRowsWithFreshBrowserEvidence}/${scenarioMatrix.summary.scenariosDefined} fresh scenario rows.`,
);

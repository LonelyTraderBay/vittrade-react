import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';
import prettier from 'prettier';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Loopback preview only.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const suffix = process.env.EVIDENCE_RUN_SUFFIX || 'current-head';
assert.match(suffix, /^[a-z0-9-]+$/i, 'Evidence run suffix must be alphanumeric or hyphenated.');
const screenshotPaths = {
  overview: path.join(
    directory,
    'preview-admin-unauthorized-overview-' + date + '-' + suffix + '.png',
  ),
  funnel: path.join(directory, 'preview-admin-unauthorized-funnel-' + date + '-' + suffix + '.png'),
  abTests: path.join(
    directory,
    'preview-admin-unauthorized-ab-tests-' + date + '-' + suffix + '.png',
  ),
};
const reportPath = path.join(
  directory,
  'admin-unauthorized-browser-check-' + date + '-' + suffix + '.json',
);

const routes = [
  {
    route: '/w/admin',
    operationId: 'getAdminOverview',
    successText: '1.284',
    responseContent: 'Active users',
    screenshotPath: screenshotPaths.overview,
  },
  {
    route: '/w/admin/funnels',
    operationId: 'getAdminFunnel',
    successText: '10.000 users',
    responseContent: 'Funnel analytics',
    screenshotPath: screenshotPaths.funnel,
  },
  {
    route: '/w/admin/abtests',
    operationId: 'listAdminAbTests',
    successText: 'trade-terminal-v2',
    responseContent: 'A/B tests',
    screenshotPath: screenshotPaths.abTests,
  },
];
const operationPaths = {
  getAdminOverview: '/api/admin/overview',
  getAdminFunnel: '/api/admin/analytics/funnel',
  listAdminAbTests: '/api/admin/analytics/ab-tests',
};
const expectedOperationIds = [
  'getAdminOverview',
  'getAdminFunnel',
  'listAdminAbTests',
  'getAdminAbTest',
  'updateAdminFeatureFlag',
];

const adminContract = parse(
  await fs.readFile(path.join(root, 'contracts/openapi/admin.yaml'), 'utf8'),
);
const authContract = parse(
  await fs.readFile(path.join(root, 'contracts/openapi/auth.yaml'), 'utf8'),
);
const adminOperations = Object.values(adminContract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) => expectedOperationIds.includes(operation.operationId));
const declared401OperationIds = adminOperations
  .filter((operation) => Object.hasOwn(operation.responses ?? {}, '401'))
  .map((operation) => operation.operationId)
  .sort();
assert.deepEqual(declared401OperationIds, [...expectedOperationIds].sort());
const refreshOperation = Object.values(authContract.paths)
  .flatMap((item) => Object.values(item))
  .find((operation) => operation.operationId === 'refreshSession');
assert.ok(refreshOperation, 'Auth contract must define refreshSession.');
assert.ok(Object.hasOwn(refreshOperation.responses ?? {}, '200'));
assert.equal(Object.hasOwn(refreshOperation.responses ?? {}, '401'), false);

const sourceFiles = [
  'contracts/openapi/admin.yaml',
  'contracts/openapi/auth.yaml',
  'docs/architecture/production-readiness/evidence/A06/run-admin-unauthorized-browser-check.mjs',
  'src/app/routeConfig.ts',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/admin/api/admin-api.ts',
  'src/features/admin/model/admin-queries.ts',
  'src/features/admin/routes.ts',
  'src/features/admin/pages/AdminOverviewContractPage.tsx',
  'src/features/admin/pages/AdminFunnelContractPage.tsx',
  'src/features/admin/pages/AdminAbTestsContractPage.tsx',
  'src/features/admin/pages/AdminQueryErrorState.tsx',
  'src/shared/api/api-error.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/main.tsx',
];
const sha256 = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, relativePath)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await sha256(file)])),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(20_000);
const startedAt = Date.now();
const externalApiOrigins = new Set();
const apiRequests = [];
const apiResponses = [];
const apiRespondedRequests = new WeakSet();
const adminRequests = [];
const adminResponses = [];
const adminWriteRequests = [];
const apiRequestFailures = [];
const pageErrors = [];
const pendingApiRequests = new Set();

await page.addInitScript(() => {
  const originalFetch = window.fetch.bind(window);
  const refreshFixtures = [];
  Object.defineProperty(window, '__vittradeAuthRefreshContractFixtures', {
    configurable: false,
    value: refreshFixtures,
  });
  window.fetch = async (input, init) => {
    const inputUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(inputUrl, window.location.href);
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    if (url.pathname !== '/api/auth/refresh' || method !== 'POST') {
      return originalFetch(input, init);
    }
    refreshFixtures.push({
      method,
      path: url.pathname,
      status: 200,
      body: null,
      source: 'runner-local contract fixture; request not sent to service worker or backend',
    });
    return new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

page.on('request', (request) => {
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    (request.headers().accept?.includes('application/json') || url.pathname.startsWith('/api/'))
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  const operationId = Object.entries(operationPaths).find(
    ([, pathname]) => pathname === url.pathname,
  )?.[0];
  const item = { method: request.method(), path: url.pathname, operationId: operationId ?? null };
  apiRequests.push(item);
  pendingApiRequests.add(request);
  if (url.pathname.startsWith('/api/admin/')) {
    if (operationId && request.method() === 'GET') adminRequests.push({ ...item, operationId });
    else adminWriteRequests.push(item);
  }
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const operationId = Object.entries(operationPaths).find(
    ([, pathname]) => pathname === url.pathname,
  )?.[0];
  const item = {
    method: response.request().method(),
    path: url.pathname,
    operationId: operationId ?? null,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  };
  pendingApiRequests.delete(response.request());
  apiRespondedRequests.add(response.request());
  apiResponses.push(item);
  if (operationId) adminResponses.push({ ...item, operationId });
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  pendingApiRequests.delete(request);
  apiRequestFailures.push({
    method: request.method(),
    path: url.pathname,
    error: request.failure()?.errorText ?? 'unknown',
    responseAlreadyObserved: apiRespondedRequests.has(request),
    pagePathAtFailure: new URL(page.url()).pathname,
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function navigate(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

async function waitForApiIdle(timeoutMs = 3_000) {
  const deadline = Date.now() + timeoutMs;
  while (pendingApiRequests.size > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return pendingApiRequests.size;
}

async function openPreviewControlsIfNeeded(label) {
  if ((await page.getByLabel(label).count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
}

async function signInAdminThroughPreview() {
  await openPreviewControlsIfNeeded('Tài khoản xem trước');
  await page.getByLabel('Tài khoản xem trước').selectOption('admin');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  await waitForApiIdle();
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
  await waitForApiIdle();
}

async function applyAdminScenario(state, scenarioId) {
  await openPreviewControlsIfNeeded('Miền API');
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption(state);
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText(scenarioId).waitFor();
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
}

try {
  await page.goto(originUrl + '/w/auth/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await signInAdminThroughPreview();
  await applyAdminScenario('success', 'admin.success');

  const successFixtures = [];
  for (const route of routes) {
    await navigate(route.route);
    await page.getByText(route.successText, { exact: true }).waitFor({ state: 'visible' });
    successFixtures.push({ route: route.route, operationId: route.operationId, visible: true });
  }
  await navigate('/w/home');
  await applyAdminScenario('unauthorized', 'admin.unauthorized');

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(serviceWorkerControlled, true, 'The local service worker must control the page.');
  const adminRequestStart = adminRequests.length;
  const adminResponseStart = adminResponses.length;
  const refreshFixtureStart = await page.evaluate(
    () => window.__vittradeAuthRefreshContractFixtures?.length ?? 0,
  );
  const unauthorizedReads = [];

  for (const [index, route] of routes.entries()) {
    const readRequestStart = adminRequests.length;
    const readResponseStart = adminResponses.length;
    const refreshCountBefore = await page.evaluate(
      () => window.__vittradeAuthRefreshContractFixtures?.length ?? 0,
    );
    await navigate(route.route);
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    await page.getByTestId('auth-email').waitFor();
    await waitForApiIdle();
    const observedRequests = adminRequests.slice(readRequestStart);
    const observedResponses = adminResponses.slice(readResponseStart);
    const refreshFixtures = await page.evaluate(
      () => window.__vittradeAuthRefreshContractFixtures?.slice() ?? [],
    );
    const refreshForRead = refreshFixtures.slice(refreshCountBefore);
    const staleSuccessContentVisible = await page
      .getByText(route.successText, { exact: true })
      .isVisible()
      .catch(() => false);
    assert.equal(observedRequests.length, 1, route.operationId + ' must be requested once.');
    assert.equal(observedRequests[0].method, 'GET');
    assert.equal(observedRequests[0].operationId, route.operationId);
    assert.equal(observedResponses.length, 1, route.operationId + ' must have one response.');
    assert.equal(observedResponses[0].status, 401);
    assert.equal(observedResponses[0].fromServiceWorker, true);
    assert.equal(refreshForRead.length, 1, 'Each Admin 401 must use one refresh contract fixture.');
    assert.equal(refreshForRead[0].status, 200);
    assert.equal(refreshForRead[0].body, null);
    assert.equal(staleSuccessContentVisible, false);
    await page.screenshot({ path: route.screenshotPath, fullPage: true });

    unauthorizedReads.push({
      route: route.route,
      operationId: route.operationId,
      requestCount: observedRequests.length,
      responseCount: observedResponses.length,
      responseStatus: observedResponses[0].status,
      responseFromServiceWorker: observedResponses[0].fromServiceWorker,
      refreshContractFixtureCount: refreshForRead.length,
      refreshStatus: refreshForRead[0].status,
      refreshBody: refreshForRead[0].body,
      redirectedToLogin: true,
      staleSuccessContentVisible,
      screenshot: path.basename(route.screenshotPath),
    });
    if (index < routes.length - 1) await signInAdminThroughPreview();
  }

  const refreshFixtures = await page.evaluate(
    () => window.__vittradeAuthRefreshContractFixtures?.slice() ?? [],
  );
  const unauthorizedRequests = adminRequests.slice(adminRequestStart);
  const unauthorizedResponses = adminResponses.slice(adminResponseStart);
  const adminApiRequestFailures = apiRequestFailures.filter((item) =>
    item.path.startsWith('/api/admin/'),
  );
  const pendingApiRequestCount = await waitForApiIdle();
  const observedOperationIds = [
    ...new Set(unauthorizedResponses.map((item) => item.operationId)),
  ].sort();
  const allApiResponsesFromServiceWorker = apiResponses.every((item) => item.fromServiceWorker);
  assert.deepEqual(observedOperationIds, routes.map((route) => route.operationId).sort());
  assert.equal(unauthorizedRequests.length, routes.length);
  assert.equal(unauthorizedResponses.length, routes.length);
  assert.equal(
    unauthorizedResponses.every((item) => item.status === 401),
    true,
  );
  assert.equal(refreshFixtures.length - refreshFixtureStart, routes.length);
  assert.deepEqual(adminWriteRequests, [], 'Unauthorized scenario must not send Admin writes.');
  assert.deepEqual(adminApiRequestFailures, [], 'Admin reads must settle with HTTP responses.');
  assert.deepEqual(pageErrors, []);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(allApiResponsesFromServiceWorker, true);
  assert.equal(
    pendingApiRequestCount,
    0,
    'All observed API requests must settle before reporting.',
  );

  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'admin.unauthorized',
      domain: 'admin',
      state: 'unauthorized',
      status: 'passed',
      persona: 'admin (preview only)',
      role: 'admin',
      permissions: ['admin:read'],
      routes: routes.map((route) => route.route),
      operationIds: expectedOperationIds,
      observedOperationIds,
      declared401OperationCount: declared401OperationIds.length,
      expectedDomainOperationCount: expectedOperationIds.length,
      coverage: 'representative_browser_observed_three_of_five_operations',
      operationRequestCounts: Object.fromEntries(
        routes.map((route) => [
          route.operationId,
          unauthorizedRequests.filter((item) => item.operationId === route.operationId).length,
        ]),
      ),
      unauthorizedReads,
      unauthorizedRequests,
      unauthorizedResponses,
      successFixtures,
      refreshContractFixtures: refreshFixtures.slice(refreshFixtureStart),
      redirectedToLoginOnAllRoutes: unauthorizedReads.every((item) => item.redirectedToLogin),
      staleSuccessContentVisibleOnAnyRoute: unauthorizedReads.some(
        (item) => item.staleSuccessContentVisible,
      ),
      adminWriteRequestCount: adminWriteRequests.length,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent: 'updateAdminFeatureFlag; current Admin UI has no form for this operation.',
      elapsedMs: Date.now() - startedAt,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, screenshotPath]) => [
          key,
          path.basename(screenshotPath),
        ]),
      ),
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedApiResponsesFromServiceWorker: allApiResponsesFromServiceWorker,
      admin401ResponsesFromServiceWorker: unauthorizedResponses.every(
        (item) => item.fromServiceWorker,
      ),
      authRefreshFixtureResponsesAreNotNetworkRequests: true,
      authRefreshContractFixtures: refreshFixtures.slice(refreshFixtureStart),
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins],
    },
    authorizationLimitations: {
      persona: 'admin',
      mockSourcePermissions: ['admin:read'],
      localMockAuthorizationEnforcementVerified: false,
      backendAuthorizationVerified: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      apiRequestFailureCount: apiRequestFailures.length,
      adminApiRequestFailureCount: adminApiRequestFailures.length,
      unrelatedNavigationAbortCallbacks: apiRequestFailures.filter(
        (item) => item.error === 'net::ERR_ABORTED' && !item.path.startsWith('/api/admin/'),
      ),
      pendingApiRequestCount,
      adminUnauthorizedRequestCount: unauthorizedRequests.length,
      adminUnauthorizedResponseCount: unauthorizedResponses.length,
      admin401ResponseCount: unauthorizedResponses.filter((item) => item.status === 401).length,
      authRefreshContractFixtureCount: refreshFixtures.length - refreshFixtureStart,
      loginRedirectCount: unauthorizedReads.filter((item) => item.redirectedToLogin).length,
      adminWriteCount: adminWriteRequests.length,
      pageErrorCount: pageErrors.length,
      successFixturePreconditions: successFixtures.length,
    },
    assertions: {
      apiRequests,
      apiResponses,
      adminWriteRequests,
      apiRequestFailures,
      adminApiRequestFailures,
      apiRequestFailures,
      pageErrors,
    },
    contract: {
      declared401OperationIds,
      authRefreshOperationId: 'refreshSession',
      authRefreshDeclaredStatusCodes: Object.keys(refreshOperation.responses ?? {}).sort(),
      authRefreshFixture:
        '200/null declared by Auth OpenAPI; injected before service-worker/backend dispatch.',
    },
    sourceHashes,
    limitations: [
      'Admin OpenAPI declares 401 for all five operations, but only the three current GET routes are reachable; detail GET and feature-flag PATCH are excluded.',
      'Auth OpenAPI declares refreshSession as 200 with AuthSession or null and does not declare HTTP 401. The runner intercepts each refresh fetch and returns the declared 200/null fixture before service-worker/backend dispatch.',
      'The local service worker supplies Admin GET 401 responses; local preview evidence does not establish server-side authorization or session handling.',
      'This Chromium preview check does not verify backend persistence, staging, production behavior or user acceptance.',
    ],
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  const formatted = await prettier.format(JSON.stringify(report, null, 2) + '\n', {
    ...prettierOptions,
    parser: 'json',
  });
  await fs.writeFile(reportPath, formatted);
  process.stdout.write(formatted);
} finally {
  await browser.close();
}

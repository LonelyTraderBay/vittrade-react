import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const origin = process.env.PREVIEW_BASE_URL ?? 'http://127.0.0.1:4173';
const parsedOrigin = new URL(origin);
assert.equal(parsedOrigin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');
const originUrl = parsedOrigin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const runId = process.env.EVIDENCE_RUN_SUFFIX ?? `${Date.now()}`;
assert.match(runId, /^[a-z0-9-]+$/i, 'Evidence run suffix must be alphanumeric or hyphenated.');
const artifactSuffix = `-${runId}`;
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const reportPath = path.join(
  evidenceDirectory,
  `admin-error-browser-check-${date}${artifactSuffix}.json`,
);
const screenshotPaths = {
  overview: path.join(
    evidenceDirectory,
    `preview-admin-error-overview-${date}${artifactSuffix}.png`,
  ),
  funnel: path.join(evidenceDirectory, `preview-admin-error-funnel-${date}${artifactSuffix}.png`),
  abTests: path.join(
    evidenceDirectory,
    `preview-admin-error-ab-tests-${date}${artifactSuffix}.png`,
  ),
};
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-admin-error-browser-check.mjs',
  'contracts/openapi/admin.yaml',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
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
];
const operationPaths = {
  getAdminOverview: '/api/admin/overview',
  getAdminFunnel: '/api/admin/analytics/funnel',
  listAdminAbTests: '/api/admin/analytics/ab-tests',
};
const allScenarioOperationIds = [
  'getAdminOverview',
  'getAdminFunnel',
  'listAdminAbTests',
  'getAdminAbTest',
  'updateAdminFeatureFlag',
];
const expectedAttemptsPerCycle = Number(process.env.ADMIN_ERROR_EXPECTED_ATTEMPTS ?? 6);
assert.ok(Number.isInteger(expectedAttemptsPerCycle) && expectedAttemptsPerCycle > 0);
const requestCounts = Object.fromEntries(Object.keys(operationPaths).map((id) => [id, 0]));
const requests = [];
const responses = [];
const failures = [];
const observations = [];
const unexpectedAdminRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const startedAt = Date.now();

const operationIdFor = (url) =>
  Object.entries(operationPaths).find(([, pathname]) => pathname === url.pathname)?.[0];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

page.on('request', (request) => {
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    (request.headers().accept?.includes('application/json') || url.pathname.includes('/api/'))
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/admin/')) return;
  const operationId = operationIdFor(url);
  if (operationId && request.method() === 'GET') {
    requestCounts[operationId] += 1;
    requests.push({
      operationId,
      method: request.method(),
      path: url.pathname,
      attempt: requestCounts[operationId],
    });
    return;
  }
  unexpectedAdminRequests.push({ method: request.method(), path: url.pathname });
});

page.on('response', (response) => {
  const url = new URL(response.url());
  const operationId = operationIdFor(url);
  if (!operationId) return;
  responses.push({
    operationId,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  const operationId = operationIdFor(url);
  if (!operationId) return;
  failures.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    errorText: request.failure()?.errorText ?? null,
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function signInAdminThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('admin');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function applyAdminErrorScenario() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.error').waitFor();
}

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

async function waitForAttemptCount(operationId, targetCount) {
  const deadline = Date.now() + 30_000;
  while (requestCounts[operationId] < targetCount) {
    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out waiting for ${operationId} attempt ${targetCount}; saw ${requestCounts[operationId]}.`,
      );
    }
    await page.waitForTimeout(25);
  }
}

async function observeError({ route, operationId, successContent, screenshotPath }) {
  const startCount = requestCounts[operationId];
  await navigateWithinSpa(route);
  const initialTarget = startCount + expectedAttemptsPerCycle;
  await waitForAttemptCount(operationId, initialTarget);
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor();
  const retryButton = page.getByRole('button', { name: 'Thử lại' });
  await retryButton.waitFor();
  const initialErrorStateVisible = await retryButton.isVisible();
  const successContentHidden =
    (await page.getByText(successContent, { exact: true }).count()) === 0;
  const routePreservedAfterInitialError = new URL(page.url()).pathname === route;

  await retryButton.click();
  const retryTarget = initialTarget + expectedAttemptsPerCycle;
  await waitForAttemptCount(operationId, retryTarget);
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  const routePreservedAfterRetry = new URL(page.url()).pathname === route;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const observation = {
    operationId,
    route,
    initialAttempts: requestCounts[operationId] - startCount - expectedAttemptsPerCycle,
    retryAttempts: expectedAttemptsPerCycle,
    initialErrorStateVisible,
    successContentHidden,
    routePreservedAfterInitialError,
    routePreservedAfterRetry,
  };
  observations.push(observation);
  assert.equal(observation.initialAttempts, expectedAttemptsPerCycle);
  assert.equal(initialErrorStateVisible, true);
  assert.equal(successContentHidden, true);
  assert.equal(routePreservedAfterInitialError, true);
  assert.equal(routePreservedAfterRetry, true);
}

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await applyAdminErrorScenario();
  await signInAdminThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('admin.error').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  await observeError({
    route: '/w/admin',
    operationId: 'getAdminOverview',
    successContent: '1.284',
    screenshotPath: screenshotPaths.overview,
  });
  await observeError({
    route: '/w/admin/funnels',
    operationId: 'getAdminFunnel',
    successContent: '10.000 users',
    screenshotPath: screenshotPaths.funnel,
  });
  await observeError({
    route: '/w/admin/abtests',
    operationId: 'listAdminAbTests',
    successContent: 'trade-terminal-v2',
    screenshotPath: screenshotPaths.abTests,
  });

  const finalRoute = new URL(page.url()).pathname;
  const elapsedMs = Date.now() - startedAt;
  const expectedPerOperation = expectedAttemptsPerCycle * 2;
  assert.equal(finalRoute, '/w/admin/abtests');
  assert.deepEqual(
    requestCounts,
    Object.fromEntries(Object.keys(operationPaths).map((id) => [id, expectedPerOperation])),
  );
  assert.equal(responses.length, 0, 'Statusless Admin error reads must not create HTTP responses.');
  assert.equal(failures.length, expectedPerOperation * Object.keys(operationPaths).length);
  assert.deepEqual(unexpectedAdminRequests, []);
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(serviceWorkerControlled, true);
  const sourceHashes = Object.fromEntries(
    await Promise.all(
      sourceFiles.map(async (file) => [
        file,
        crypto
          .createHash('sha256')
          .update(await fs.readFile(path.resolve(file)))
          .digest('hex'),
      ]),
    ),
  );
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'admin.error',
      domain: 'admin',
      state: 'error',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: ['/w/admin', '/w/admin/funnels', '/w/admin/abtests'],
      operationIds: allScenarioOperationIds,
      observedOperationIds: Object.keys(operationPaths),
      expectedDomainOperationCount: allScenarioOperationIds.length,
      coverage: 'representative_browser_observed',
      operationRequestCounts: requestCounts,
      requests,
      responses,
      failures,
      observations,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; it has no current UI form and is outside this read-error probe.',
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      finalRoute,
      elapsedMs,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, value]) => [key, path.basename(value)]),
      ),
      note: 'Three current Admin read routes showed ErrorState and Retry after statusless failures from local MSW. Each initial query and one explicit Retry is measured. The A/B test detail has no current route; updateAdminFeatureFlag is a mutation and was not sent.',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      statuslessFailures: failures.every((failure) => failure.errorText !== null),
      httpRequestCount: requests.length,
      httpResponseCount: responses.length,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      localMockMutationCount: 0,
    },
    measurements: {
      totalFlowMs: elapsedMs,
      adminRequestAttemptCount: requests.length,
      adminResponseCount: responses.length,
      failedRequestCount: failures.length,
      operationRequestAttemptCounts: requestCounts,
      operationFailureCounts: Object.fromEntries(
        Object.keys(operationPaths).map((operationId) => [
          operationId,
          failures.filter((failure) => failure.operationId === operationId).length,
        ]),
      ),
      visibleErrorStates: observations.filter((item) => item.initialErrorStateVisible).length,
      writes: unexpectedAdminRequests.filter((request) => request.method !== 'GET').length,
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: {
      operationPaths,
      statuslessErrorBasis:
        'Admin OpenAPI declares no 5xx response for any of its five operations.',
    },
    sourceHashes,
    limitations:
      'This is local Vite/MSW UI evidence. TypeError/HttpResponse.error responses have no HTTP status; retries and timing do not establish real backend behavior, authorization, persistence, staging, user acceptance or production SLO.',
  };
  const config = (await prettier.resolveConfig(reportPath)) || {};
  await fs.writeFile(
    reportPath,
    await prettier.format(JSON.stringify(report, null, 2), { ...config, parser: 'json' }),
  );
  process.stdout.write(JSON.stringify({ reportPath, ...report }, null, 2) + '\n');
} finally {
  await context.close();
  await browser.close();
}

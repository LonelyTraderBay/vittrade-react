import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';

const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportPath = path.join(evidenceDirectory, `admin-forbidden-browser-check-${runId}.json`);
const routes = [
  {
    operationId: 'getAdminOverview',
    path: '/api/admin/overview',
    route: '/w/admin',
    permissionContent: 'Active users',
    screenshot: path.join(evidenceDirectory, `preview-admin-forbidden-overview-${runId}.png`),
  },
  {
    operationId: 'getAdminFunnel',
    path: '/api/admin/analytics/funnel',
    route: '/w/admin/funnels',
    permissionContent: '10.000 users',
    screenshot: path.join(evidenceDirectory, `preview-admin-forbidden-funnel-${runId}.png`),
  },
  {
    operationId: 'listAdminAbTests',
    path: '/api/admin/analytics/ab-tests',
    route: '/w/admin/abtests',
    permissionContent: 'trade-terminal-v2',
    screenshot: path.join(evidenceDirectory, `preview-admin-forbidden-ab-tests-${runId}.png`),
  },
];
const operationPaths = Object.fromEntries(
  routes.map(({ operationId, path }) => [operationId, path]),
);
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-admin-forbidden-browser-check.mjs',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/auth-handlers.test.ts',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'contracts/openapi/admin.yaml',
  'src/features/admin/api/admin-api.ts',
  'src/features/admin/model/admin-queries.ts',
  'src/features/admin/routes.ts',
  'src/features/admin/pages/AdminOverviewContractPage.tsx',
  'src/features/admin/pages/AdminFunnelContractPage.tsx',
  'src/features/admin/pages/AdminAbTestsContractPage.tsx',
  'src/features/admin/pages/AdminContractPages.test.tsx',
];
const adminContract = parse(await fs.readFile('contracts/openapi/admin.yaml', 'utf8'));
const expectedOperationIds = [
  'getAdminOverview',
  'getAdminFunnel',
  'listAdminAbTests',
  'getAdminAbTest',
  'updateAdminFeatureFlag',
];
const adminOperations = Object.values(adminContract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) => expectedOperationIds.includes(operation.operationId));
const declared403OperationIds = adminOperations
  .filter((operation) => Object.hasOwn(operation.responses ?? {}, '403'))
  .map((operation) => operation.operationId)
  .sort();
assert.deepEqual(declared403OperationIds, [...expectedOperationIds].sort());

const requestCounts = Object.fromEntries(routes.map(({ operationId }) => [operationId, 0]));
const requests = [];
const responses = [];
const unexpectedAdminRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
let refreshRequestCount = 0;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);

page.on('request', (request) => {
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== origin &&
    (request.headers().accept?.includes('application/json') || url.pathname.includes('/api/'))
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (url.pathname === '/api/auth/refresh' && request.method() === 'POST') {
    refreshRequestCount += 1;
  }
  if (!url.pathname.startsWith('/api/admin/')) return;
  const operationId = Object.entries(operationPaths).find(
    ([, pathname]) => pathname === url.pathname,
  )?.[0];
  if (operationId && request.method() === 'GET') {
    requestCounts[operationId] += 1;
    requests.push({ operationId, method: request.method(), path: url.pathname });
    return;
  }
  unexpectedAdminRequests.push({ method: request.method(), path: url.pathname });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  const operationId = Object.entries(operationPaths).find(
    ([, pathname]) => pathname === url.pathname,
  )?.[0];
  if (!operationId) return;
  responses.push({
    operationId,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
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

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

try {
  const startedAt = Date.now();
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await signInAdminThroughPreview();
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.forbidden').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const observations = [];
  for (const route of routes) {
    const responsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === route.path && response.request().method() === 'GET',
    );
    const routeStartedAt = Date.now();
    await navigateWithinSpa(route.route);
    await responsePromise;
    await page.getByText('Không có quyền truy cập', { exact: true }).waitFor();
    const permissionDeniedVisible =
      (await page
        .getByText('Tài khoản của bạn không có quyền xem dữ liệu quản trị.', { exact: true })
        .count()) > 0;
    const retryActionVisible =
      (await page.getByRole('button', { name: 'Thử lại', exact: true }).count()) > 0;
    const falseSuccessContentVisible =
      (await page.getByText(route.permissionContent, { exact: true }).count()) > 0;
    assert.equal(permissionDeniedVisible, true);
    assert.equal(retryActionVisible, false);
    assert.equal(falseSuccessContentVisible, false);
    await page.screenshot({ path: route.screenshot, fullPage: true });
    observations.push({
      operationId: route.operationId,
      route: route.route,
      permissionDeniedVisible,
      retryActionVisible,
      falseSuccessContentVisible,
      elapsedMs: Date.now() - routeStartedAt,
    });
  }

  assert.equal(new URL(page.url()).pathname, '/w/admin/abtests');
  assert.deepEqual(requestCounts, {
    getAdminOverview: 1,
    getAdminFunnel: 1,
    listAdminAbTests: 1,
  });
  assert.equal(responses.length, 3);
  assert.ok(responses.every((response) => response.status === 403 && response.fromServiceWorker));
  assert.equal(refreshRequestCount, 0);
  assert.deepEqual(unexpectedAdminRequests, []);
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);

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
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'admin.forbidden',
      domain: 'admin',
      state: 'forbidden',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: routes.map(({ route }) => route),
      operationIds: expectedOperationIds,
      observedOperationIds: routes.map(({ operationId }) => operationId),
      declared403OperationCount: declared403OperationIds.length,
      expectedDomainOperationCount: expectedOperationIds.length,
      coverage: 'representative_scenario_operations_browser_observed',
      operationRequestCounts: requestCounts,
      requests,
      responses,
      observations,
      refreshRequestCount,
      permissionDeniedVisibleOnAllRoutes: observations.every(
        (observation) => observation.permissionDeniedVisible,
      ),
      retryActionVisibleOnAnyRoute: observations.some(
        (observation) => observation.retryActionVisible,
      ),
      falseSuccessContentVisibleOnAnyRoute: observations.some(
        (observation) => observation.falseSuccessContentVisible,
      ),
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: Date.now() - startedAt,
      screenshots: Object.fromEntries(
        routes.map(({ operationId, screenshot }) => [operationId, path.basename(screenshot)]),
      ),
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; current persona has admin:read and no UI form exists.',
      note: 'All five Admin operations declare 403 in OpenAPI. This local browser scenario observed one MSW 403 response for each of the three current Admin read routes and explicit permission-denied UI without retry or success content. getAdminAbTest has no current detail route and updateAdminFeatureFlag has no current form. No session refresh, mutation, external API, backend, staging, or user-acceptance behavior was exercised.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: responses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      adminRequestCount: requests.length,
      adminResponseCount: responses.length,
      operationResponseCounts: Object.fromEntries(
        routes.map(({ operationId }) => [
          operationId,
          responses.filter((response) => response.operationId === operationId).length,
        ]),
      ),
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      authRefreshRequestCount: refreshRequestCount,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: {
      operationPaths,
      declared403OperationIds,
      omittedOperations: {
        getAdminAbTest: 'No current detail route/link exposes the operation in this scenario.',
        updateAdminFeatureFlag: 'No current UI form; current preview persona only has admin:read.',
      },
    },
    sourceHashes,
    limitations:
      'The browser used local MSW preview fixtures. This evidence does not establish backend authorization, persistence, staging behavior or user acceptance.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ reportPath, ...report }, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

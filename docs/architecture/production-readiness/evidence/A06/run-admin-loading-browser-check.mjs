import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportPath = path.join(evidenceDirectory, 'admin-loading-browser-check-' + runId + '.json');
const screenshotPaths = {
  overview: path.join(evidenceDirectory, 'preview-admin-loading-overview-' + runId + '.png'),
  funnel: path.join(evidenceDirectory, 'preview-admin-loading-funnel-' + runId + '.png'),
  abTests: path.join(evidenceDirectory, 'preview-admin-loading-ab-tests-' + runId + '.png'),
};
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-admin-loading-browser-check.mjs',
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
const operationPaths = {
  getAdminOverview: '/api/admin/overview',
  getAdminFunnel: '/api/admin/analytics/funnel',
  listAdminAbTests: '/api/admin/analytics/ab-tests',
};
const requestCounts = Object.fromEntries(Object.keys(operationPaths).map((id) => [id, 0]));
const requestStartedAt = {};
const requests = [];
const responses = [];
const observations = [];
const unexpectedAdminRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
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
  if (!url.pathname.startsWith('/api/admin/')) return;
  const operationId = Object.entries(operationPaths).find(
    ([, pathname]) => pathname === url.pathname,
  )?.[0];
  if (operationId && request.method() === 'GET') {
    requestCounts[operationId] += 1;
    requestStartedAt[operationId] = Date.now();
    requests.push({ operationId, method: request.method(), path: url.pathname });
    return;
  }
  unexpectedAdminRequests.push({ method: request.method(), path: url.pathname });
});
page.on('response', (response) => {
  const responsePath = new URL(response.url()).pathname;
  const operationId = Object.entries(operationPaths).find(
    ([, pathname]) => pathname === responsePath,
  )?.[0];
  if (!operationId) return;
  responses.push({
    operationId,
    method: response.request().method(),
    path: responsePath,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    elapsedMs: Date.now() - requestStartedAt[operationId],
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

async function applyAdminLoadingScenario() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.loading').waitFor();
}

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

async function observeLoading(route, operationId, loadingLabel, dataLabel, screenshotPath) {
  await navigateWithinSpa(route);
  const navigationAt = Date.now();
  await page.getByText(loadingLabel, { exact: true }).waitFor();
  const observation = {
    operationId,
    route,
    visibleBeforeResponse: !responses.some((response) => response.operationId === operationId),
    visibleMsAfterNavigation: Date.now() - navigationAt,
  };
  observations.push(observation);
  assert.equal(observation.visibleBeforeResponse, true);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.getByText(dataLabel, { exact: true }).waitFor();
}

try {
  const startedAt = Date.now();
  await page.goto(origin + '/w/auth/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await applyAdminLoadingScenario();
  await signInAdminThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('admin.loading').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  await observeLoading(
    '/w/admin',
    'getAdminOverview',
    'Đang tải dữ liệu quản trị…',
    '1.284',
    screenshotPaths.overview,
  );
  await observeLoading(
    '/w/admin/funnels',
    'getAdminFunnel',
    'Đang tải funnel…',
    '10.000 users',
    screenshotPaths.funnel,
  );
  await observeLoading(
    '/w/admin/abtests',
    'listAdminAbTests',
    'Đang tải A/B tests…',
    'trade-terminal-v2',
    screenshotPaths.abTests,
  );

  const finalRoute = new URL(page.url()).pathname;
  const elapsedMs = Date.now() - startedAt;
  assert.equal(finalRoute, '/w/admin/abtests');
  assert.deepEqual(requestCounts, { getAdminOverview: 1, getAdminFunnel: 1, listAdminAbTests: 1 });
  assert.equal(responses.length, 3);
  assert.ok(responses.every((response) => response.status === 200 && response.fromServiceWorker));
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
      id: 'admin.loading',
      domain: 'admin',
      state: 'loading',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: ['/w/admin', '/w/admin/funnels', '/w/admin/abtests'],
      operationIds: Object.keys(operationPaths),
      observedOperationIds: Object.keys(operationPaths),
      expectedDomainOperationCount: 3,
      coverage: 'full_scenario_operations_browser_observed',
      operationRequestCounts: requestCounts,
      requests,
      responses,
      observations,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; no current UI form and the preview persona has admin:read only.',
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      finalRoute,
      elapsedMs,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, value]) => [key, path.basename(value)]),
      ),
      note: 'The three current Admin read routes each displayed their loading label before one delayed local MSW HTTP 200 response. The browser ran in a fresh context; this measures local preview loading behavior, not backend latency. getAdminAbTest has no current detail route and updateAdminFeatureFlag has no form.',
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
      totalFlowMs: elapsedMs,
      adminRequestCount: requests.length,
      adminResponseCount: responses.length,
      operationResponseCounts: Object.fromEntries(
        Object.keys(operationPaths).map((operationId) => [
          operationId,
          responses.filter((response) => response.operationId === operationId).length,
        ]),
      ),
      responseElapsedMs: Object.fromEntries(
        responses.map((response) => [response.operationId, response.elapsedMs]),
      ),
      loadingVisibleBeforeResponseCount: observations.filter((item) => item.visibleBeforeResponse)
        .length,
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: { operationPaths },
    sourceHashes,
    limitations:
      'All responses came from local MSW fixtures. The delayed UI state does not establish backend service latency, production authorization, staging behavior or user acceptance.',
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

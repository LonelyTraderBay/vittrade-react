import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportPath = path.join(evidenceDirectory, `admin-success-browser-check-${runId}.json`);
const screenshotPaths = {
  overview: path.join(evidenceDirectory, `preview-admin-success-overview-${runId}.png`),
  funnel: path.join(evidenceDirectory, `preview-admin-success-funnel-${runId}.png`),
  abTests: path.join(evidenceDirectory, `preview-admin-success-ab-tests-${runId}.png`),
};
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-admin-success-browser-check.mjs',
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
const requests = [];
const responses = [];
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

async function applyAdminSuccessScenario() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.success').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
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
  await applyAdminSuccessScenario();

  await navigateWithinSpa('/w/admin');
  await page.getByText('Active users', { exact: true }).waitFor();
  await page.getByText('1.284', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.overview, fullPage: true });

  await navigateWithinSpa('/w/admin/funnels');
  await page.getByText('Funnel analytics', { exact: true }).waitFor();
  await page.getByText('10.000 users', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.funnel, fullPage: true });

  await navigateWithinSpa('/w/admin/abtests');
  await page.getByText('trade-terminal-v2', { exact: true }).waitFor();
  await page.getByText('control: 50%', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.abTests, fullPage: true });

  const finalRoute = new URL(page.url()).pathname;
  assert.equal(finalRoute, '/w/admin/abtests');
  assert.deepEqual(requestCounts, {
    getAdminOverview: 1,
    getAdminFunnel: 1,
    listAdminAbTests: 1,
  });
  assert.equal(responses.length, 3);
  assert.ok(responses.every((response) => response.status === 200 && response.fromServiceWorker));
  assert.deepEqual(unexpectedAdminRequests, []);
  assert.deepEqual([...externalApiOrigins], []);

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
      id: 'admin.success',
      domain: 'admin',
      state: 'success',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: ['/w/admin', '/w/admin/funnels', '/w/admin/abtests'],
      operationIds: [
        'getAdminOverview',
        'getAdminFunnel',
        'listAdminAbTests',
        'getAdminAbTest',
        'updateAdminFeatureFlag',
      ],
      observedOperationIds: Object.keys(operationPaths),
      expectedDomainOperationCount: 5,
      coverage: 'representative_scenario_operations_browser_observed',
      operationRequestCounts: requestCounts,
      requests,
      responses,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; the preview persona has admin:read only and no current UI route exposes the write form.',
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      finalRoute,
      elapsedMs: Date.now() - startedAt,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, value]) => [key, path.basename(value)]),
      ),
      note: 'Representative Admin UI evidence covers the three read operations reachable from current routes (3/5 linked operations). getAdminAbTest has no detail route/link and updateAdminFeatureFlag has no current UI form; the read-only mock persona cannot perform that privileged mutation. Every observed response is a local MSW fixture, not backend or staging evidence.',
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
        Object.keys(operationPaths).map((operationId) => [
          operationId,
          responses.filter((response) => response.operationId === operationId).length,
        ]),
      ),
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: {
      operationPaths,
      omittedOperations: {
        getAdminAbTest: 'No current detail route/link exposes the operation in this scenario.',
        updateAdminFeatureFlag: 'No current UI form; current preview persona only has admin:read.',
      },
    },
    sourceHashes,
    limitations:
      'The browser used local MSW preview fixtures. This evidence does not establish backend persistence, production authorization, staging behavior or user acceptance.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ reportPath, ...report }, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

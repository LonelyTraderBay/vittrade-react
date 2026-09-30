import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const previewUrl = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(previewUrl.hostname),
  'Trading error check is restricted to a loopback preview.',
);
assert.equal(previewUrl.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const origin = previewUrl.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const operationId = 'listOpenPositions';
const apiPath = '/api/trading/positions';
const reportPath = path.join(directory, `trading-error-browser-check-${date}.json`);
const screenshotPaths = {
  initialError: path.join(directory, `preview-trading-error-positions-${date}.png`),
  afterRetry: path.join(directory, `preview-trading-error-positions-retry-${date}.png`),
};
const sourceFiles = [
  'contracts/openapi/trading.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/features/trading/routes.ts',
  'src/features/trading/api/trading-api.ts',
  'src/features/trading/model/trading-queries.ts',
  'src/features/trading/pages/OpenPositionsPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/ui/ErrorState.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-trading-error-browser-check.mjs',
];
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (file) => [
      file,
      createHash('sha256')
        .update(await fs.readFile(path.join(root, file)))
        .digest('hex'),
    ]),
  ),
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

const apiRequests = [];
const apiResponses = [];
const apiFailures = [];
const unexpectedTradingRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const requestRecords = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const record = {
    method: request.method(),
    path: url.pathname,
    operationId: request.method() === 'GET' && url.pathname === apiPath ? operationId : null,
    startedAt: Date.now(),
  };
  requestRecords.set(request, record);
  apiRequests.push(record);
  if (url.pathname.startsWith('/api/trading/') && !record.operationId) {
    unexpectedTradingRequests.push(record);
  }
  if (url.origin !== origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const task = (async () => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    const request = response.request();
    requestsWithResponse.add(request);
    const record = requestRecords.get(request);
    apiResponses.push({
      method: request.method(),
      path: url.pathname,
      operationId: record?.operationId ?? null,
      status: response.status(),
      fromServiceWorker: await response.fromServiceWorker(),
      elapsedMs: Date.now() - (record?.startedAt ?? Date.now()),
      body:
        record?.operationId === operationId ? await response.json().catch(() => null) : undefined,
    });
  })();
  responseTasks.push(task);
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiFailures.push({
    method: request.method(),
    path: url.pathname,
    operationId: request.method() === 'GET' && url.pathname === apiPath ? operationId : null,
    failure: request.failure()?.errorText ?? 'unknown',
    hadResponse: requestsWithResponse.has(request),
  });
});

const waitForRequestCount = async (expected, timeoutMs = 20_000) => {
  const deadline = Date.now() + timeoutMs;
  while (
    apiRequests.filter((request) => request.operationId === operationId).length < expected &&
    Date.now() < deadline
  ) {
    await page.waitForTimeout(50);
  }
  const count = apiRequests.filter((request) => request.operationId === operationId).length;
  assert.equal(count, expected, `Expected ${expected} position reads; observed ${count}.`);
};
const waitForResponseCount = async (expected, timeoutMs = 20_000) => {
  const deadline = Date.now() + timeoutMs;
  while (
    apiResponses.filter((response) => response.operationId === operationId).length < expected &&
    Date.now() < deadline
  ) {
    await page.waitForTimeout(50);
  }
  const count = apiResponses.filter((response) => response.operationId === operationId).length;
  assert.equal(count, expected, `Expected ${expected} position responses; observed ${count}.`);
};

const startedAt = Date.now();
let retryClickedAt = null;
try {
  await page.goto(`${origin}/w/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="dev-preview-controls"]').waitFor();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  assert.equal(
    await page.evaluate(() => Boolean(navigator.serviceWorker?.controller)),
    true,
    'The local preview service worker must control the page.',
  );

  const expandPreview = page.getByRole('button', { name: 'Mở công cụ xem trước' });
  if (await expandPreview.count()) await expandPreview.click();
  await page.locator('#preview-persona').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page
    .locator('[data-testid="dev-preview-controls"]')
    .getByText('developer@vittrade.local')
    .waitFor();
  await page.locator('#preview-domain').selectOption('trading');
  await page.locator('#preview-state').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.error').waitFor();
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/positions');
  await page.waitForURL((url) => url.pathname === '/w/trade/positions');

  const errorTitle = page.getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true });
  await errorTitle.waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Thử lại', exact: true }).waitFor({ state: 'visible' });
  const initialErrorAt = Date.now();
  await waitForRequestCount(6);
  await waitForResponseCount(6);
  await Promise.all(responseTasks);
  const initialResponses = apiResponses.filter((response) => response.operationId === operationId);
  assert.equal(initialResponses.length, 6);
  assert.ok(
    initialResponses.every(
      (response) =>
        response.status === 503 &&
        response.fromServiceWorker &&
        response.body?.code === 'positions_source_unavailable',
    ),
  );
  await page.screenshot({ path: screenshotPaths.initialError, fullPage: true });

  retryClickedAt = Date.now();
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await waitForRequestCount(12);
  await waitForResponseCount(12);
  await page.getByRole('button', { name: 'Thử lại', exact: true }).waitFor({ state: 'visible' });
  await Promise.all(responseTasks);
  const allPositionResponses = apiResponses.filter(
    (response) => response.operationId === operationId,
  );
  assert.equal(allPositionResponses.length, 12);
  assert.ok(
    allPositionResponses.every(
      (response) =>
        response.status === 503 &&
        response.fromServiceWorker &&
        response.body?.code === 'positions_source_unavailable',
    ),
  );
  assert.equal(await page.getByText('Không có vị thế phù hợp.', { exact: true }).count(), 0);
  assert.equal(await page.url(), `${origin}/w/trade/positions`);
  await page.screenshot({ path: screenshotPaths.afterRetry, fullPage: true });

  assert.deepEqual(unexpectedTradingRequests, []);
  assert.deepEqual(externalApiOrigins, new Set());
  assert.deepEqual(pageErrors, []);
  const tradingWrites = apiRequests.filter(
    (request) => request.path.startsWith('/api/trading/') && request.method !== 'GET',
  );
  assert.deepEqual(tradingWrites, []);
  assert.equal(
    apiFailures.filter((failure) => !failure.hadResponse).length,
    0,
    JSON.stringify(apiFailures.filter((failure) => !failure.hadResponse)),
  );

  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'trading.error',
      status: 'passed',
      persona: 'developer',
      route: '/w/trade/positions',
      operationIds: [operationId],
      observedOperationIds: [operationId],
      expectedDomainOperationCount: 1,
      coverage: 'full_scenario_operations_browser_observed',
      responseStatus: 503,
      responseCode: 'positions_source_unavailable',
      initialRequestCount: 6,
      initialResponseCount: initialResponses.length,
      retryActionCount: 1,
      retryRequestCount: 6,
      retryResponseCount: allPositionResponses.length - initialResponses.length,
      retryCycleMs: Date.now() - retryClickedAt,
      initialErrorElapsedMs: initialErrorAt - startedAt,
      visibleUnavailableState: true,
      visibleEmptyState: false,
      retryButtonVisible: true,
      routePreserved: true,
      writeRequestCount: tradingWrites.length,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, value]) => [key, path.basename(value)]),
      ),
    },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      tradingWriteRequestCount: tradingWrites.length,
      unexpectedTradingRequestCount: unexpectedTradingRequests.length,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      positionResponses: allPositionResponses,
      apiFailures,
      unmatchedApiFailureCount: apiFailures.filter((failure) => !failure.hadResponse).length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    apiRequests,
    apiResponses,
    sourceHashes,
    limitations:
      'This local fixture exercises only listOpenPositions because the Trading OpenAPI contract declares 503 only for this operation. The existing handler returns positions_source_unavailable; six retries and timing are client/MSW behavior, not backend availability or latency evidence.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

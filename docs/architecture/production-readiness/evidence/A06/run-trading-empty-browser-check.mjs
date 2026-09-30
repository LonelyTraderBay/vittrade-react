import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const previewUrl = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(previewUrl.hostname),
  'Trading empty-state check is restricted to a loopback preview.',
);
assert.equal(previewUrl.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const origin = previewUrl.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const operationIds = ['listOpenOrders', 'listOrderHistory', 'listOpenPositions'];
const screenshotPaths = {
  openOrders: path.join(directory, `preview-trading-empty-open-orders-${date}.png`),
  orderHistory: path.join(directory, `preview-trading-empty-history-${date}.png`),
  positions: path.join(directory, `preview-trading-empty-positions-${date}.png`),
};
const reportPath = path.join(directory, `trading-empty-browser-check-${date}.json`);
const sourceFiles = [
  'contracts/openapi/trading.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/trading-fixtures.ts',
  'src/features/trading/routes.ts',
  'src/features/trading/api/trading-api.ts',
  'src/features/trading/model/trading-queries.ts',
  'src/features/trading/pages/OrdersHistoryPage.tsx',
  'src/features/trading/pages/OpenPositionsPage.tsx',
  'src/features/trading/components/OpenOrdersPanel.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/useAuth.ts',
  'docs/architecture/production-readiness/evidence/A06/run-trading-empty-browser-check.mjs',
];
const sha256 = async (file) =>
  createHash('sha256')
    .update(await fs.readFile(path.join(root, file)))
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

const operationFor = (method, pathname) => {
  if (method !== 'GET') return null;
  if (pathname === '/api/trading/orders') return 'listOpenOrders';
  if (pathname === '/api/trading/orders/history') return 'listOrderHistory';
  if (pathname === '/api/trading/positions') return 'listOpenPositions';
  return null;
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

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
    operationId: operationFor(request.method(), url.pathname),
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
    operationId: operationFor(request.method(), url.pathname),
    failure: request.failure()?.errorText ?? 'unknown',
    hadResponse: requestsWithResponse.has(request),
  });
});

const waitForResponse = (method, pathname) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return response.request().method() === method && url.pathname === pathname;
  });
const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};
const responseFor = (operationId) =>
  apiResponses.filter((response) => response.operationId === operationId);

const startedAt = Date.now();
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
  await page.locator('#preview-state').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.empty').waitFor();
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();

  const openOrdersPromise = waitForResponse('GET', '/api/trading/orders');
  await navigate('/w/trade/orders-history');
  const openOrdersResponse = await openOrdersPromise;
  const openOrdersPayload = await openOrdersResponse.json();
  assert.equal(openOrdersResponse.status(), 200);
  assert.equal(await openOrdersResponse.fromServiceWorker(), true);
  assert.deepEqual(openOrdersPayload.items, []);
  await page.getByText('Không có lệnh đang mở', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.openOrders, fullPage: true });

  const historyPromise = waitForResponse('GET', '/api/trading/orders/history');
  await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
  const historyResponse = await historyPromise;
  const historyPayload = await historyResponse.json();
  assert.equal(historyResponse.status(), 200);
  assert.equal(await historyResponse.fromServiceWorker(), true);
  assert.deepEqual(historyPayload.items, []);
  await page.getByText('Chưa có lịch sử giao dịch', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.orderHistory, fullPage: true });

  const positionsPromise = waitForResponse('GET', '/api/trading/positions');
  await navigate('/w/trade/positions');
  const positionsResponse = await positionsPromise;
  const positionsPayload = await positionsResponse.json();
  assert.equal(positionsResponse.status(), 200);
  assert.equal(await positionsResponse.fromServiceWorker(), true);
  assert.deepEqual(positionsPayload.items, []);
  await page.getByText('Không có vị thế phù hợp.', { exact: true }).waitFor();
  assert.equal(await page.getByText('Nguồn dữ liệu vị thế chưa được kết nối').count(), 0);
  await page.screenshot({ path: screenshotPaths.positions, fullPage: true });

  await Promise.all(responseTasks);
  assert.deepEqual(externalApiOrigins, new Set());
  assert.deepEqual(unexpectedTradingRequests, []);
  assert.equal(
    apiFailures.filter((failure) => !failure.hadResponse).length,
    0,
    JSON.stringify(apiFailures.filter((failure) => !failure.hadResponse)),
  );
  assert.deepEqual(pageErrors, []);
  const operationRequestCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      apiRequests.filter((request) => request.operationId === id).length,
    ]),
  );
  const operationResponseCounts = Object.fromEntries(
    operationIds.map((id) => [id, responseFor(id).length]),
  );
  assert.deepEqual(operationRequestCounts, {
    listOpenOrders: 1,
    listOrderHistory: 1,
    listOpenPositions: 1,
  });
  assert.deepEqual(operationResponseCounts, operationRequestCounts);
  const tradingWrites = apiRequests.filter(
    (request) => request.path.startsWith('/api/trading/') && request.method !== 'GET',
  );
  assert.deepEqual(tradingWrites, []);

  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'trading.empty',
      status: 'passed',
      persona: 'developer',
      route: '/w/trade/positions',
      operationIds,
      observedOperationIds: operationIds,
      expectedDomainOperationCount: operationIds.length,
      coverage: 'full_scenario_operations_browser_observed',
      visibleEmptyStates: {
        openOrders: true,
        orderHistory: true,
        positions: true,
        positionsUnavailable: false,
      },
      payloadItemCounts: {
        listOpenOrders: openOrdersPayload.items.length,
        listOrderHistory: historyPayload.items.length,
        listOpenPositions: positionsPayload.items.length,
      },
      operationRequestCounts,
      operationResponseCounts,
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
      operationResponses: operationIds.flatMap((id) => responseFor(id)),
      apiFailures,
      unmatchedApiFailureCount: apiFailures.filter((failure) => !failure.hadResponse).length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    apiRequests,
    apiResponses,
    sourceHashes,
    limitations:
      'Local Chromium and service-worker/MSW evidence only. Empty fixture responses do not establish backend completeness, account position state, persistence, user acceptance or staging readiness.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

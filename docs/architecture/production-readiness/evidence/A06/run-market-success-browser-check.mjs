import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';
import { parse } from 'yaml';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const runnerPath =
  'docs/architecture/production-readiness/evidence/A06/run-market-success-browser-check.mjs';
const sidecarPath =
  'docs/architecture/production-readiness/evidence/A06/market-success-browser-check-2026-09-29.json';
const masterPath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/market.yaml',
  'src/app/routes.ts',
  'src/app/routeConfig.ts',
  'src/app/components/layout/WebSidebar.tsx',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/auth-handlers.test.ts',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/market-data-simulator.ts',
  'src/dev/mocks/market-overview-fixtures.ts',
  'src/dev/mocks/market-preview-fixtures.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/market/api/market-api.ts',
  'src/features/market/api/market-research-schemas.ts',
  'src/features/market/model/market-queries.ts',
  'src/features/market/model/market-types.ts',
  'src/features/market/pages/AdvancedChartsPage.tsx',
  'src/features/market/pages/MarketComparisonPage.tsx',
  'src/features/market/pages/MarketCorrelationPairsPage.tsx',
  'src/features/market/pages/MarketDepthPage.tsx',
  'src/features/market/pages/MarketDerivativesPage.tsx',
  'src/features/market/pages/MarketEventCalendarPage.tsx',
  'src/features/market/pages/MarketHeatmapPage.tsx',
  'src/features/market/pages/MarketHomePage.tsx',
  'src/features/market/pages/MarketMoversPage.tsx',
  'src/features/market/pages/MarketNewsFeedPage.tsx',
  'src/features/market/pages/MarketOverviewPage.tsx',
  'src/features/market/pages/MarketPriceAlertsPage.tsx',
  'src/features/market/pages/MarketScreenerPage.tsx',
  'src/features/market/pages/MarketSectorsPage.tsx',
  'src/features/market/pages/MarketSentimentPage.tsx',
  'src/features/market/pages/MarketSignalsPage.tsx',
  'src/features/market/pages/PairDetailPage.tsx',
  'src/features/market/pages/TokenInfoPage.tsx',
  'src/features/market/pages/TokenUnlockSchedulePage.tsx',
  'src/features/market/pages/WatchlistPage.tsx',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
];
const routes = [
  {
    path: '/w/home',
    heading: 'Thị trường',
    operationIds: ['listMarketPairs', 'getMarketWatchlist'],
  },
  {
    path: '/w/markets/overview',
    heading: 'Tổng quan thị trường',
    operationIds: ['getMarketOverview'],
  },
  { path: '/w/markets/movers', heading: 'Biến động thị trường', operationIds: ['getMarketMovers'] },
  { path: '/w/markets/news', heading: 'Tin thị trường', operationIds: ['getMarketNews'] },
  { path: '/w/markets/calendar', heading: 'Lịch sự kiện', operationIds: ['getMarketCalendar'] },
  {
    path: '/w/markets/correlations',
    heading: 'Tương quan thị trường',
    operationIds: ['getMarketCorrelations'],
  },
  {
    path: '/w/markets/unlocks',
    heading: 'Lịch mở khóa token',
    operationIds: ['getMarketTokenUnlocks'],
  },
  { path: '/w/markets/derivatives', heading: 'Phái sinh', operationIds: ['getMarketDerivatives'] },
  {
    path: '/w/markets/social-sentiment',
    heading: 'Tâm lý thị trường',
    operationIds: ['getMarketSentiment'],
  },
  { path: '/w/markets/signals', heading: 'Tín hiệu cộng đồng', operationIds: ['getMarketSignals'] },
  {
    path: '/w/markets/alerts',
    heading: 'Cảnh báo giá',
    operationIds: ['listMarketPriceAlerts', 'listMarketPairs'],
  },
  { path: '/w/markets/screener', heading: 'Market screener', operationIds: ['listMarketPairs'] },
  {
    path: '/w/markets/watchlist',
    heading: 'Danh sách theo dõi',
    operationIds: ['listMarketPairs', 'getMarketWatchlist'],
  },
  {
    path: '/w/pair/btcusdt',
    heading: 'BTC/USDT',
    operationIds: [
      'getMarketPair',
      'getMarketOrderBook',
      'getMarketRecentTrades',
      'getMarketWatchlist',
    ],
  },
  {
    path: '/w/markets/depth',
    heading: 'BTC Depth',
    operationIds: ['listMarketPairs', 'getMarketPair', 'getMarketOrderBook'],
  },
  {
    path: '/w/trade/advanced-chart/btcusdt',
    heading: 'Advanced charts',
    operationIds: ['listMarketPairs', 'getMarketPair', 'getMarketCandles'],
  },
  { path: '/w/pair/btcusdt/info', heading: 'BTC info', operationIds: ['getMarketPair'] },
  {
    path: '/w/markets/sectors',
    heading: 'Ngành thị trường',
    operationIds: ['getMarketOverview', 'listMarketPairs'],
  },
  { path: '/w/markets/heatmap', heading: 'Market heatmap', operationIds: ['listMarketPairs'] },
  { path: '/w/markets/compare', heading: 'So sánh tài sản', operationIds: ['listMarketPairs'] },
];
const readOperationIds = [
  'getMarketOverview',
  'getMarketMovers',
  'getMarketNews',
  'getMarketCalendar',
  'getMarketCorrelations',
  'getMarketTokenUnlocks',
  'getMarketDerivatives',
  'getMarketSentiment',
  'getMarketSignals',
  'listMarketPriceAlerts',
  'listMarketPairs',
  'getMarketPair',
  'getMarketWatchlist',
  'getMarketOrderBook',
  'getMarketRecentTrades',
  'getMarketCandles',
];
const writeOperationIds = [
  'createMarketPriceAlert',
  'updateMarketPriceAlert',
  'deleteMarketPriceAlert',
  'addMarketWatchlistItem',
  'updateMarketWatchlistItem',
  'deleteMarketWatchlistItem',
];
const expectedWriteStatuses = {
  createMarketPriceAlert: 201,
  updateMarketPriceAlert: 200,
  deleteMarketPriceAlert: 204,
  addMarketWatchlistItem: 201,
  updateMarketWatchlistItem: 200,
  deleteMarketWatchlistItem: 204,
};
const read = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(read(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(JSON.stringify(value, null, 2) + '\n', {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

function operationFor(operationMap, method, pathname) {
  return operationMap.operations.find((operation) => {
    if (operation.method !== method) return false;
    const pattern = operation.path
      .split('/')
      .map((segment) =>
        segment.startsWith('{') && segment.endsWith('}')
          ? '[^/]+'
          : segment.replace(/[.*+?^$()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    return new RegExp(pattern + '$').test(pathname);
  })?.operationId;
}

const tracking = JSON.parse(
  await fs.readFile(
    path.join(root, 'docs/architecture/production-readiness/TRACKING.json'),
    'utf8',
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(sourceHead, tracking.baseline.sourceHead, 'Evidence must match the A06 baseline.');
const master = JSON.parse(await fs.readFile(path.join(root, masterPath), 'utf8'));
const reviewedSourceChanges = [
  runnerPath,
  'src/dev/mocks/auth-handlers.test.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
];
const expectedStaleSourceHashes = Object.fromEntries(
  reviewedSourceChanges
    .filter((relativePath) => master.sourceHashes?.[relativePath])
    .map((relativePath) => [relativePath, master.sourceHashes[relativePath]]),
);
const staleSourceHashes = Object.entries(master.sourceHashes ?? {})
  .filter(([relativePath, expectedHash]) => sha256(relativePath) !== expectedHash)
  .sort(([left], [right]) => left.localeCompare(right));
assert.deepEqual(
  staleSourceHashes,
  Object.entries(expectedStaleSourceHashes).sort(([left], [right]) => left.localeCompare(right)),
  'Only the reviewed Market success runner and scoped QA persona files may differ from the prior baseline.',
);
const operationMap = JSON.parse(await fs.readFile(path.join(root, operationMapPath), 'utf8'));
const contract = parse(read('contracts/openapi/market.yaml').toString('utf8'));
const contractOperations = Object.values(contract.paths).flatMap((pathItem) =>
  Object.entries(pathItem)
    .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
    .map(([method, operation]) => ({ method: method.toUpperCase(), ...operation })),
);
assert.equal(contractOperations.length, 22, 'Market OpenAPI operation inventory changed.');
assert.deepEqual(
  operationMap.operations
    .filter((operation) => operation.domain === 'market')
    .map((operation) => operation.operationId)
    .sort(),
  contractOperations.map((operation) => operation.operationId).sort(),
  'Market operation map no longer matches OpenAPI.',
);
for (const operationId of readOperationIds) {
  const operation = contractOperations.find((candidate) => candidate.operationId === operationId);
  assert.equal(
    operation?.method,
    'GET',
    `${operationId} must remain read-only in this browser flow.`,
  );
  assert.ok(operation?.responses?.['200'], `${operationId} must declare a successful response.`);
}
for (const operationId of writeOperationIds) {
  const operation = contractOperations.find((candidate) => candidate.operationId === operationId);
  assert.ok(operation && ['POST', 'PATCH', 'DELETE'].includes(operation.method));
  assert.ok(operation.responses?.[String(expectedWriteStatuses[operationId])]);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const finishedRequests = [];
const requestFailures = [];
const externalApiOrigins = new Set();
const pendingApiRequests = new Set();
const apiRequestStart = new WeakMap();
const apiRequestSequence = new WeakMap();
let nextApiRequestSequence = 0;
const pageErrors = [];
let scenarioRequestStart = 0;
let scenarioResponseStart = 0;
let scenarioFailureStart = 0;
let scenarioSelected = false;
let finalRoute = null;
let permissions = [];
const routeResults = [];
const writeActions = [];
let requestFailureClassifications = [];
const failures = [];
const startedAt = Date.now();
let lastApiEventAt = Date.now();
const screenshotNames = [];

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiRequestStart.set(request, Date.now());
  apiRequestSequence.set(request, ++nextApiRequestSequence);
  pendingApiRequests.add(request);
  lastApiEventAt = Date.now();
  requests.push({
    sequence: apiRequestSequence.get(request),
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    routeAtRequest: new URL(page.url()).pathname,
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const request = response.request();
  const requestTime = apiRequestStart.get(request);
  pendingApiRequests.delete(request);
  lastApiEventAt = Date.now();
  responses.push({
    sequence: apiRequestSequence.get(request),
    observedAt: new Date().toISOString(),
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    elapsedMs: requestTime === undefined ? null : Date.now() - requestTime,
  });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  pendingApiRequests.delete(request);
  lastApiEventAt = Date.now();
  requestFailures.push({
    sequence: apiRequestSequence.get(request),
    observedAt: new Date().toISOString(),
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown request failure',
  });
});
page.on('requestfinished', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  finishedRequests.push({
    sequence: apiRequestSequence.get(request),
    observedAt: new Date().toISOString(),
  });
});

async function waitForApiQuiet(timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pendingApiRequests.size === 0 && Date.now() - lastApiEventAt >= 250) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`API requests did not settle; pending=${pendingApiRequests.size}.`);
}

async function enterSpaRoute(route, expectedIds, index) {
  const before = new Set(
    responses
      .slice(scenarioResponseStart)
      .map((response) => response.operationId)
      .filter(Boolean),
  );
  const requiredNewIds = expectedIds.filter((operationId) => !before.has(operationId));
  const responseWaiters = requiredNewIds.map((operationId) =>
    page.waitForResponse(
      (response) => {
        const url = new URL(response.url());
        return (
          operationFor(operationMap, response.request().method(), url.pathname) === operationId
        );
      },
      { timeout: 10_000 },
    ),
  );
  await page.evaluate(
    ({ nextPath, historyIndex }) => {
      window.history.pushState(
        { usr: null, key: `market-${historyIndex}`, idx: historyIndex },
        '',
        nextPath,
      );
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    },
    { nextPath: route.path, historyIndex: index },
  );
  await page.waitForFunction((nextPath) => window.location.pathname === nextPath, route.path);
  if (route.heading) {
    await page.getByText(route.heading, { exact: true }).first().waitFor({ state: 'visible' });
  }
  const awaitedResponses = await Promise.all(responseWaiters);
  for (const response of awaitedResponses) {
    assert.equal(
      response.status(),
      200,
      `A successful Market read returned HTTP ${response.status()}.`,
    );
    assert.equal(response.fromServiceWorker(), true, 'Market response must come from local MSW.');
  }
  await waitForApiQuiet();
  assert.equal(
    await page.getByText('Có lỗi xảy ra', { exact: true }).count(),
    0,
    `Route ${route.path} must not show the generic error state.`,
  );
  assert.ok(
    (await page.locator('body').innerText()).trim().length > 120,
    `Route ${route.path} should render its UI shell and page content.`,
  );
  if (route.heading) {
    assert.ok(
      await page.getByText(route.heading, { exact: true }).first().isVisible(),
      `Expected page heading ${route.heading} at ${route.path}.`,
    );
  }
  const screenshotName = `preview-market-success-${route.path.slice(3).replaceAll('/', '-') || 'home'}-2026-09-29.png`;
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });
  screenshotNames.push(screenshotName);
  routeResults.push({
    path: route.path,
    heading: route.heading,
    navigationMethod:
      route.path === '/w/home'
        ? 'post-login route'
        : 'SPA history route entry; no full document reload',
    expectedOperationIds: route.operationIds,
    responseOperationIds: [
      ...new Set(
        awaitedResponses.map((response) =>
          operationFor(operationMap, response.request().method(), new URL(response.url()).pathname),
        ),
      ),
    ],
    screenshot: screenshotName,
    genericErrorVisible: false,
    bodyTextLength: (await page.locator('body').innerText()).trim().length,
  });
}

function waitForOperation(operationId) {
  return page
    .waitForResponse(
      (response) => {
        const url = new URL(response.url());
        return (
          operationFor(operationMap, response.request().method(), url.pathname) === operationId
        );
      },
      { timeout: 10_000 },
    )
    .catch((error) => {
      throw new Error(
        `Timed out waiting for ${operationId}; recent API requests=${JSON.stringify(requests.slice(-12))}; recent API responses=${JSON.stringify(responses.slice(-12))}; request failures=${JSON.stringify(requestFailures.slice(-5))}`,
        { cause: error },
      );
    });
}

async function pushHistoryRoute(nextPath, historyIndex, heading) {
  await page.evaluate(
    ({ path, index }) => {
      window.history.pushState({ usr: null, key: `market-action-${index}`, idx: index }, '', path);
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    },
    { path: nextPath, index: historyIndex },
  );
  await page.waitForFunction((path) => window.location.pathname === path, nextPath);
  await page.getByText(heading, { exact: true }).first().waitFor({ state: 'visible' });
  await waitForApiQuiet();
}

async function recordWrite(operationId, response, expectedStatus) {
  assert.equal(response.status(), expectedStatus, `${operationId} returned an unexpected status.`);
  assert.equal(response.fromServiceWorker(), true, `${operationId} must remain in local MSW.`);
  writeActions.push({
    operationId,
    method: response.request().method(),
    path: new URL(response.url()).pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
}

async function exerciseMarketWriteOperations() {
  await pushHistoryRoute('/w/markets/alerts', 101, 'Cảnh báo giá');
  assert.equal(
    await page.getByText('Market price alerts are read-only for this session.').count(),
    0,
    'Market QA must have only the two scoped Market write permissions.',
  );
  const activeAlertCount = await page.getByRole('button', { name: 'Tắt cảnh báo' }).count();
  const initialAlertRowCount = await page.getByRole('button', { name: 'Xóa cảnh báo' }).count();
  await page.getByLabel('Mức giá mục tiêu').fill('12345.67');
  const createAlertResponsePromise = waitForOperation('createMarketPriceAlert');
  await page.getByRole('button', { name: 'Tạo', exact: true }).click();
  const createAlertResponse = await createAlertResponsePromise;
  const createdAlert = await createAlertResponse.json();
  assert.ok(createdAlert.id);
  await recordWrite('createMarketPriceAlert', createAlertResponse, 201);
  await waitForApiQuiet();
  assert.equal(
    await page.getByRole('button', { name: 'Tắt cảnh báo' }).count(),
    activeAlertCount + 1,
    'The created alert should appear in the rendered alert list.',
  );

  const updateAlertResponsePromise = waitForOperation('updateMarketPriceAlert');
  await page.getByRole('button', { name: 'Tắt cảnh báo' }).last().click();
  const updateAlertResponse = await updateAlertResponsePromise;
  assert.ok(new URL(updateAlertResponse.url()).pathname.endsWith(`/${createdAlert.id}`));
  await recordWrite('updateMarketPriceAlert', updateAlertResponse, 200);
  await waitForApiQuiet();
  assert.ok(await page.getByRole('button', { name: 'Bật cảnh báo' }).last().isVisible());

  const deleteAlertResponsePromise = waitForOperation('deleteMarketPriceAlert');
  await page.getByRole('button', { name: 'Xóa cảnh báo' }).last().click();
  const deleteAlertResponse = await deleteAlertResponsePromise;
  assert.ok(new URL(deleteAlertResponse.url()).pathname.endsWith(`/${createdAlert.id}`));
  await recordWrite('deleteMarketPriceAlert', deleteAlertResponse, 204);
  await waitForApiQuiet();
  assert.equal(
    await page.getByRole('button', { name: 'Xóa cảnh báo' }).count(),
    initialAlertRowCount,
    'The deleted alert should be removed from the rendered alert list.',
  );

  await pushHistoryRoute('/w/markets/watchlist', 102, 'Danh sách theo dõi');
  const initialEthEntry = page
    .getByText('ETH/USDT', { exact: true })
    .locator(
      'xpath=ancestor::div[.//button[@aria-label="Xóa khỏi danh sách theo dõi"] and contains(., "ETH/USDT")][1]',
    );
  await initialEthEntry.waitFor({ state: 'visible' });
  const deleteInitialWatchlistResponsePromise = waitForOperation('deleteMarketWatchlistItem');
  await initialEthEntry.getByRole('button', { name: 'Xóa khỏi danh sách theo dõi' }).click();
  const deleteInitialWatchlistResponse = await deleteInitialWatchlistResponsePromise;
  await recordWrite('deleteMarketWatchlistItem', deleteInitialWatchlistResponse, 204);
  await initialEthEntry.waitFor({ state: 'detached' });

  await pushHistoryRoute('/w/pair/ethusdt', 103, 'ETH/USDT');
  const addWatchlistResponsePromise = waitForOperation('addMarketWatchlistItem');
  await page.getByRole('button', { name: 'Theo dõi cặp giao dịch' }).click();
  const addWatchlistResponse = await addWatchlistResponsePromise;
  await recordWrite('addMarketWatchlistItem', addWatchlistResponse, 201);
  await waitForApiQuiet();

  await pushHistoryRoute('/w/markets/watchlist', 104, 'Danh sách theo dõi');
  const recreatedEthEntry = page
    .getByText('ETH/USDT', { exact: true })
    .locator(
      'xpath=ancestor::div[.//button[@aria-label="Xóa khỏi danh sách theo dõi"] and contains(., "ETH/USDT")][1]',
    );
  await recreatedEthEntry.waitFor({ state: 'visible' });
  const note = 'Market QA local fixture note';
  const noteButton = recreatedEthEntry.getByRole('button', { name: /^(Thêm|Sửa) ghi chú$/ });
  assert.equal(await noteButton.count(), 1, 'The ETH watchlist item must have one note action.');
  assert.equal(
    await noteButton.isEnabled(),
    true,
    `The ETH note action must be enabled; row=${JSON.stringify(await recreatedEthEntry.innerText())}.`,
  );
  const updateWatchlistResponsePromise = waitForOperation('updateMarketWatchlistItem');
  const promptPromise = page.waitForEvent('dialog');
  const noteClickPromise = noteButton.click({ timeout: 2_000 });
  const prompt = await promptPromise;
  assert.equal(prompt.type(), 'prompt');
  await prompt.accept(note);
  await noteClickPromise;
  const updateWatchlistResponse = await updateWatchlistResponsePromise;
  await recordWrite('updateMarketWatchlistItem', updateWatchlistResponse, 200);
  await page.getByText(note, { exact: false }).waitFor({ state: 'visible' });
  await waitForApiQuiet();

  const screenshotName = 'preview-market-success-market-writes-complete-2026-09-29.png';
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });
  screenshotNames.push(screenshotName);
}

try {
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const sessionResponse = await sessionPromise;
  assert.equal(sessionResponse.status(), 401);
  assert.equal(sessionResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('market');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('market.success', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  scenarioRequestStart = requests.length;
  scenarioResponseStart = responses.length;
  scenarioFailureStart = requestFailures.length;
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('auth-email').fill('market@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  const loginResponse = await loginResponsePromise;
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  const loginBody = await loginResponse.json();
  permissions = loginBody.session?.user?.permissions ?? [];
  assert.ok(permissions.includes('market:read'));
  assert.ok(permissions.includes('market:alerts:write'));
  assert.ok(permissions.includes('market:watchlist:write'));
  assert.equal(permissions.includes('market:write'), false);
  await page.waitForURL('**/w/home');

  await waitForApiQuiet();
  for (let index = 0; index < routes.length; index += 1) {
    const route = routes[index];
    if (route.path === '/w/home') {
      await waitForApiQuiet();
      await page.getByText(route.heading, { exact: true }).first().waitFor({ state: 'visible' });
      assert.ok(await page.getByText(route.heading, { exact: true }).first().isVisible());
      const screenshotName = 'preview-market-success-home-2026-09-29.png';
      await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });
      screenshotNames.push(screenshotName);
      routeResults.push({
        path: route.path,
        heading: route.heading,
        navigationMethod: 'post-login route',
        expectedOperationIds: route.operationIds,
        responseOperationIds: ['listMarketPairs', 'getMarketWatchlist'],
        screenshot: screenshotName,
        genericErrorVisible: false,
        bodyTextLength: (await page.locator('body').innerText()).trim().length,
      });
      continue;
    }
    await enterSpaRoute(route, route.operationIds, index);
  }

  await exerciseMarketWriteOperations();
  finalRoute = new URL(page.url()).pathname;
  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.slice(scenarioFailureStart);
  const marketRequests = scenarioRequests.filter((request) =>
    request.path.startsWith('/api/market/'),
  );
  const marketResponses = scenarioResponses.filter((response) =>
    response.path.startsWith('/api/market/'),
  );
  const marketWrites = marketRequests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  const observedOperationIds = [
    ...new Set(marketRequests.map((request) => request.operationId).filter(Boolean)),
  ].sort();
  const observedWriteOperationIds = [
    ...new Set(marketWrites.map((request) => request.operationId).filter(Boolean)),
  ].sort();
  const responseBySequence = new Map(
    scenarioResponses.map((response) => [response.sequence, response]),
  );
  requestFailureClassifications = scenarioFailures.map((failure) => {
    const response = responseBySequence.get(failure.sequence);
    if (
      failure.failure === 'net::ERR_ABORTED' &&
      failure.method === 'DELETE' &&
      response?.status === 204 &&
      response.fromServiceWorker
    ) {
      return {
        sequence: failure.sequence,
        operationId: failure.operationId,
        classification: 'aborted-callback-paired-with-successful-204-service-worker-response',
      };
    }
    return {
      sequence: failure.sequence,
      operationId: failure.operationId,
      classification: 'unmatched-request-failure',
    };
  });
  assert.deepEqual(
    requestFailureClassifications.filter(
      (classification) => classification.classification === 'unmatched-request-failure',
    ),
    [],
    'API request failures without a corresponding successful response must be absent.',
  );
  assert.ok(
    readOperationIds.every((operationId) => observedOperationIds.includes(operationId)),
    'All Market read operation IDs should be observed.',
  );
  assert.deepEqual(
    observedWriteOperationIds,
    writeOperationIds.slice().sort(),
    'Every scoped Market write operation must be exercised exactly at least once.',
  );
  assert.equal(marketWrites.length, writeOperationIds.length);
  assert.ok(
    marketResponses
      .filter((response) => ['GET', 'HEAD', 'OPTIONS'].includes(response.method))
      .every((response) => response.status === 200 && response.fromServiceWorker),
  );
  assert.ok(
    marketResponses
      .filter((response) => writeOperationIds.includes(response.operationId))
      .every(
        (response) =>
          response.status === expectedWriteStatuses[response.operationId] &&
          response.fromServiceWorker,
      ),
  );
  assert.equal(externalApiOrigins.size, 0);
  assert.deepEqual(pageErrors, []);
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  if (page.url()) {
    finalRoute = new URL(page.url()).pathname;
    const diagnosticPath = path.join(
      evidenceDirectory,
      'preview-market-success-diagnostic-2026-09-29.png',
    );
    if (!fsSync.existsSync(diagnosticPath)) {
      await page.screenshot({ path: diagnosticPath, fullPage: true }).catch(() => {});
      if (fsSync.existsSync(diagnosticPath)) screenshotNames.push(path.basename(diagnosticPath));
    }
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.slice(scenarioFailureStart);
  const marketRequests = scenarioRequests.filter((request) =>
    request.path.startsWith('/api/market/'),
  );
  const marketResponses = scenarioResponses.filter((response) =>
    response.path.startsWith('/api/market/'),
  );
  const observedOperationIds = [
    ...new Set(marketRequests.map((request) => request.operationId).filter(Boolean)),
  ].sort();
  const operationRequestCounts = Object.fromEntries(
    contractOperations.map((operation) => [
      operation.operationId,
      marketRequests.filter((request) => request.operationId === operation.operationId).length,
    ]),
  );
  const scenario = {
    id: 'market.success',
    domain: 'market',
    state: 'success',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'market QA (scoped permissions; isolated local MSW fixture)',
    role: 'user',
    permissions,
    routes: routeResults,
    finalRoute,
    operationIds: contractOperations.map((operation) => operation.operationId).sort(),
    observedOperationIds,
    operationRequestCounts,
    writeActions,
    requests: scenarioRequests,
    responses: scenarioResponses,
    finishedRequests: finishedRequests.filter((request) =>
      scenarioRequests.some((scenarioRequest) => scenarioRequest.sequence === request.sequence),
    ),
    requestFailures: scenarioFailures,
    requestFailureClassifications,
    routeScreenshots: screenshotNames,
    externalApiOrigins: [...externalApiOrigins],
    marketWriteCount: marketRequests.filter(
      (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
    ).length,
    elapsedMs: Date.now() - startedAt,
    sourceHashesReviewed: Object.keys(master.sourceHashes ?? {}).length,
    staleSourceHashesBeforeRun: staleSourceHashes.map(([relativePath]) => relativePath),
    sourceHashReview: {
      reviewedPaths: staleSourceHashes.map(([relativePath]) => relativePath),
      priorHashes: Object.fromEntries(staleSourceHashes),
      scope:
        'Added seven contract-shaped demo data responses only to the explicit market.success MSW preview scenario; normal unconfigured-provider handlers retain their documented 503. Added a least-privilege Market QA persona for the isolated browser context and exercised six watchlist/alert mutations against its local in-memory MSW handlers. No external API was called.',
      sourceHashBaselineRefreshedAfterBrowserRun: failures.length === 0,
    },
    pageErrors,
    failures,
    note:
      failures.length === 0
        ? `Chromium rendered ${routeResults.length} Market routes in the local SPA preview and exercised all ${contractOperations.length} Market operation IDs (${readOperationIds.length} GETs plus ${writeOperationIds.length} scoped alert/watchlist writes). Seven source-backed GETs used demo fixtures only in market.success; default unconfigured-source handlers still return documented HTTP 503. All six writes reached the local MSW service worker, returned contract statuses and changed only isolated in-memory fixtures. ${requestFailureClassifications.filter((item) => item.classification !== 'unmatched-request-failure').length} Playwright net::ERR_ABORTED callbacks were paired by request sequence with successful service-worker 204 DELETE responses and rendered-state assertions; no unmatched API request failure or external API origin was observed. This is local fixture/UI evidence, not backend, staging or user acceptance.`
        : 'Market success route coverage did not satisfy all assertions. Inspect route/request traces, page errors and the diagnostic screenshot; this report does not establish UI acceptance or backend behavior.',
  };
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      [...new Set([...sourcePaths, runnerPath])]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(path.join(root, sidecarPath), await serializeJson(sidecar, sidecarPath));
  if (failures.length === 0) {
    const allSourcePaths = [
      ...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths, runnerPath]),
    ].sort();
    master.sourceHashes = Object.fromEntries(
      allSourcePaths.map((relativePath) => [relativePath, sha256(relativePath)]),
    );
    master.sourceHashReview = scenario.sourceHashReview;
    master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'market.success');
    master.scenarios.push(scenario);
    master.marketSuccessEvidence = {
      report: sidecarPath,
      observedAt: scenario.observedAt,
      note: 'Expanded Market success coverage across registered routes with a least-privilege Market QA fixture. Seven unconfigured source reads receive demo data only in market.success; default handlers retain documented 503 behavior. All 22 operations were observed, including six UI-driven writes against isolated in-memory MSW state.',
    };
    master.screenshots = [...new Set([...(master.screenshots ?? []), ...screenshotNames])];
    master.checkedAt = scenario.observedAt;
    await fs.writeFile(path.join(root, masterPath), await serializeJson(master, masterPath));
  }
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(master.sourceHashes ?? {}).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

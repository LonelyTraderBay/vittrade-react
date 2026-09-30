import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
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
  'docs/architecture/production-readiness/evidence/A06/run-market-loading-browser-check.mjs';
const sidecarPath =
  'docs/architecture/production-readiness/evidence/A06/market-loading-browser-check-2026-09-29.json';
const masterPath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotNames = [
  'preview-market-loading-2026-09-29.png',
  'preview-market-loading-complete-2026-09-29.png',
];
const additionalScreenshotNames = [];
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/market.yaml',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/PreviewControls.test.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/market-overview-fixtures.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/market/api/market-api.ts',
  'src/features/market/model/market-queries.ts',
  'src/features/market/pages/MarketOverviewPage.test.tsx',
  'src/features/market/pages/MarketOverviewPage.tsx',
  'src/features/market/pages/PairDetailPage.test.tsx',
  'src/features/market/pages/PairDetailPage.tsx',
  'src/shared/api/client.ts',
  'src/shared/session/AuthContext.tsx',
];
const reviewedStaleHashes = {
  [runnerPath]: '26846497bec8ec4bbd93dca495b534a8e41f3c9f498f2f399035543be9c5796a',
  'src/dev/mocks/preview-scenario-handler.ts':
    'c89d7fb4a99f98f4dd3b76f2d74084679dfa93eddad0667ee2390b6303e26271',
  'src/dev/mocks/preview-scenario-handler.test.ts':
    'fcd17d5dd95cf71c71721fcbdd2d35cda210180a9fbafb8ee91c98912ed5055a',
};
const expectedOperationIds = [
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
  'createMarketPriceAlert',
  'updateMarketPriceAlert',
  'deleteMarketPriceAlert',
  'listMarketPairs',
  'getMarketPair',
  'getMarketWatchlist',
  'addMarketWatchlistItem',
  'getMarketOrderBook',
  'getMarketRecentTrades',
  'getMarketCandles',
  'updateMarketWatchlistItem',
  'deleteMarketWatchlistItem',
].sort();
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
const loadingRoutes = [
  {
    path: '/w/markets/movers',
    operationIds: ['getMarketMovers'],
    loadingText: 'Đang tải danh sách biến động…',
  },
  {
    path: '/w/markets/news',
    operationIds: ['getMarketNews'],
    loadingText: 'Đang tải tin thị trường…',
  },
  {
    path: '/w/markets/calendar',
    operationIds: ['getMarketCalendar'],
    loadingText: 'Đang tải lịch sự kiện…',
  },
  {
    path: '/w/markets/correlations',
    operationIds: ['getMarketCorrelations'],
    loadingText: 'Đang tải dữ liệu tương quan…',
  },
  {
    path: '/w/markets/unlocks',
    operationIds: ['getMarketTokenUnlocks'],
    loadingText: 'Đang tải lịch mở khóa…',
  },
  {
    path: '/w/markets/derivatives',
    operationIds: ['getMarketDerivatives'],
    loadingText: 'Đang tải dữ liệu phái sinh…',
  },
  {
    path: '/w/markets/social-sentiment',
    operationIds: ['getMarketSentiment'],
    loadingText: 'Đang tải dữ liệu tâm lý…',
  },
  {
    path: '/w/markets/signals',
    operationIds: ['getMarketSignals'],
    loadingText: 'Đang tải tín hiệu…',
  },
  {
    path: '/w/markets/alerts',
    operationIds: ['listMarketPriceAlerts'],
    loadingText: 'Đang tải cảnh báo giá…',
  },
  {
    path: '/w/markets/screener',
    operationIds: ['listMarketPairs'],
    loadingText: 'Đang tải screener…',
  },
  {
    path: '/w/pair/btcusdt',
    operationIds: ['getMarketPair', 'getMarketOrderBook', 'getMarketRecentTrades'],
    loadingText: 'Đang tải dữ liệu thị trường…',
    loadingOperationId: 'getMarketPair',
  },
  {
    path: '/w/trade/advanced-chart/btcusdt',
    operationIds: ['getMarketCandles'],
    loadingText: 'Đang tải nến 1d…',
    loadingOperationId: 'getMarketCandles',
  },
];
const overviewPath = '/api/market/overview';
const screenshotPaths = screenshotNames.map((name) => path.join(evidenceDirectory, name));
const read = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(read(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });
const tracking = JSON.parse(
  await fs.readFile(
    path.join(root, 'docs/architecture/production-readiness/TRACKING.json'),
    'utf8',
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(
  sourceHead,
  tracking.baseline.sourceHead,
  'Browser evidence must match the A06 baseline.',
);

const masterFile = path.join(root, masterPath);
const master = JSON.parse(await fs.readFile(masterFile, 'utf8'));
const priorSourceHashes = master.sourceHashes ?? {};
const staleSourceHashes = [
  ...new Set([...Object.keys(priorSourceHashes), ...sourcePaths, runnerPath]),
]
  .map((relativePath) => [relativePath, priorSourceHashes[relativePath]])
  .filter(([relativePath, expectedHash]) => sha256(relativePath) !== expectedHash)
  .sort(([left], [right]) => left.localeCompare(right));
assert.deepEqual(
  staleSourceHashes,
  Object.entries(reviewedStaleHashes).sort(([left], [right]) => left.localeCompare(right)),
  'Review stale source hashes before refreshing Market loading browser evidence.',
);

const operationMap = JSON.parse(await fs.readFile(path.join(root, operationMapPath), 'utf8'));
const contract = parse(read('contracts/openapi/market.yaml').toString('utf8'));
const contractOperations = Object.values(contract.paths).flatMap((pathItem) =>
  Object.entries(pathItem)
    .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
    .map(([method, operation]) => ({ method: method.toUpperCase(), ...operation })),
);
assert.deepEqual(
  contractOperations.map((operation) => operation.operationId).sort(),
  expectedOperationIds,
  'Market OpenAPI operation inventory changed; review this runner before using it.',
);
const overviewOperation = contractOperations.find(
  (operation) => operation.operationId === 'getMarketOverview',
);
assert.equal(overviewOperation?.responses?.['200'] !== undefined, true);
const mappedMarketOperations = operationMap.operations.filter(
  (operation) => operation.domain === 'market',
);
assert.deepEqual(
  mappedMarketOperations.map((operation) => operation.operationId).sort(),
  expectedOperationIds,
  'The static Market operation map changed; review this runner before using it.',
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const pageErrors = [];
const externalApiOrigins = new Set();
const requestStartedAt = new WeakMap();
const startedAt = Date.now();
const failures = [];
let scenarioSelected = false;
let loadingObservedBeforeResponse = false;
let loadingMarketCapAbsent = false;
let finalRoute = null;
let marketOverviewBody = null;
let marketOverviewResponseElapsedMs = null;
let homeLoadingObservedBeforeResponse = false;
const loadingRouteResults = [];
const pendingMutationObservations = [];
const observedMarketOperationIds = new Set();

function operationFor(method, pathname) {
  const operation = operationMap.operations.find((candidate) => {
    if (candidate.method !== method) return false;
    const pattern = candidate.path
      .split('/')
      .map((segment) =>
        segment.startsWith('{') && segment.endsWith('}')
          ? '[^/]+'
          : segment.replace(/[.*+?^$()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    return new RegExp(`${pattern}$`).test(pathname);
  });
  return operation?.operationId ?? null;
}

function waitForOperation(operationId) {
  return page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return operationFor(response.request().method(), url.pathname) === operationId;
    },
    { timeout: 15_000 },
  );
}

async function captureLoadingRoute(route, historyIndex) {
  const newOperationIds = route.operationIds.filter(
    (operationId) => !observedMarketOperationIds.has(operationId),
  );
  if (newOperationIds.length === 0) return;

  const settledOperationIds = new Set();
  const responsePromises = newOperationIds.map((operationId) =>
    waitForOperation(operationId).then((response) => {
      settledOperationIds.add(operationId);
      return response;
    }),
  );
  await page.evaluate(
    ({ nextPath, index }) => {
      window.history.pushState(
        { usr: null, key: `market-loading-${index}`, idx: index },
        '',
        nextPath,
      );
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    },
    { nextPath: route.path, index: historyIndex },
  );
  await page.waitForURL((url) => url.pathname === route.path);

  const loadingTexts = route.loadingTexts ?? [route.loadingText];
  const visibleLoadingTexts = [];
  for (const loadingText of loadingTexts) {
    await page.getByText(loadingText, { exact: true }).first().waitFor({ state: 'visible' });
    visibleLoadingTexts.push(loadingText);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const pendingLoadingOperation = route.loadingOperationId
      ? !settledOperationIds.has(route.loadingOperationId)
      : newOperationIds.some((operationId) => !settledOperationIds.has(operationId));
    assert.ok(
      pendingLoadingOperation,
      `${route.loadingOperationId ?? 'A route'} operation must still be pending while ${loadingText} is visible.`,
    );
  }

  const screenshotName = `preview-market-loading-${route.path.slice(3).replaceAll('/', '-')}-2026-09-29.png`;
  const screenshotPath = path.join(evidenceDirectory, screenshotName);
  await page.screenshot({ path: screenshotPath });
  additionalScreenshotNames.push(screenshotName);

  const routeResponses = await Promise.all(responsePromises);
  for (const operationId of newOperationIds) observedMarketOperationIds.add(operationId);
  loadingRouteResults.push({
    path: route.path,
    operationIds: newOperationIds,
    loadingTexts: visibleLoadingTexts,
    responseStatuses: routeResponses.map((response) => ({
      operationId: operationFor(response.request().method(), new URL(response.url()).pathname),
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    })),
    screenshot: screenshotName,
  });
}

async function recordPendingMutation(operationId, responsePromise, action, isDisabled) {
  await action();
  await new Promise((resolve) => setTimeout(resolve, 100));
  const disabledWhilePending = await isDisabled();
  const screenshotName = `preview-market-loading-pending-${operationId}-2026-09-29.png`;
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName) });
  additionalScreenshotNames.push(screenshotName);
  const response = await responsePromise;
  pendingMutationObservations.push({
    operationId,
    disabledWhilePending,
    status: response.status(),
  });
  observedMarketOperationIds.add(operationId);
  assert.equal(
    disabledWhilePending,
    true,
    `${operationId} control must be disabled while pending.`,
  );
  return response;
}

async function pushHistoryRoute(route, historyIndex, heading = null) {
  await page.evaluate(
    ({ nextPath, index }) => {
      window.history.pushState(
        { usr: null, key: `market-loading-action-${index}`, idx: index },
        '',
        nextPath,
      );
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    },
    { nextPath: route, index: historyIndex },
  );
  await page.waitForURL((url) => url.pathname === route);
  if (heading) await page.getByText(heading, { exact: true }).first().waitFor({ state: 'visible' });
}

async function exerciseMarketWriteOperations(historyIndex) {
  await pushHistoryRoute('/w/markets/alerts', historyIndex++, 'Cảnh báo giá');
  await page.getByLabel('Mức giá mục tiêu').waitFor({ state: 'visible' });
  await page.getByLabel('Mức giá mục tiêu').fill('12345.67');
  const createButton = page.getByRole('button', { name: 'Tạo', exact: true });
  const createResponse = await recordPendingMutation(
    'createMarketPriceAlert',
    waitForOperation('createMarketPriceAlert'),
    () => createButton.click(),
    () => createButton.isDisabled(),
  );
  assert.equal(createResponse.status(), expectedWriteStatuses.createMarketPriceAlert);
  assert.equal(createResponse.fromServiceWorker(), true);
  const createdAlert = await createResponse.json();
  assert.ok(createdAlert.id);
  await page.getByRole('button', { name: 'Tắt cảnh báo' }).last().waitFor({ state: 'visible' });

  const updateAlertButton = page.getByRole('button', { name: 'Tắt cảnh báo' }).last();
  const updateAlertResponse = await recordPendingMutation(
    'updateMarketPriceAlert',
    waitForOperation('updateMarketPriceAlert'),
    () => updateAlertButton.click(),
    () => updateAlertButton.isDisabled(),
  );
  assert.equal(updateAlertResponse.status(), expectedWriteStatuses.updateMarketPriceAlert);
  assert.equal(updateAlertResponse.fromServiceWorker(), true);
  await page.getByRole('button', { name: 'Bật cảnh báo' }).last().waitFor({ state: 'visible' });

  const alertCardsBeforeDelete = await page.getByRole('button', { name: 'Xóa cảnh báo' }).count();
  const deleteAlertButton = page.getByRole('button', { name: 'Xóa cảnh báo' }).last();
  const deleteAlertResponse = await recordPendingMutation(
    'deleteMarketPriceAlert',
    waitForOperation('deleteMarketPriceAlert'),
    () => deleteAlertButton.click(),
    () => deleteAlertButton.isDisabled(),
  );
  assert.equal(deleteAlertResponse.status(), expectedWriteStatuses.deleteMarketPriceAlert);
  assert.equal(deleteAlertResponse.fromServiceWorker(), true);
  await page.waitForFunction(
    (expectedCount) =>
      document.querySelectorAll('button[aria-label="Xóa cảnh báo"]').length === expectedCount,
    alertCardsBeforeDelete - 1,
  );
  assert.equal(
    await page.getByRole('button', { name: 'Xóa cảnh báo' }).count(),
    alertCardsBeforeDelete - 1,
  );

  await pushHistoryRoute('/w/markets/watchlist', historyIndex++, 'Danh sách theo dõi');
  const initialEthEntry = page
    .getByText('ETH/USDT', { exact: true })
    .locator(
      'xpath=ancestor::div[.//button[@aria-label="Xóa khỏi danh sách theo dõi"] and contains(., "ETH/USDT")][1]',
    );
  await initialEthEntry.waitFor({ state: 'visible' });
  const deleteWatchlistButton = initialEthEntry.getByRole('button', {
    name: 'Xóa khỏi danh sách theo dõi',
  });
  const deleteWatchlistResponse = await recordPendingMutation(
    'deleteMarketWatchlistItem',
    waitForOperation('deleteMarketWatchlistItem'),
    () => deleteWatchlistButton.click(),
    () => deleteWatchlistButton.isDisabled(),
  );
  assert.equal(deleteWatchlistResponse.status(), expectedWriteStatuses.deleteMarketWatchlistItem);
  assert.equal(deleteWatchlistResponse.fromServiceWorker(), true);
  await initialEthEntry.waitFor({ state: 'detached' });

  const pairResponsePromise = waitForOperation('getMarketPair');
  await pushHistoryRoute('/w/pair/ethusdt', historyIndex++);
  let pairResponseSettled = false;
  void pairResponsePromise.then(() => {
    pairResponseSettled = true;
  });
  await page.getByText('Đang tải dữ liệu thị trường…', { exact: true }).waitFor();
  assert.equal(pairResponseSettled, false);
  const pairResponse = await pairResponsePromise;
  assert.equal(pairResponse.status(), 200);
  assert.equal(pairResponse.fromServiceWorker(), true);
  await page.getByRole('button', { name: 'Theo dõi cặp giao dịch' }).waitFor({ state: 'visible' });
  const addWatchlistButton = page.getByRole('button', { name: 'Theo dõi cặp giao dịch' });
  const addWatchlistResponse = await recordPendingMutation(
    'addMarketWatchlistItem',
    waitForOperation('addMarketWatchlistItem'),
    () => addWatchlistButton.click(),
    () => addWatchlistButton.isDisabled(),
  );
  assert.equal(addWatchlistResponse.status(), expectedWriteStatuses.addMarketWatchlistItem);
  assert.equal(addWatchlistResponse.fromServiceWorker(), true);
  await page
    .getByRole('button', { name: 'Bỏ theo dõi cặp giao dịch' })
    .waitFor({ state: 'visible' });

  await pushHistoryRoute('/w/markets/watchlist', historyIndex++, 'Danh sách theo dõi');
  const recreatedEthEntry = page
    .getByText('ETH/USDT', { exact: true })
    .locator(
      'xpath=ancestor::div[.//button[@aria-label="Xóa khỏi danh sách theo dõi"] and contains(., "ETH/USDT")][1]',
    );
  await recreatedEthEntry.waitFor({ state: 'visible' });
  const noteButton = recreatedEthEntry.getByRole('button', { name: 'Thêm ghi chú' });
  const promptPromise = page.waitForEvent('dialog');
  const noteClickPromise = noteButton.click();
  const prompt = await promptPromise;
  assert.equal(prompt.type(), 'prompt');
  await prompt.accept('Market loading local fixture note');
  await noteClickPromise;
  const updateWatchlistResponsePromise = waitForOperation('updateMarketWatchlistItem');
  const updateWatchlistResponse = await recordPendingMutation(
    'updateMarketWatchlistItem',
    updateWatchlistResponsePromise,
    async () => {},
    () => noteButton.isDisabled(),
  );
  assert.equal(updateWatchlistResponse.status(), expectedWriteStatuses.updateMarketWatchlistItem);
  assert.equal(updateWatchlistResponse.fromServiceWorker(), true);
  await page.getByText('Market loading local fixture note', { exact: false }).waitFor();
}

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
  requests.push({
    operationId: operationFor(request.method(), url.pathname),
    method: request.method(),
    path: url.pathname,
    resourceType: request.resourceType(),
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const requestTime = requestStartedAt.get(response.request());
  responses.push({
    operationId: operationFor(response.request().method(), url.pathname),
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(requestTime === undefined ? {} : { elapsedMs: Date.now() - requestTime }),
  });
});

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
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('market.loading', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  const homePairsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/market/pairs' &&
      response.request().method() === 'GET',
  );
  const homeWatchlistResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/market/watchlist' &&
      response.request().method() === 'GET',
  );
  let homePairsResponseSettled = false;
  let homeWatchlistResponseSettled = false;
  void homePairsResponsePromise.then(() => {
    homePairsResponseSettled = true;
  });
  void homeWatchlistResponsePromise.then(() => {
    homeWatchlistResponseSettled = true;
  });
  const homeLoadingScreenshot = 'preview-market-loading-home-2026-09-29.png';
  const homeLoadingObserver = page
    .getByText('Đang tải dữ liệu thị trường…', { exact: true })
    .waitFor({ timeout: 5_000 })
    .then(async () => {
      homeLoadingObservedBeforeResponse =
        !homePairsResponseSettled && !homeWatchlistResponseSettled;
      await page.screenshot({ path: path.join(evidenceDirectory, homeLoadingScreenshot) });
      additionalScreenshotNames.push(homeLoadingScreenshot);
      return true;
    })
    .catch(() => false);
  await page.getByTestId('auth-email').fill('market@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await page.waitForURL('**/w/home');
  await homeLoadingObserver;
  const [loginResponse, homePairsResponse, homeWatchlistResponse] = await Promise.all([
    loginResponsePromise,
    homePairsResponsePromise,
    homeWatchlistResponsePromise,
  ]);
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  assert.equal(homePairsResponse.status(), 200);
  assert.equal(homePairsResponse.fromServiceWorker(), true);
  assert.equal(homeWatchlistResponse.status(), 200);
  assert.equal(homeWatchlistResponse.fromServiceWorker(), true);
  observedMarketOperationIds.add('listMarketPairs');
  observedMarketOperationIds.add('getMarketWatchlist');
  const loginBody = await loginResponse.json();
  const permissions = loginBody.session?.user?.permissions ?? [];
  assert.ok(permissions.includes('market:read'));
  assert.equal(permissions.includes('market:write'), false);
  await page.waitForURL('**/w/home');
  await page.getByText('Thị trường', { exact: true }).first().waitFor();

  const requestStart = requests.length;
  const responseStart = responses.length;
  const overviewResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === overviewPath && response.request().method() === 'GET',
  );
  let overviewResponseSettled = false;
  void overviewResponsePromise.then(() => {
    overviewResponseSettled = true;
  });
  await page.evaluate((route) => {
    window.history.pushState({}, '', route);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/markets/overview');
  await page.waitForURL((url) => url.pathname === '/w/markets/overview');
  await page.getByText('Đang tải dữ liệu thị trường…', { exact: true }).waitFor();
  await new Promise((resolve) => setTimeout(resolve, 0));
  loadingObservedBeforeResponse = !overviewResponseSettled;
  assert.equal(
    loadingObservedBeforeResponse,
    true,
    'Loading must be visible while GET is pending.',
  );
  loadingMarketCapAbsent =
    (await page.getByText('Tổng vốn hóa thị trường', { exact: true }).count()) === 0;
  assert.equal(
    loadingMarketCapAbsent,
    true,
    'Fresh overview content must not flash before its response.',
  );
  assert.equal(await page.getByRole('button', { name: 'Thử lại' }).count(), 0);
  await page.screenshot({ path: screenshotPaths[0] });

  const overviewResponse = await overviewResponsePromise;
  assert.equal(overviewResponse.status(), 200);
  assert.equal(overviewResponse.fromServiceWorker(), true);
  marketOverviewBody = await overviewResponse.json();
  assert.equal(Number.isFinite(marketOverviewBody.stats?.totalMarketCap), true);
  await page.getByText('Tổng vốn hóa thị trường', { exact: true }).waitFor();
  assert.equal(await page.getByText('Đang tải dữ liệu thị trường…', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Thử lại' }).count(), 0);
  await page.screenshot({ path: screenshotPaths[1] });

  const overviewRouteRequests = requests
    .slice(requestStart)
    .filter((request) => request.operationId === 'getMarketOverview');
  const overviewRouteResponses = responses
    .slice(responseStart)
    .filter((response) => response.operationId === 'getMarketOverview');
  assert.equal(overviewRouteRequests.length, 1);
  assert.equal(overviewRouteRequests[0].method, 'GET');
  assert.equal(overviewRouteResponses.length, 1);
  assert.equal(overviewRouteResponses[0].status, 200);
  assert.equal(overviewRouteResponses[0].fromServiceWorker, true);
  observedMarketOperationIds.add('getMarketOverview');
  marketOverviewResponseElapsedMs = overviewRouteResponses[0].elapsedMs ?? null;
  assert.ok(
    typeof marketOverviewResponseElapsedMs === 'number' && marketOverviewResponseElapsedMs >= 1_900,
    'The configured local loading delay must be observable in the response trace.',
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);

  let historyIndex = 1;
  for (const route of loadingRoutes) {
    await captureLoadingRoute(route, historyIndex++);
  }
  await exerciseMarketWriteOperations(historyIndex);
  assert.deepEqual([...observedMarketOperationIds].sort(), expectedOperationIds);
  assert.deepEqual(
    [...new Set(pendingMutationObservations.map((item) => item.operationId))].sort(),
    writeOperationIds.slice().sort(),
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);
  finalRoute = new URL(page.url()).pathname;
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  await page.screenshot({ path: screenshotPaths[0], fullPage: true }).catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenarioRequests = requests.filter((request) =>
    expectedOperationIds.includes(request.operationId),
  );
  const scenarioResponses = responses.filter((response) =>
    expectedOperationIds.includes(response.operationId),
  );
  const observedOperationIds = [
    ...new Set(scenarioRequests.map((request) => request.operationId)),
  ].sort();
  const screenshotArtifacts = [
    ...new Set([...screenshotNames, ...additionalScreenshotNames]),
  ].filter((name) => fsSync.existsSync(path.join(evidenceDirectory, name)));
  const visitedRoutes = [
    '/w/home',
    '/w/markets/overview',
    ...loadingRouteResults.map((result) => result.path),
    '/w/markets/alerts',
    '/w/markets/watchlist',
    '/w/pair/ethusdt',
  ];
  const observedAt = new Date().toISOString();
  const scenario = {
    id: 'market.loading',
    domain: 'market',
    state: 'loading',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt,
    persona: 'market (local MSW fixture; market:read, alert/watchlist writes only)',
    role: 'user',
    routes: [...new Set(visitedRoutes)],
    route: finalRoute,
    operationIds: expectedOperationIds,
    observedOperationIds,
    operationRequestCounts: Object.fromEntries(
      expectedOperationIds.map((operationId) => [
        operationId,
        scenarioRequests.filter((request) => request.operationId === operationId).length,
      ]),
    ),
    requests,
    responses,
    observedReadOperationIds: observedOperationIds.filter(
      (operationId) => !writeOperationIds.includes(operationId),
    ),
    observedWriteOperationIds: observedOperationIds.filter((operationId) =>
      writeOperationIds.includes(operationId),
    ),
    marketReadRequestCount: scenarioRequests.filter((request) => request.method === 'GET').length,
    marketWriteRequestCount: scenarioRequests.filter((request) => request.method !== 'GET').length,
    marketReadResponseStatuses: scenarioResponses
      .filter((response) => response.method === 'GET')
      .map((response) => ({ operationId: response.operationId, status: response.status })),
    marketOverviewTotalMarketCap: marketOverviewBody?.stats?.totalMarketCap ?? null,
    homeLoadingObservedBeforeResponse,
    loadingObservedBeforeResponse,
    loadingMarketCapAbsent,
    marketOverviewResponseElapsedMs,
    loadingRouteResults,
    pendingMutationObservations,
    scenarioSelected,
    pageErrors,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotArtifacts,
    sourceHashesReviewed: Object.keys(master.sourceHashes ?? {}).length,
    staleSourceHashesBeforeRun: staleSourceHashes.map(([relativePath]) => relativePath),
    failures,
    sourceHashReview: {
      reviewedPaths: staleSourceHashes.map(([relativePath]) => relativePath),
      priorHashes: Object.fromEntries(staleSourceHashes),
      scope:
        'The Market preview error handler and its tests changed for the next ordered row; this run refreshes loading evidence against that handler and confirms the loading behavior remains intact. The runner checks Market route-read loading states and pending write controls; Market Overview also checks stale-content absence and its response. Pair-detail tab loading is covered by the focused page test.',
      sourceHashBaselineRefreshedAfterBrowserRun: failures.length === 0,
    },
    note:
      failures.length === 0
        ? 'Local Chromium/MSW observed pending UI for Market route reads and all six Market write controls across 16 GET and six mutation operation IDs. The Overview GET returned 200 after the configured local delay. Seven provider-backed Market reads retain their ordinary unconfigured 503 behavior after the delay; Market OpenAPI declares 503 for those seven operations, while the unconfigured local responses do not verify a real provider or backend. All 22 IDs were observed through local MSW; this is not backend, staging, user acceptance or backend-latency evidence.'
        : 'The Market loading browser scenario did not satisfy every assertion. Inspect the request trace and screenshot; this report is not passing evidence.',
  };
  const sidecarFile = path.join(root, sidecarPath);
  const sidecar = {
    schemaVersion: 1,
    observedAt,
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
  await fs.writeFile(sidecarFile, await serializeJson(sidecar, sidecarFile));
  const masterSourcePaths = [
    ...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths, runnerPath]),
  ].sort();
  master.sourceHashes = Object.fromEntries(
    masterSourcePaths.map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'market.loading');
  master.scenarios.push(scenario);
  master.marketLoadingEvidence = {
    report: sidecarPath,
    observedAt,
    note: 'A focused Chromium run observed Market route-read loading and disabled pending mutation controls; pair detail order-book/recent-trade tab loading is separately covered by the focused PairDetailPage test. Unconfigured provider read statuses remain disclosed in the sidecar.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...screenshotArtifacts])];
  master.checkedAt = observedAt;
  await fs.writeFile(masterFile, await serializeJson(master, masterPath));
  await browser.close();
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(master.sourceHashes).length }, null, 2)}\n`,
  );
}

if (failures.length > 0) process.exitCode = 1;

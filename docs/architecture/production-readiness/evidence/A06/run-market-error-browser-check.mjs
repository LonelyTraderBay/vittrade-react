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
  'docs/architecture/production-readiness/evidence/A06/run-market-error-browser-check.mjs';
const sidecarPath =
  'docs/architecture/production-readiness/evidence/A06/market-error-browser-check-2026-09-29.json';
const masterPath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const contractPath = 'contracts/openapi/market.yaml';
const routes = [
  {
    path: '/w/markets/overview',
    heading: 'Tổng quan thị trường',
    expectedOperationIds: ['getMarketOverview'],
    screenshot: 'preview-market-error-overview-2026-09-29.png',
  },
  {
    path: '/w/markets/movers',
    heading: 'Biến động thị trường',
    expectedOperationIds: ['getMarketMovers'],
    screenshot: 'preview-market-error-markets-movers-2026-09-29.png',
  },
  {
    path: '/w/markets/news',
    heading: 'Tin thị trường',
    expectedOperationIds: ['getMarketNews'],
    screenshot: 'preview-market-error-markets-news-2026-09-29.png',
  },
  {
    path: '/w/markets/calendar',
    heading: 'Lịch sự kiện',
    expectedOperationIds: ['getMarketCalendar'],
  },
  {
    path: '/w/markets/correlations',
    heading: 'Tương quan thị trường',
    expectedOperationIds: ['getMarketCorrelations'],
  },
  {
    path: '/w/markets/unlocks',
    heading: 'Lịch mở khóa token',
    expectedOperationIds: ['getMarketTokenUnlocks'],
  },
  {
    path: '/w/markets/derivatives',
    heading: 'Phái sinh',
    expectedOperationIds: ['getMarketDerivatives'],
  },
  {
    path: '/w/markets/social-sentiment',
    heading: 'Tâm lý thị trường',
    expectedOperationIds: ['getMarketSentiment'],
  },
  {
    path: '/w/markets/signals',
    heading: 'Tín hiệu cộng đồng',
    expectedOperationIds: ['getMarketSignals'],
  },
  {
    path: '/w/markets/alerts',
    heading: 'Cảnh báo giá',
    expectedOperationIds: ['listMarketPairs', 'listMarketPriceAlerts'],
  },
  {
    path: '/w/markets/screener',
    heading: 'Market screener',
    expectedOperationIds: ['listMarketPairs'],
  },
  {
    path: '/w/markets/watchlist',
    heading: 'Danh sách theo dõi',
    expectedOperationIds: ['getMarketWatchlist', 'listMarketPairs'],
  },
  {
    path: '/w/pair/btcusdt',
    heading: 'Market',
    expectedOperationIds: [
      'getMarketPair',
      'getMarketOrderBook',
      'getMarketRecentTrades',
      'getMarketWatchlist',
    ],
    screenshot: 'preview-market-error-pair-btcusdt-2026-09-29.png',
  },
  {
    path: '/w/markets/depth',
    heading: 'Market depth',
    expectedOperationIds: ['listMarketPairs'],
    screenshot: 'preview-market-error-markets-depth-2026-09-29.png',
  },
  {
    path: '/w/markets/compare',
    heading: 'So sánh tài sản',
    expectedOperationIds: ['listMarketPairs'],
  },
  {
    path: '/w/markets/heatmap',
    heading: 'Market heatmap',
    expectedOperationIds: ['listMarketPairs'],
  },
  {
    path: '/w/markets/sectors',
    heading: 'Ngành thị trường',
    expectedOperationIds: ['getMarketOverview'],
  },
  {
    path: '/w/trade/advanced-chart/btcusdt',
    heading: 'Advanced charts',
    expectedOperationIds: ['getMarketPair', 'listMarketPairs'],
    screenshot: 'preview-market-error-trade-advanced-chart-btcusdt-2026-09-29.png',
  },
  {
    path: '/w/pair/btcusdt/info',
    heading: 'Token info',
    expectedOperationIds: ['getMarketPair'],
  },
];
const read = (file) => fsSync.readFileSync(path.join(root, file), 'utf8');
const hash = (file) =>
  crypto
    .createHash('sha256')
    .update(fsSync.readFileSync(path.join(root, file)))
    .digest('hex');
const serializeJson = async (value, file) =>
  prettier.format(JSON.stringify(value, null, 2) + '\n', {
    ...(await prettier.resolveConfig(file)),
    filepath: file,
    parser: 'json',
  });
const tracking = JSON.parse(read('docs/architecture/production-readiness/TRACKING.json'));
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(sourceHead, tracking.baseline.sourceHead);
const masterFile = path.join(root, masterPath);
const master = JSON.parse(await fs.readFile(masterFile, 'utf8'));
const operationMap = JSON.parse(read(operationMapPath));
const operations = operationMap.operations.filter((item) => item.domain === 'market');
const operationIds = operations.map((item) => item.operationId).sort();
const byId = new Map(operations.map((item) => [item.operationId, item]));
const contract = parse(read(contractPath));
const contractOperations = Object.values(contract.paths).flatMap((item) =>
  Object.entries(item)
    .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
    .map(([method, operation]) => ({ method: method.toUpperCase(), ...operation })),
);
const provider503OperationIds = contractOperations
  .filter((item) => item.operationId && item.responses?.['503'])
  .map((item) => item.operationId)
  .sort();
const expectedProvider503OperationIds = [
  'getMarketCalendar',
  'getMarketCorrelations',
  'getMarketDerivatives',
  'getMarketNews',
  'getMarketSentiment',
  'getMarketSignals',
  'getMarketTokenUnlocks',
].sort();
assert.deepEqual(provider503OperationIds, expectedProvider503OperationIds);
const readWithout5xxOperationIds = contractOperations
  .filter(
    (item) =>
      item.operationId &&
      item.method === 'GET' &&
      !Object.keys(item.responses ?? {}).some((status) => Number(status) >= 500),
  )
  .map((item) => item.operationId);
assert.equal(readWithout5xxOperationIds.length, 9);
assert.equal(
  contractOperations.filter(
    (item) =>
      item.operationId &&
      item.method !== 'GET' &&
      Object.keys(item.responses ?? {}).some((status) => Number(status) >= 500),
  ).length,
  0,
);
const operationFor = (method, pathname) => {
  const item = operations.find((candidate) => {
    if (candidate.method !== method) return false;
    const pattern = candidate.path
      .split('/')
      .map((segment) =>
        segment.startsWith('{') && segment.endsWith('}')
          ? '[^/]+'
          : segment.replace(/[.*+?^$()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    return new RegExp(pattern + '$').test(pathname);
  });
  return item?.operationId ?? null;
};
const staleSourceHashes = [...new Set([...Object.keys(master.sourceHashes ?? {}), runnerPath])]
  .map((file) => [file, master.sourceHashes?.[file]])
  .filter(([file, expected]) => hash(file) !== expected)
  .sort(([left], [right]) => left.localeCompare(right));
const reviewedSourceChanges = new Set([
  runnerPath,
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/features/market/pages/MarketDepthPage.tsx',
]);
assert.ok(
  staleSourceHashes.every(([file]) => reviewedSourceChanges.has(file)),
  'Review changed Market error inputs before generating evidence.',
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(12_000);
const requests = [];
const responses = [];
const requestFailures = [];
const pageErrors = [];
const externalApiOrigins = new Set();
const requestStarted = new WeakMap();
const routeResults = [];
const observedOperationIds = new Set();
const startedAt = Date.now();
const failures = [];
let scenarioSelected = false;
let retryVerified = false;
let finalRoute = null;
let observedWriteCount = 0;

page.on('request', (request) => {
  requestStarted.set(request, Date.now());
  const url = new URL(request.url());
  if (url.origin !== new URL(origin).origin && ['fetch', 'xhr'].includes(request.resourceType())) {
    externalApiOrigins.add(url.origin);
  }
  const operationId = operationFor(request.method(), url.pathname);
  if (!operationId) return;
  observedOperationIds.add(operationId);
  requests.push({ operationId, method: request.method(), path: url.pathname });
});
page.on('response', (response) => {
  const request = response.request();
  const operationId = operationFor(request.method(), new URL(response.url()).pathname);
  if (!operationId) return;
  responses.push({
    operationId,
    method: request.method(),
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    elapsedMs: requestStarted.has(request) ? Date.now() - requestStarted.get(request) : null,
  });
});
page.on('requestfailed', (request) => {
  const operationId = operationFor(request.method(), new URL(request.url()).pathname);
  if (!operationId) return;
  requestFailures.push({
    operationId,
    method: request.method(),
    errorText: request.failure()?.errorText ?? 'unknown',
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function pushHistoryRoute(route, index) {
  await page.evaluate(
    ({ nextPath, historyIndex }) => {
      const state = { usr: null, key: 'market-error-' + historyIndex, idx: historyIndex };
      window.history.pushState(state, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
    },
    { nextPath: route, historyIndex: index },
  );
  await page.waitForURL((url) => url.pathname === route);
}

function mainWithHeading(heading) {
  return page
    .getByRole('main')
    .filter({ has: page.getByText(heading, { exact: true }) })
    .last();
}

async function waitForErrorAttempts(expectedOperationIds, responseStart, failureStart) {
  const attemptsByOperation = {};
  for (const operationId of expectedOperationIds) {
    const isDeclared503 = provider503OperationIds.includes(operationId);
    const deadline = Date.now() + 15_000;
    let attempts = 0;
    while (attempts < 6 && Date.now() < deadline) {
      attempts = isDeclared503
        ? responses
            .slice(responseStart)
            .filter(
              (item) =>
                item.operationId === operationId && item.status === 503 && item.fromServiceWorker,
            ).length
        : requestFailures.slice(failureStart).filter((item) => item.operationId === operationId)
            .length;
      if (attempts < 6) await page.waitForTimeout(50);
    }
    assert.ok(
      attempts >= 6,
      operationId + ' did not finish its six local error attempts; observed ' + attempts + '.',
    );
    attemptsByOperation[operationId] = attempts;
  }
  return attemptsByOperation;
}

async function verifyRoute(route, index) {
  const requestStart = requests.length;
  const responseStart = responses.length;
  const failureStart = requestFailures.length;
  await pushHistoryRoute(route.path, index);
  const main = mainWithHeading(route.heading);
  await main.getByText(route.heading, { exact: true }).first().waitFor({ state: 'visible' });
  const errorAttempts = await waitForErrorAttempts(
    route.expectedOperationIds,
    responseStart,
    failureStart,
  );
  await main.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  await page.waitForTimeout(100);
  assert.equal(await main.getByText('Có lỗi xảy ra', { exact: true }).isVisible(), true);
  const retryVisible = await main
    .getByRole('button', { name: 'Thử lại' })
    .first()
    .isVisible()
    .catch(() => false);
  assert.equal(retryVisible, true, route.path + ' must show a retry action.');
  if (route.screenshot)
    await page.screenshot({ path: path.join(evidenceDirectory, route.screenshot) });
  await page.waitForTimeout(120);
  const routeRequests = requests.slice(requestStart);
  routeResults.push({
    path: route.path,
    errorVisible: true,
    retryVisible,
    operationIds: [...new Set(routeRequests.map((item) => item.operationId))].sort(),
    errorAttempts,
    responseStatuses: responses
      .slice(responseStart)
      .map(({ operationId, status, fromServiceWorker }) => ({
        operationId,
        status,
        fromServiceWorker,
      })),
    failedOperationIds: [
      ...new Set(requestFailures.slice(failureStart).map((item) => item.operationId)),
    ].sort(),
    screenshot: route.screenshot ?? null,
  });
}

try {
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(origin + '/w/auth/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const sessionResponse = await sessionPromise;
  assert.equal(sessionResponse.status(), 401);
  assert.equal(sessionResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('market');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('market.error', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  const homeResponseStart = responses.length;
  const homeFailureStart = requestFailures.length;
  await page.getByTestId('auth-email').fill('market@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  const loginResponse = await loginResponsePromise;
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  await page.waitForURL('**/w/home');
  const homeMain = mainWithHeading('Thị trường');
  await homeMain.getByText('Thị trường', { exact: true }).first().waitFor({ state: 'visible' });
  const homeErrorAttempts = await waitForErrorAttempts(
    ['getMarketWatchlist', 'listMarketPairs'],
    homeResponseStart,
    homeFailureStart,
  );
  await homeMain.getByText('Có lỗi xảy ra', { exact: true }).first().waitFor({ state: 'visible' });
  await page.waitForTimeout(100);
  assert.equal(await homeMain.getByText('Có lỗi xảy ra', { exact: true }).isVisible(), true);
  const homeRetryVisible = await homeMain
    .getByRole('button', { name: 'Thử lại' })
    .first()
    .isVisible();
  assert.equal(homeRetryVisible, true);
  await page.screenshot({
    path: path.join(evidenceDirectory, 'preview-market-error-home-2026-09-29.png'),
  });
  routeResults.push({
    path: '/w/home',
    errorVisible: true,
    retryVisible: homeRetryVisible,
    operationIds: [...new Set(requests.map((item) => item.operationId))].sort(),
    errorAttempts: homeErrorAttempts,
    responseStatuses: responses.map(({ operationId, status, fromServiceWorker }) => ({
      operationId,
      status,
      fromServiceWorker,
    })),
    failedOperationIds: [...new Set(requestFailures.map((item) => item.operationId))].sort(),
    screenshot: 'preview-market-error-home-2026-09-29.png',
  });

  let index = 1;
  for (const route of routes) await verifyRoute(route, index++);

  await pushHistoryRoute('/w/markets/overview', index++);
  const overviewMain = mainWithHeading('Tổng quan thị trường');
  await overviewMain
    .getByText('Tổng quan thị trường', { exact: true })
    .first()
    .waitFor({ state: 'visible' });
  await overviewMain
    .getByText('Có lỗi xảy ra', { exact: true })
    .first()
    .waitFor({ state: 'visible' });
  await page.waitForTimeout(150);
  const overviewFailuresBeforeRetry = requestFailures.filter(
    (item) => item.operationId === 'getMarketOverview',
  ).length;
  const retryFailure = page.waitForEvent('requestfailed', {
    predicate: (request) =>
      operationFor(request.method(), new URL(request.url()).pathname) === 'getMarketOverview',
  });
  const retryResponseStart = responses.length;
  const retryFailureStart = requestFailures.length;
  await overviewMain.getByRole('button', { name: 'Thử lại' }).first().click();
  await retryFailure;
  await waitForErrorAttempts(['getMarketOverview'], retryResponseStart, retryFailureStart);
  await overviewMain
    .getByText('Có lỗi xảy ra', { exact: true })
    .first()
    .waitFor({ state: 'visible' });
  retryVerified =
    requestFailures.filter((item) => item.operationId === 'getMarketOverview').length >
    overviewFailuresBeforeRetry;
  assert.equal(retryVerified, true);

  for (const operationId of provider503OperationIds) {
    assert.ok(
      responses.some(
        (item) => item.operationId === operationId && item.status === 503 && item.fromServiceWorker,
      ),
      operationId + ' must return contract-declared 503 from local MSW.',
    );
  }
  for (const response of responses) {
    if (response.status >= 500) {
      assert.ok(
        provider503OperationIds.includes(response.operationId),
        response.operationId + ' must not receive an undeclared 5xx.',
      );
    }
  }
  observedWriteCount = [...observedOperationIds].filter(
    (id) => byId.get(id)?.method !== 'GET',
  ).length;
  assert.equal(observedWriteCount, 0, 'Error preview must not trigger a Market mutation.');
  assert.equal([...externalApiOrigins].length, 0);
  assert.deepEqual(pageErrors, []);
  finalRoute = new URL(page.url()).pathname;
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  await page
    .screenshot({
      path: path.join(evidenceDirectory, 'preview-market-error-failure-2026-09-29.png'),
      fullPage: true,
    })
    .catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const observedAt = new Date().toISOString();
  const screenshotNames = [
    'preview-market-error-home-2026-09-29.png',
    ...routes.map((route) => route.screenshot).filter(Boolean),
  ];
  const screenshots = [...new Set(screenshotNames)].filter((name) =>
    fsSync.existsSync(path.join(evidenceDirectory, name)),
  );
  const scenario = {
    id: 'market.error',
    domain: 'market',
    state: 'error',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt,
    persona: 'market (local MSW fixture; market:read, alert/watchlist writes only)',
    role: 'user',
    routes: ['/w/home', ...routes.map((route) => route.path)],
    route: finalRoute,
    operationIds,
    observedOperationIds: [...observedOperationIds].sort(),
    operationRequestCounts: Object.fromEntries(
      operationIds.map((id) => [id, requests.filter((item) => item.operationId === id).length]),
    ),
    requests,
    responses,
    requestFailures,
    observedReadOperationIds: [...observedOperationIds]
      .filter((id) => byId.get(id)?.method === 'GET')
      .sort(),
    observedWriteOperationIds: [...observedOperationIds]
      .filter((id) => byId.get(id)?.method !== 'GET')
      .sort(),
    provider503OperationIds,
    readWithout5xxOperationIds,
    routeResults,
    retryVerified,
    observedWriteCount,
    pageErrors,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots,
    sourceHashesReviewed: Object.keys(master.sourceHashes ?? {}).length,
    staleSourceHashesBeforeRun: staleSourceHashes.map(([file]) => file),
    failures,
    sourceHashReview: {
      reviewedPaths: staleSourceHashes.map(([file]) => file),
      priorHashes: Object.fromEntries(staleSourceHashes),
      scope:
        'OpenAPI audit preceded preview injection. Browser evidence records visible recoverable errors on Market routes, declared provider 503 responses, transport failures, retry behavior and zero writes; focused tests cover all nine GETs without 5xx and all six mutation pass-throughs.',
      sourceHashBaselineRefreshedAfterBrowserRun: failures.length === 0,
    },
    note:
      failures.length === 0
        ? 'Local Chromium/MSW only. Seven provider reads declare 503 and receive empty-body 503 responses in this preview; Market reads without 5xx use transport failures. No Market write was triggered. This does not verify real backend/provider health, staging or production.'
        : 'The Market error browser scenario did not satisfy every assertion; inspect route results, request trace and screenshots. This report is not passing evidence.',
  };
  const sourceHashPaths = [
    ...new Set([
      ...Object.keys(master.sourceHashes ?? {}),
      contractPath,
      operationMapPath,
      runnerPath,
    ]),
  ].sort();
  const sidecar = {
    schemaVersion: 1,
    observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(sourceHashPaths.map((file) => [file, hash(file)])),
    scenario,
  };
  await fs.writeFile(path.join(root, sidecarPath), await serializeJson(sidecar, sidecarPath));
  master.sourceHashes = Object.fromEntries(sourceHashPaths.map((file) => [file, hash(file)]));
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'market.error');
  master.scenarios.push(scenario);
  master.marketErrorEvidence = {
    report: sidecarPath,
    observedAt,
    note: 'Browser checked contract-scoped Market error handling: 503 for the seven declared provider GETs, transport failures for reads without 5xx, and no writes.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...screenshots])];
  master.checkedAt = observedAt;
  await fs.writeFile(masterFile, await serializeJson(master, masterPath));
  await browser.close();
  console.log(
    JSON.stringify({ scenario, sourceHashCount: Object.keys(master.sourceHashes).length }, null, 2),
  );
  if (failures.length) process.exitCode = 1;
}

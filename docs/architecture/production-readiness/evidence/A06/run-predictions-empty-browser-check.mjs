import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Loopback preview only.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const collections = [
  {
    operationId: 'listPredictionEvents',
    route: '/w/markets/predictions',
    key: 'events',
    emptyText: 'Không có prediction market phù hợp.',
  },
  {
    operationId: 'listPredictionPositions',
    route: '/w/markets/predictions/portfolio',
    key: 'portfolio',
    emptyText: 'Chưa có vị thế.',
  },
  {
    operationId: 'listPredictionRewards',
    route: '/w/markets/predictions/rewards',
    key: 'rewards',
    emptyText: 'Chưa có phần thưởng.',
  },
  {
    operationId: 'listPredictionLeaderboard',
    route: '/w/markets/predictions/leaderboard',
    key: 'leaderboard',
    emptyText: 'Chưa có dữ liệu bảng xếp hạng.',
  },
  {
    operationId: 'listPredictionActivity',
    route: '/w/markets/predictions/activity',
    key: 'activity',
    emptyText: 'Chưa có hoạt động dự đoán.',
  },
];
const operationIds = collections.map(({ operationId }) => operationId);
const sourceFiles = [
  'contracts/openapi/predictions.yaml',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/prediction-fixtures.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/predictions/api/predictions-api.ts',
  'src/features/predictions/model/prediction-queries.ts',
  'src/features/predictions/model/prediction-types.ts',
  'src/features/predictions/pages/PredictionContractPages.tsx',
  'src/features/predictions/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/config/env.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-predictions-empty-browser-check.mjs',
];
const hash = async (file) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, file)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await hash(file)])),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const screenshotPaths = Object.fromEntries(
  collections.map(({ key }) => [
    key,
    path.join(directory, `preview-predictions-empty-${key}-${date}.png`),
  ]),
);
const reportPath = path.join(directory, `predictions-empty-browser-check-${date}.json`);
const requestCounts = Object.fromEntries(operationIds.map((operationId) => [operationId, 0]));
const requests = [];
const responses = [];
const requestStartedAt = new WeakMap();
const externalApiOrigins = new Set();
const requestFailures = [];
const pageErrors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const operationFor = (method, pathname) => {
  if (method !== 'GET') return undefined;
  if (pathname.endsWith('/api/predictions/events')) return 'listPredictionEvents';
  if (pathname.endsWith('/api/predictions/positions')) return 'listPredictionPositions';
  if (pathname.endsWith('/api/predictions/rewards')) return 'listPredictionRewards';
  if (pathname.endsWith('/api/predictions/leaderboard')) return 'listPredictionLeaderboard';
  if (pathname.endsWith('/api/predictions/activity')) return 'listPredictionActivity';
  return undefined;
};

page.on('request', (request) => {
  requestStartedAt.set(request, Date.now());
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    (request.headers().accept?.includes('json') || url.pathname.includes('/api/'))
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  const operationId = operationFor(request.method(), url.pathname);
  if (operationId) requestCounts[operationId] += 1;
  requests.push({ method: request.method(), path: url.pathname, operationId: operationId ?? null });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const method = response.request().method();
  const operationId = operationFor(method, url.pathname);
  responses.push({
    method,
    path: url.pathname,
    operationId: operationId ?? null,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    responseTimeMs: Date.now() - (requestStartedAt.get(response.request()) ?? Date.now()),
  });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/')) {
    requestFailures.push({
      method: request.method(),
      path: url.pathname,
      error: request.failure()?.errorText,
    });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const waitForOperation = (operationId) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return operationFor(response.request().method(), url.pathname) === operationId;
  });
const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};

const startedAt = Date.now();
let serviceWorkerControlled = false;
const observedCollections = {};

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.empty').waitFor();

  if (!(await page.getByLabel('Tài khoản xem trước').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
  serviceWorkerControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
  assert.equal(serviceWorkerControlled, true, 'Preview must use its local service worker.');

  for (const collection of collections) {
    const responsePromise = waitForOperation(collection.operationId);
    await navigate(collection.route);
    const response = await responsePromise;
    assert.equal(response.status(), 200, `${collection.operationId} must return 200.`);
    assert.equal(
      response.fromServiceWorker(),
      true,
      `${collection.operationId} must come from MSW.`,
    );
    const payload = await response.json();
    assert.deepEqual(
      payload,
      { items: [] },
      `${collection.operationId} must use contract-shaped empty data.`,
    );
    await page.getByText(collection.emptyText, { exact: true }).waitFor({ state: 'visible' });
    observedCollections[collection.operationId] = {
      route: collection.route,
      status: response.status(),
      itemCount: payload.items.length,
      emptyStateText: collection.emptyText,
      emptyStateVisible: true,
      responseTimeMs: responses.find((entry) => entry.operationId === collection.operationId)
        ?.responseTimeMs,
    };
    await page.screenshot({ path: screenshotPaths[collection.key], fullPage: true });
  }

  assert.deepEqual(
    requestCounts,
    Object.fromEntries(operationIds.map((operationId) => [operationId, 1])),
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(
    requestFailures.filter((failure) => failure.path.startsWith('/api/predictions/')),
    [],
  );
  assert.deepEqual(pageErrors, []);
  assert.ok(
    responses
      .filter((response) => response.operationId)
      .every((response) => response.fromServiceWorker),
  );
  const writes = requests.filter(
    (request) => request.path.startsWith('/api/predictions/') && request.method !== 'GET',
  );
  assert.deepEqual(writes, [], 'Empty-read scenario must not send Prediction mutations.');

  const screenshotNames = Object.fromEntries(
    Object.entries(screenshotPaths).map(([key, file]) => [key, path.basename(file)]),
  );
  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'predictions.empty',
      status: 'passed',
      persona: 'developer (preview only)',
      route: collections[0].route,
      additionalRoutes: collections.slice(1).map(({ route }) => route),
      operationIds,
      observedOperationIds: operationIds,
      expectedDomainOperationCount: 5,
      coverage: 'full_scenario_operations_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: true,
      localPredictionFixturesOnly: true,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: requests.length,
      apiResponseCount: responses.length,
      predictionApiRequestCount: Object.values(requestCounts).reduce(
        (sum, count) => sum + count,
        0,
      ),
      requestCounts,
      writeRequestCount: writes.length,
      requestFailureCount: requestFailures.length,
      predictionRequestFailureCount: requestFailures.filter((failure) =>
        failure.path.startsWith('/api/predictions/'),
      ).length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      collections: observedCollections,
      responses,
      requests,
      externalApiOrigins: [...externalApiOrigins],
      requestFailures,
      pageErrors,
    },
    requestTrace: requests,
    sourceHashes,
    screenshots: screenshotNames,
    limitations: [
      'All five collection responses came from the local MSW service worker and used in-memory preview data.',
      'Preview sign-in produced one net::ERR_ABORTED event for POST /api/auth/logout during redirect; the trace also records the matching service-worker 204 response. The five Prediction reads had no request failures.',
      'This verifies local request wiring and empty-state rendering only; it does not prove backend behavior, authorization enforcement, persistence, staging or user acceptance.',
      'Event detail, order placement and receipt reads are outside this empty-read scenario.',
    ],
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  await fs.writeFile(
    reportPath,
    await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
      ...prettierOptions,
      parser: 'json',
    }),
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  console.error(
    JSON.stringify(
      {
        currentUrl: page.url(),
        requestCounts,
        requests,
        responses,
        requestFailures,
        pageErrors,
        bodyText: await page
          .locator('body')
          .innerText()
          .catch(() => ''),
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await context.close();
  await browser.close();
}

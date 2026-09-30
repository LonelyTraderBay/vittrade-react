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
const loadingText = 'Đang tải dữ liệu từ Prediction API…';
const scenarioOperations = [
  'listPredictionEvents',
  'getPredictionEvent',
  'listPredictionPositions',
  'listPredictionRewards',
  'listPredictionLeaderboard',
  'listPredictionActivity',
  'getPredictionOrderReceipt',
];
const allOperationIds = [...scenarioOperations, 'placePredictionOrder'];
const pages = [
  {
    operationId: 'listPredictionEvents',
    route: '/w/markets/predictions',
    key: 'events',
    assertData: async (payload) => {
      const event = payload.items[0];
      assert.ok(event, 'Expected a Prediction event after loading.');
      await page.getByRole('button').filter({ hasText: event.title }).first().waitFor();
      return { itemCount: payload.items.length, visibleTitle: event.title };
    },
  },
  {
    operationId: 'getPredictionEvent',
    route: '/w/markets/predictions/event/pred-1',
    key: 'event',
    assertData: async (payload) => {
      assert.equal(payload.id, 'pred-1');
      await page.getByRole('heading', { name: payload.title }).waitFor();
      return { eventId: payload.id, title: payload.title, visible: true };
    },
  },
  {
    operationId: 'listPredictionPositions',
    route: '/w/markets/predictions/portfolio',
    key: 'portfolio',
    assertData: async (payload) => {
      const first = payload.items[0];
      assert.ok(first, 'Expected a Prediction position after loading.');
      const label = `${first.eventId} · ${first.outcome}`;
      await page.getByText(label, { exact: true }).waitFor();
      return { itemCount: payload.items.length, visibleItem: label };
    },
  },
  {
    operationId: 'listPredictionRewards',
    route: '/w/markets/predictions/rewards',
    key: 'rewards',
    assertData: async (payload) => {
      const first = payload.items[0];
      assert.ok(first, 'Expected a Prediction reward after loading.');
      const label = `${first.category} · ${first.eventId}`;
      await page.getByText(label, { exact: true }).waitFor();
      return { itemCount: payload.items.length, visibleItem: label };
    },
  },
  {
    operationId: 'listPredictionLeaderboard',
    route: '/w/markets/predictions/leaderboard',
    key: 'leaderboard',
    assertData: async (payload) => {
      const first = payload.items[0];
      assert.ok(first, 'Expected a leaderboard row after loading.');
      await page.getByText(first.user, { exact: false }).first().waitFor();
      return { itemCount: payload.items.length, visibleUser: first.user };
    },
  },
  {
    operationId: 'listPredictionActivity',
    route: '/w/markets/predictions/activity',
    key: 'activity',
    assertData: async (payload) => {
      const first = payload.items[0];
      assert.ok(first, 'Expected an activity row after loading.');
      await page.getByText(first.user, { exact: false }).first().waitFor();
      return { itemCount: payload.items.length, visibleUser: first.user };
    },
  },
  {
    operationId: 'getPredictionOrderReceipt',
    route: '/w/markets/predictions/receipt/po-1',
    key: 'receipt',
    assertData: async (payload) => {
      assert.equal(payload.id, 'po-1');
      await page.getByText(payload.status, { exact: true }).waitFor();
      return { receiptId: payload.id, receiptStatus: payload.status, visible: true };
    },
  },
];
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
  'docs/architecture/production-readiness/evidence/A06/run-predictions-loading-browser-check.mjs',
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
  pages.map(({ key }) => [
    key,
    path.join(directory, `preview-predictions-loading-${key}-${date}.png`),
  ]),
);
const reportPath = path.join(directory, `predictions-loading-browser-check-${date}.json`);
const requestCounts = Object.fromEntries(allOperationIds.map((operationId) => [operationId, 0]));
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
  if (method === 'GET' && pathname.endsWith('/api/predictions/events')) {
    return 'listPredictionEvents';
  }
  if (method === 'GET' && /\/api\/predictions\/events\/[^/]+$/.test(pathname)) {
    return 'getPredictionEvent';
  }
  if (method === 'GET' && pathname.endsWith('/api/predictions/positions')) {
    return 'listPredictionPositions';
  }
  if (method === 'GET' && pathname.endsWith('/api/predictions/rewards')) {
    return 'listPredictionRewards';
  }
  if (method === 'GET' && pathname.endsWith('/api/predictions/leaderboard')) {
    return 'listPredictionLeaderboard';
  }
  if (method === 'GET' && pathname.endsWith('/api/predictions/activity')) {
    return 'listPredictionActivity';
  }
  if (method === 'POST' && pathname.endsWith('/api/predictions/orders')) {
    return 'placePredictionOrder';
  }
  if (method === 'GET' && /\/api\/predictions\/orders\/[^/]+$/.test(pathname)) {
    return 'getPredictionOrderReceipt';
  }
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
const observations = {};

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.loading').waitFor();

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

  for (const item of pages) {
    const responsePromise = waitForOperation(item.operationId);
    await navigate(item.route);
    await page.getByText(loadingText, { exact: true }).waitFor({ state: 'visible' });
    const emptyTexts = [
      'Không có prediction market phù hợp.',
      'Chưa có vị thế.',
      'Chưa có phần thưởng.',
      'Chưa có dữ liệu bảng xếp hạng.',
      'Chưa có hoạt động dự đoán.',
    ];
    for (const text of emptyTexts) {
      assert.equal(
        await page.getByText(text, { exact: true }).count(),
        0,
        'Do not flash empty data while loading.',
      );
    }
    await page.screenshot({ path: screenshotPaths[item.key], fullPage: true });
    const response = await responsePromise;
    assert.equal(response.status(), 200, `${item.operationId} must resolve successfully.`);
    assert.equal(response.fromServiceWorker(), true, `${item.operationId} must come from MSW.`);
    const payload = await response.json();
    const data = await item.assertData(payload);
    observations[item.operationId] = {
      route: item.route,
      status: response.status(),
      responseTimeMs: responses.find((entry) => entry.operationId === item.operationId)
        ?.responseTimeMs,
      loadingTextVisibleBeforeResponse: true,
      falseEmptyStateDuringLoad: false,
      dataVisibleAfterResponse: true,
      ...data,
    };
  }

  assert.deepEqual(
    requestCounts,
    Object.fromEntries([
      ...scenarioOperations.map((operationId) => [operationId, 1]),
      ['placePredictionOrder', 0],
    ]),
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(
    requestFailures.filter((failure) => failure.path.startsWith('/api/predictions/')),
    [],
  );
  assert.deepEqual(pageErrors, []);
  assert.ok(
    responses
      .filter((response) => response.operationId && response.operationId !== 'placePredictionOrder')
      .every((response) => response.fromServiceWorker),
  );

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
      id: 'predictions.loading',
      status: 'passed',
      persona: 'developer (preview only)',
      route: pages[0].route,
      additionalRoutes: pages.slice(1).map(({ route }) => route),
      operationIds: scenarioOperations,
      observedOperationIds: scenarioOperations,
      expectedDomainOperationCount: scenarioOperations.length,
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
      predictionMutationCount: requestCounts.placePredictionOrder,
      requestFailureCount: requestFailures.length,
      predictionRequestFailureCount: requestFailures.filter((failure) =>
        failure.path.startsWith('/api/predictions/'),
      ).length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      pages: observations,
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
      'All Prediction API responses came from the local MSW service worker and in-memory fixtures; each 2-second delay is a preview setting, not backend latency.',
      'Preview sign-in may cancel POST /api/auth/logout during redirect while its MSW 204 response is recorded; request failures are scoped to Predictions operations.',
      'This verifies local loading and post-response UI states only; it does not prove backend behavior, persistence, staging or user acceptance.',
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

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
const route = '/w/markets/predictions';
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const operationIds = [
  'listPredictionEvents',
  'getPredictionEvent',
  'listPredictionPositions',
  'listPredictionRewards',
  'listPredictionLeaderboard',
  'listPredictionActivity',
  'placePredictionOrder',
  'getPredictionOrderReceipt',
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
  'docs/architecture/production-readiness/evidence/A06/run-predictions-success-browser-check.mjs',
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

const screenshotPaths = {
  events: path.join(directory, `preview-predictions-success-events-${date}.png`),
  event: path.join(directory, `preview-predictions-success-event-${date}.png`),
  receipt: path.join(directory, `preview-predictions-success-receipt-${date}.png`),
  portfolio: path.join(directory, `preview-predictions-success-portfolio-${date}.png`),
  rewards: path.join(directory, `preview-predictions-success-rewards-${date}.png`),
  leaderboard: path.join(directory, `preview-predictions-success-leaderboard-${date}.png`),
  activity: path.join(directory, `preview-predictions-success-activity-${date}.png`),
};
const reportPath = path.join(directory, `predictions-success-browser-check-${date}.json`);
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
  if (url.pathname.startsWith('/api/')) {
    const operationId = operationFor(request.method(), url.pathname);
    if (operationId) requestCounts[operationId] += 1;
    requests.push({
      method: request.method(),
      path: url.pathname,
      operationId: operationId ?? null,
      idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
    });
  }
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
const screenshot = async (key) => page.screenshot({ path: screenshotPaths[key], fullPage: true });

const startedAt = Date.now();
let serviceWorkerControlled = false;
let eventList;
let eventDetail;
let orderReceipt;
let position;
let reward;
let leader;
let activity;
let orderRequest;

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.success').waitFor();

  if (!(await page.getByLabel('Tài khoản xem trước').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
  serviceWorkerControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by its local service worker.',
  );

  const eventsResponsePromise = waitForOperation('listPredictionEvents');
  await navigate(route);
  const eventsResponse = await eventsResponsePromise;
  assert.equal(eventsResponse.status(), 200);
  assert.equal(eventsResponse.fromServiceWorker(), true);
  const eventsPayload = await eventsResponse.json();
  eventList = { status: eventsResponse.status(), itemCount: eventsPayload.items.length };
  const event = eventsPayload.items.find((item) => item.id === 'pred-1');
  assert.ok(event, 'Expected prediction event pred-1 in the success fixture.');
  const eventCard = page.getByRole('button').filter({ hasText: event.title }).first();
  await eventCard.waitFor({ state: 'visible' });
  await screenshot('events');
  await eventCard.click();
  await page.waitForURL('**/w/markets/predictions/event/pred-1');

  const detailResponsePromise = waitForOperation('getPredictionEvent');
  const detailResponse = await detailResponsePromise;
  assert.equal(detailResponse.status(), 200);
  assert.equal(detailResponse.fromServiceWorker(), true);
  const detailPayload = await detailResponse.json();
  await page.getByRole('heading', { name: detailPayload.title }).waitFor();
  eventDetail = { status: detailResponse.status(), eventId: detailPayload.id, titleVisible: true };
  await screenshot('event');

  const orderRequestPromise = page.waitForRequest(
    (request) =>
      operationFor(request.method(), new URL(request.url()).pathname) === 'placePredictionOrder',
  );
  const orderResponsePromise = waitForOperation('placePredictionOrder');
  const receiptResponsePromise = waitForOperation('getPredictionOrderReceipt');
  await page.getByRole('button', { name: 'Mua Yes' }).click();
  orderRequest = await orderRequestPromise;
  const orderResponse = await orderResponsePromise;
  assert.equal(orderResponse.status(), 201);
  assert.equal(orderResponse.fromServiceWorker(), true);
  const orderPayload = await orderResponse.json();
  const orderBody = orderRequest.postDataJSON();
  const idempotencyKey = orderRequest.headers()['idempotency-key'];
  assert.ok(idempotencyKey && idempotencyKey.length >= 8, 'Order must include the contract key.');
  assert.equal(orderBody.eventId, 'pred-1');
  assert.equal(orderBody.outcome, 'Yes');
  assert.equal(orderPayload.status, 'filled');
  await page.waitForURL(`**/w/markets/predictions/receipt/${orderPayload.id}`);

  const receiptResponse = await receiptResponsePromise;
  assert.equal(receiptResponse.status(), 200);
  assert.equal(receiptResponse.fromServiceWorker(), true);
  const receiptPayload = await receiptResponse.json();
  assert.equal(receiptPayload.id, orderPayload.id);
  assert.equal(receiptPayload.status, orderPayload.status);
  await page.getByText(receiptPayload.status, { exact: true }).waitFor();
  orderReceipt = {
    postStatus: orderResponse.status(),
    postIdempotencyKeyPresent: true,
    receiptId: receiptPayload.id,
    receiptStatus: receiptPayload.status,
    receiptReadStatus: receiptResponse.status(),
    receiptStatusVisible: true,
  };
  await screenshot('receipt');

  const collectionPages = [
    {
      operationId: 'listPredictionPositions',
      route: '/w/markets/predictions/portfolio',
      key: 'portfolio',
      read: async (response) => {
        const payload = await response.json();
        const first = payload.items[0];
        assert.ok(first, 'Prediction portfolio fixture is empty.');
        const label = `${first.eventId} · ${first.outcome}`;
        await page.getByText(label, { exact: true }).waitFor();
        return { itemCount: payload.items.length, firstItemVisible: true };
      },
    },
    {
      operationId: 'listPredictionRewards',
      route: '/w/markets/predictions/rewards',
      key: 'rewards',
      read: async (response) => {
        const payload = await response.json();
        const first = payload.items[0];
        assert.ok(first, 'Prediction rewards fixture is empty.');
        await page.getByText(`${first.category} · ${first.eventId}`, { exact: true }).waitFor();
        return { itemCount: payload.items.length, firstItemVisible: true };
      },
    },
    {
      operationId: 'listPredictionLeaderboard',
      route: '/w/markets/predictions/leaderboard',
      key: 'leaderboard',
      read: async (response) => {
        const payload = await response.json();
        leader = payload.items[0];
        assert.ok(leader, 'Prediction leaderboard fixture is empty.');
        await page.getByText(leader.user, { exact: false }).first().waitFor();
        return { itemCount: payload.items.length, firstItemVisible: true };
      },
    },
    {
      operationId: 'listPredictionActivity',
      route: '/w/markets/predictions/activity',
      key: 'activity',
      read: async (response) => {
        const payload = await response.json();
        activity = payload.items[0];
        assert.ok(activity, 'Prediction activity fixture is empty.');
        await page.getByText(activity.user, { exact: false }).first().waitFor();
        return { itemCount: payload.items.length, firstItemVisible: true };
      },
    },
  ];
  const collections = {};
  for (const collection of collectionPages) {
    const responsePromise = waitForOperation(collection.operationId);
    await navigate(collection.route);
    const response = await responsePromise;
    assert.equal(response.status(), 200, `${collection.operationId} must return 200.`);
    assert.equal(
      response.fromServiceWorker(),
      true,
      `${collection.operationId} must come from MSW.`,
    );
    collections[collection.operationId] = {
      status: response.status(),
      ...(await collection.read(response)),
    };
    await screenshot(collection.key);
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
      id: 'predictions.success',
      status: 'passed',
      persona: 'developer (preview only)',
      route,
      additionalRoutes: [
        '/w/markets/predictions/event/pred-1',
        `/w/markets/predictions/receipt/${orderReceipt.receiptId}`,
        '/w/markets/predictions/portfolio',
        '/w/markets/predictions/rewards',
        '/w/markets/predictions/leaderboard',
        '/w/markets/predictions/activity',
      ],
      operationIds,
      observedOperationIds: operationIds,
      expectedDomainOperationCount: 8,
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
      requestFailureCount: requestFailures.length,
      predictionRequestFailureCount: requestFailures.filter((failure) =>
        failure.path.startsWith('/api/predictions/'),
      ).length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      eventList: { ...eventList, eventTitle: event.title, visible: true },
      eventDetail,
      orderReceipt,
      collections,
      responses,
      externalApiOrigins: [...externalApiOrigins],
      requestFailures,
      pageErrors,
    },
    requestTrace: requests,
    sourceHashes,
    screenshots: screenshotNames,
    limitations: [
      'All observed API responses came from the local MSW service worker; the order receipt and mutation are in-memory preview fixtures.',
      'Preview sign-in produced one net::ERR_ABORTED event for POST /api/auth/logout during redirect; the trace also records the matching service-worker 204 response. Prediction operations had no request failures.',
      'This verifies local rendering, adapter wiring, request shape and declared 201/200 flow only; it does not prove backend persistence, exchange execution, authorization enforcement, staging or user acceptance.',
      'Unknown outcome and same-key duplicate replay remain unverified because the approved backend correlation/lookup/replay contract is absent.',
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

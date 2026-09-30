import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Loopback preview only.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const route = '/w/markets/predictions/event/pred-1';
const pendingScreenshot = path.join(directory, `preview-predictions-pending-order-${date}.png`);
const receiptScreenshot = path.join(directory, `preview-predictions-pending-receipt-${date}.png`);
const reportPath = path.join(directory, `predictions-pending-browser-check-${date}.json`);
const sourceFiles = [
  'contracts/openapi/predictions.yaml',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/prediction-fixtures.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/predictions/api/predictions-api.ts',
  'src/features/predictions/model/prediction-queries.ts',
  'src/features/predictions/model/prediction-types.ts',
  'src/features/predictions/pages/PredictionContractPages.tsx',
  'src/features/predictions/routes.ts',
  'src/shared/api/http-client.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-predictions-pending-browser-check.mjs',
];
const sha256 = async (file) =>
  crypto
    .createHash('sha256')
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
  if (method === 'GET' && pathname.endsWith('/api/predictions/events/pred-1')) {
    return 'getPredictionEvent';
  }
  if (method === 'POST' && pathname.endsWith('/api/predictions/orders')) {
    return 'placePredictionOrder';
  }
  if (method === 'GET' && /\/api\/predictions\/orders\/[^/]+$/.test(pathname)) {
    return 'getPredictionOrderReceipt';
  }
  return undefined;
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const externalApiOrigins = new Set();
const apiRequests = [];
const apiResponses = [];
const requestStartedAt = new WeakMap();
const predictionRequestFailures = [];
const pageErrors = [];

page.on('request', (request) => {
  requestStartedAt.set(request, Date.now());
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    url.pathname.startsWith('/api/')
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  apiRequests.push({
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname) ?? null,
    idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
  });
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiResponses.push({
    method: response.request().method(),
    path: url.pathname,
    operationId: operationFor(response.request().method(), url.pathname) ?? null,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    responseTimeMs: Date.now() - (requestStartedAt.get(response.request()) ?? Date.now()),
  });
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/predictions/')) {
    predictionRequestFailures.push({ method: request.method(), path: url.pathname });
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

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.pending').waitFor();

  if (!(await page.getByLabel('Tài khoản xem trước').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'The local preview service worker must control the page.',
  );

  const eventResponsePromise = waitForOperation('getPredictionEvent');
  await navigate(route);
  const eventResponse = await eventResponsePromise;
  assert.equal(eventResponse.status(), 200);
  assert.equal(eventResponse.fromServiceWorker(), true);

  const orderResponsePromise = waitForOperation('placePredictionOrder');
  const receiptResponsePromise = waitForOperation('getPredictionOrderReceipt');
  const orderButton = page.getByRole('button', { name: 'Mua Yes' });
  await orderButton.waitFor({ state: 'visible' });
  assert.equal(
    await orderButton.isEnabled(),
    true,
    'Developer preview must be allowed to place a test order.',
  );
  const submitStartedAt = Date.now();
  await orderButton.click();

  const pendingButton = page.getByRole('button', { name: 'Đang gửi…' });
  await pendingButton.waitFor({ state: 'visible' });
  const pendingUiObservedAt = Date.now();
  const pendingButtonDisabled = await pendingButton.isDisabled();
  assert.equal(pendingButtonDisabled, true, 'The order button must be disabled while pending.');
  await page.screenshot({ path: pendingScreenshot, fullPage: true });
  await page.waitForTimeout(150);
  assert.equal(
    apiRequests.filter(
      (request) => request.path === '/api/predictions/orders' && request.method === 'POST',
    ).length,
    1,
    'One click must produce only one local order request while the UI is pending.',
  );

  const orderResponse = await orderResponsePromise;
  const responseTimeMs = Date.now() - submitStartedAt;
  assert.equal(
    orderResponse.status(),
    201,
    'The preview handler must return the declared create response.',
  );
  assert.equal(orderResponse.fromServiceWorker(), true);
  const receipt = await orderResponse.json();
  assert.ok(receipt.id, 'The declared 201 receipt must provide its order id.');
  assert.ok(
    ['submitted', 'accepted', 'partially_filled', 'filled', 'canceled', 'rejected'].includes(
      receipt.status,
    ),
    'The receipt status must match the OpenAPI enum.',
  );
  assert.equal(
    orderResponse.request().headers()['idempotency-key']?.length >= 8,
    true,
    'The create request must carry the contract-required Idempotency-Key.',
  );

  await page.waitForURL((url) => url.pathname === `/w/markets/predictions/receipt/${receipt.id}`);
  const receiptResponse = await receiptResponsePromise;
  assert.equal(receiptResponse.status(), 200);
  assert.equal(receiptResponse.fromServiceWorker(), true);
  const visibleReceipt = page.getByText(receipt.status, { exact: true });
  await visibleReceipt.waitFor({ state: 'visible' });
  await page.screenshot({ path: receiptScreenshot, fullPage: true });

  const orderRequests = apiRequests.filter(
    (request) => request.path === '/api/predictions/orders' && request.method === 'POST',
  );
  assert.equal(orderRequests.length, 1);
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(predictionRequestFailures, []);
  assert.deepEqual(pageErrors, []);
  assert.ok(apiResponses.every((response) => response.fromServiceWorker));
  assert.equal(new URL(page.url()).pathname, `/w/markets/predictions/receipt/${receipt.id}`);

  const operationCounts = Object.fromEntries(
    ['getPredictionEvent', 'placePredictionOrder', 'getPredictionOrderReceipt'].map(
      (operationId) => [
        operationId,
        apiRequests.filter((request) => request.operationId === operationId).length,
      ],
    ),
  );
  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    route,
    scenario: {
      id: 'predictions.pending',
      status: 'passed',
      persona: 'developer (preview only)',
      operationIds: ['placePredictionOrder', 'getPredictionOrderReceipt'],
      observedOperationIds: ['placePredictionOrder', 'getPredictionOrderReceipt'],
      supportingOperationIds: ['getPredictionEvent'],
      expectedDomainOperationCount: 2,
      coverage: 'browser_verified',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      observedNetworkApiResponseCount: apiResponses.length,
      localMockMutation: true,
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins],
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      pendingUiObserved: true,
      pendingUiDelayMs: pendingUiObservedAt - submitStartedAt,
      orderResponseTimeMs: responseTimeMs,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      predictionOrderPostCount: orderRequests.length,
      idempotencyKeyPresent: true,
      receiptGetStatus: receiptResponse.status(),
      receiptStatus: receipt.status,
      operationCounts,
      externalApiOriginCount: externalApiOrigins.size,
      predictionRequestFailureCount: predictionRequestFailures.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      eventResponse: {
        operationId: 'getPredictionEvent',
        status: eventResponse.status(),
        fromServiceWorker: eventResponse.fromServiceWorker(),
      },
      pendingUi: { buttonText: 'Đang gửi…', buttonDisabled: pendingButtonDisabled },
      orderResponse: {
        operationId: 'placePredictionOrder',
        status: orderResponse.status(),
        fromServiceWorker: orderResponse.fromServiceWorker(),
        idempotencyKeyPresent: true,
        receiptId: receipt.id,
        receiptStatus: receipt.status,
      },
      receiptResponse: {
        operationId: 'getPredictionOrderReceipt',
        status: receiptResponse.status(),
        fromServiceWorker: receiptResponse.fromServiceWorker(),
        route: new URL(page.url()).pathname,
        visibleStatus: receipt.status,
      },
      apiRequests,
      apiResponses,
      externalApiOrigins: [...externalApiOrigins],
      predictionRequestFailures,
      pageErrors,
    },
    screenshots: {
      pending: path.basename(pendingScreenshot),
      receipt: path.basename(receiptScreenshot),
    },
    sourceHashes,
    limitations: [
      'The pending state is a local UI request-in-flight state produced by the preview scenario delay; it is not a backend order status or settlement measurement.',
      'After the declared 2-second preview delay, the local mock returns a synthetic 201 receipt and updates only in-memory preview fixtures.',
      'No exchange, backend, staging or production order was sent; this does not verify persistence, matching, replay or settlement.',
    ],
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Predictions pending browser evidence written: ${reportPath}`);
  console.log(
    JSON.stringify({
      checkedAt,
      totalFlowMs: report.measurements.totalFlowMs,
      pendingUiDelayMs: report.measurements.pendingUiDelayMs,
      orderResponseTimeMs: report.measurements.orderResponseTimeMs,
      operationCounts,
      receiptStatus: receipt.status,
      externalApiOrigins: report.fixtureBoundary.externalApiOrigins,
      realBackendMutationSent: report.fixtureBoundary.realBackendMutationSent,
      screenshots: report.screenshots,
    }),
  );
} finally {
  await context.close();
  await browser.close();
}

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
const route = '/w/markets/predictions/event/pred-1';
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const screenshotPath = path.join(directory, `preview-predictions-duplicate-conflict-${date}.png`);
const reportPath = path.join(directory, `predictions-duplicate-browser-check-${date}.json`);
const sourceFiles = [
  'contracts/openapi/predictions.yaml',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/predictions/api/predictions-api.ts',
  'src/features/predictions/model/prediction-queries.ts',
  'src/features/predictions/pages/PredictionContractPages.tsx',
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
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const apiRequests = [];
const apiResponses = [];
const requestStartedAt = new WeakMap();
const failures = [];
const pageErrors = [];
const externalApiOrigins = new Set();
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
    apiRequests.push({
      method: request.method(),
      path: url.pathname,
      idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
    });
  }
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (url.pathname.startsWith('/api/')) {
    apiResponses.push({
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      responseTimeMs: Date.now() - (requestStartedAt.get(response.request()) ?? Date.now()),
    });
  }
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/predictions/')) {
    failures.push({
      method: request.method(),
      path: url.pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const waitForResponse = (predicate) =>
  page.waitForResponse((response) => predicate(response, new URL(response.url())));
const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};

async function applyScenario() {
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('duplicate');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.duplicate').waitFor();
}

async function signIn() {
  if (!(await page.getByLabel('Tài khoản xem trước').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await applyScenario();
  await signIn();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by local service worker.',
  );

  const eventPath = '/api/predictions/events/pred-1';
  const eventPromise = waitForResponse(
    (response, url) => url.pathname === eventPath && response.request().method() === 'GET',
  );
  await navigate(route);
  const eventResponse = await eventPromise;
  assert.equal(eventResponse.status(), 200);
  assert.equal(eventResponse.fromServiceWorker(), true);

  const conflictPath = '/api/predictions/orders';
  const conflictPromise = waitForResponse(
    (response, url) => url.pathname === conflictPath && response.request().method() === 'POST',
  );
  void conflictPromise.catch(() => undefined);
  const orderButton = page.getByRole('button', { name: 'Mua Yes' });
  await orderButton.waitFor({ state: 'visible' });
  assert.equal(await orderButton.isEnabled(), true, 'Developer preview must be allowed to trade.');
  await orderButton.click();
  const conflictResponse = await conflictPromise;
  await page.getByText('Không thể gửi lệnh. Vui lòng thử lại.', { exact: true }).waitFor();
  const responseBody = await conflictResponse.text();
  const idempotencyKeyPresent = Boolean(conflictResponse.request().headers()['idempotency-key']);
  assert.equal(conflictResponse.status(), 409);
  assert.equal(conflictResponse.fromServiceWorker(), true);
  assert.equal(responseBody, '', 'Do not invent an undocumented conflict response body.');
  assert.equal(idempotencyKeyPresent, true);
  assert.equal(new URL(page.url()).pathname, route);
  await page.waitForTimeout(500);
  assert.equal(
    apiRequests.filter((request) => request.path === conflictPath && request.method === 'POST')
      .length,
    1,
    'The UI must not automatically resubmit a rejected order.',
  );
  assert.equal(
    apiRequests.some(
      (request) => request.path.includes('/predictions/orders/') && request.method === 'GET',
    ),
    false,
    'No receipt lookup is possible without a receipt orderId.',
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(failures, []);
  assert.deepEqual(pageErrors, []);

  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'predictions.duplicate',
      status: 'passed',
      persona: 'developer (preview only)',
      route,
      operationIds: ['placePredictionOrder', 'getPredictionOrderReceipt'],
      observedOperationIds: ['placePredictionOrder'],
      supportingOperationIds: ['getPredictionEvent'],
      expectedDomainOperationCount: 8,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      localContractStatusFixtureOnly: true,
      conflictBodyDefinedByContract: false,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      predictionApiRequestCount: apiRequests.filter((request) =>
        request.path.startsWith('/api/predictions/'),
      ).length,
      predictionApiResponseCount: apiResponses.filter((response) =>
        response.path.startsWith('/api/predictions/'),
      ).length,
      orderMutationCount: apiRequests.filter(
        (request) => request.path === conflictPath && request.method === 'POST',
      ).length,
      conflictResponseMs: apiResponses.find(
        (response) => response.path === conflictPath && response.method === 'POST',
      )?.responseTimeMs,
      observationWindowAfterConflictMs: 500,
      requestFailureCount: failures.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      event: { status: eventResponse.status(), serviceWorker: eventResponse.fromServiceWorker() },
      conflict: {
        status: conflictResponse.status(),
        responseBodyBytes: Buffer.byteLength(responseBody),
        idempotencyKeyPresent,
        requestCount: 1,
        genericErrorVisible: true,
        routePreserved: route,
        automaticReceiptLookup: false,
      },
      externalApiOrigins: [...externalApiOrigins],
      requestFailures: failures,
      pageErrors,
    },
    sourceHashes,
    artifacts: {
      screenshot: path.basename(screenshotPath),
      report: path.basename(reportPath),
    },
    limitations: [
      'Local MSW verifies only that the UI renders its generic error for the contract-declared 409 status.',
      'The OpenAPI response has no body schema; this fixture returns no body and does not invent a server message.',
      'This does not establish backend duplicate detection, same-key replay, order persistence, staging, or user acceptance.',
      'Only placePredictionOrder was observed out of the two linked operations; the row is representative, not full coverage.',
    ],
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        currentUrl: page.url(),
        apiRequests,
        apiResponses,
        failures,
        pageErrors,
        pageText: await page
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

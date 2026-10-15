import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-earn-pending-current-head-browser-check.mjs';
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/earn-pending-current-head-browser-check-${runId}.json`;
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotNames = [
  `preview-earn-pending-products-current-head-${runId}.png`,
  `preview-earn-pending-subscription-current-head-${runId}.png`,
  `preview-earn-pending-redemption-current-head-${runId}.png`,
  `preview-earn-pending-history-current-head-${runId}.png`,
];
const failureScreenshotName = `preview-earn-pending-failure-current-head-${runId}.png`;
const sourcePaths = [
  'contracts/openapi/earn.yaml',
  operationMapRelativePath,
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/earn-fixtures.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/earn/api/earn-api.ts',
  'src/features/earn/components/EarnFeatureComponents.tsx',
  'src/features/earn/model/earn-queries.ts',
  'src/features/earn/model/earn-types.ts',
  'src/features/earn/pages/EarnPage.tsx',
  'src/features/earn/pages/EarnHistoryPage.tsx',
  'src/features/earn/pages/EarnTransactionPages.tsx',
  'src/features/earn/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
];
const expectedOperationIds = [
  'getEarnSnapshot',
  'listEarnTransactions',
  'createEarnSubscription',
  'redeemEarnPosition',
];
const expectedScenarioOperationIds = [
  'createEarnSubscription',
  'redeemEarnPosition',
  'listEarnTransactions',
];

const readFile = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(readFile(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

function operationFor(operationMap, method, pathname) {
  return operationMap.operations.find((operation) => {
    if (operation.method !== method) return false;
    const routePattern = operation.path
      .split('/')
      .map((segment) =>
        segment.startsWith('{') && segment.endsWith('}')
          ? '[^/]+'
          : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    return new RegExp(`${routePattern}$`).test(pathname);
  })?.operationId;
}

const reportPath = path.join(root, reportRelativePath);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const operationMap = JSON.parse(
  await fs.readFile(path.join(root, operationMapRelativePath), 'utf8'),
);
assert.deepEqual(
  operationMap.operations
    .filter((operation) => operation.domain === 'earn')
    .map((item) => item.operationId),
  expectedOperationIds,
  'Earn contract operation inventory has changed.',
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const requestFailures = [];
const pageErrors = [];
const externalApiOrigins = new Set();
const requestStartTimes = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let loginPayload = null;
let scenarioSelected = false;
let finalRoute = null;
let initialSnapshot = null;
let subscriptionReceipt = null;
let redemptionReceipt = null;
let subscriptionPendingUi = null;
let redemptionPendingUi = null;
let pendingHistoryCount = 0;
let snapshotAfterSubscription = null;
let snapshotAfterRedemption = null;
const failures = [];

page.on('pageerror', (error) => pageErrors.push(error.message));

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartTimes.set(request, Date.now());
  requests.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    resourceType: request.resourceType(),
    idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
    idempotencyKeyLength: request.headers()['idempotency-key']?.length ?? 0,
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestFailures.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown transport failure',
  });
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const requestStartedAt = requestStartTimes.get(response.request());
  responses.push({
    operationId: operationFor(operationMap, response.request().method(), url.pathname) ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(requestStartedAt === undefined ? {} : { elapsedMs: Date.now() - requestStartedAt }),
  });
});

const waitForEarnResponse = (method, pathname) => {
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === pathname && response.request().method() === method,
  );
  void responsePromise.catch(() => {});
  return responsePromise;
};

async function inspectPendingReceipt(receipt, genericSuccessText) {
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.waitForURL('**/w/earn/savings/receipt');
  await page.getByRole('heading', { name: 'Yêu cầu đang xử lý', exact: true }).waitFor();
  await page.getByRole('status').filter({ hasText: 'Đang xử lý' }).waitFor();
  await page.getByText(receipt.id, { exact: true }).waitFor();
  const route = new URL(page.url()).pathname;
  return {
    route,
    receiptRouteVisible: route.endsWith('/earn/savings/receipt'),
    pendingHeadingVisible:
      (await page.getByRole('heading', { name: 'Yêu cầu đang xử lý', exact: true }).count()) > 0,
    pendingStatusVisible:
      (await page.getByRole('status').filter({ hasText: 'Đang xử lý' }).count()) > 0,
    receiptReferenceVisible: (await page.getByText(receipt.id, { exact: true }).count()) > 0,
    completedHeadingVisible:
      (await page.getByRole('heading', { name: 'Giao dịch đã hoàn tất', exact: true }).count()) > 0,
    genericSuccessVisible: (await page.getByText(genericSuccessText, { exact: true }).count()) > 0,
  };
}

async function returnToSavingsIfOnReceipt() {
  if (!new URL(page.url()).pathname.endsWith('/earn/savings/receipt')) return;
  await page.getByRole('button', { name: 'Về Tiết kiệm', exact: true }).click();
  await page.waitForURL('**/w/earn/savings');
}

try {
  const sessionPromise = waitForEarnResponse('GET', '/api/auth/session');
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  initialSessionResponse = await sessionPromise;
  assert.equal(initialSessionResponse.status(), 401);
  assert.equal(initialSessionResponse.fromServiceWorker(), true);

  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginPromise = waitForEarnResponse('POST', '/api/auth/login');
  await page.getByTestId('auth-submit').click();
  loginResponse = await loginPromise;
  loginPayload = await loginResponse.json();
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  assert.ok(loginPayload.session?.user?.permissions.includes('earn:write'));
  await page.waitForURL('**/w/home');

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('earn');
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('earn.pending', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  const initialSnapshotPromise = waitForEarnResponse('GET', '/api/earn/snapshot');
  await page.getByLabel('Kịch bản màn hình').selectOption('earn');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/earn/savings/portfolio');
  const initialSnapshotResponse = await initialSnapshotPromise;
  assert.equal(initialSnapshotResponse.status(), 200);
  assert.equal(initialSnapshotResponse.fromServiceWorker(), true);
  initialSnapshot = await initialSnapshotResponse.json();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.getByRole('button', { name: /Earn & Savings/ }).click();
  await page.waitForURL('**/w/earn/savings');
  await page.getByRole('button', { name: /USDT Linh hoạt/ }).waitFor();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[0]), fullPage: true });

  await page.getByRole('button', { name: /USDT Linh hoạt/ }).click();
  await page.getByRole('dialog', { name: 'Đăng ký sản phẩm' }).waitFor();
  await page.getByRole('textbox', { name: 'Số lượng' }).fill('100');
  await page.getByRole('checkbox').check();
  const subscriptionPromise = waitForEarnResponse('POST', '/api/earn/subscriptions');
  const subscriptionSnapshotPromise = waitForEarnResponse('GET', '/api/earn/snapshot');
  await page.getByRole('button', { name: 'Xác nhận đăng ký' }).click();
  const subscriptionResponse = await subscriptionPromise;
  subscriptionReceipt = await subscriptionResponse.json();
  assert.equal(subscriptionResponse.status(), 201);
  assert.equal(subscriptionResponse.fromServiceWorker(), true);
  assert.equal(subscriptionReceipt.status, 'pending');
  assert.deepEqual(await subscriptionResponse.request().postDataJSON(), {
    productId: 'sav001',
    amount: 100,
  });
  const subscriptionKey = subscriptionResponse.request().headers()['idempotency-key'];
  assert.ok(subscriptionKey && subscriptionKey.length >= 8);
  subscriptionPendingUi = await inspectPendingReceipt(
    subscriptionReceipt,
    'Đăng ký sản phẩm thành công.',
  );
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[1]), fullPage: true });
  const subscriptionSnapshotResponse = await subscriptionSnapshotPromise;
  assert.equal(subscriptionSnapshotResponse.status(), 200);
  snapshotAfterSubscription = await subscriptionSnapshotResponse.json();
  assert.deepEqual(
    snapshotAfterSubscription.positions,
    initialSnapshot.positions,
    'A pending subscription must not be represented as a finalized position.',
  );
  await returnToSavingsIfOnReceipt();

  const savingsPositionsTab = page.getByRole('tab', { name: /Của tôi \(\d+\)/ });
  await savingsPositionsTab.click();
  await page.getByRole('button', { name: 'Rút vốn', exact: true }).last().click();
  await page.getByRole('dialog', { name: 'Rút vốn' }).waitFor();
  await page.getByRole('textbox', { name: 'Số lượng' }).fill('50');
  const redemptionPromise = waitForEarnResponse('POST', '/api/earn/redemptions');
  const redemptionSnapshotPromise = waitForEarnResponse('GET', '/api/earn/snapshot');
  await page.getByRole('button', { name: 'Xác nhận rút vốn' }).click();
  const redemptionResponse = await redemptionPromise;
  redemptionReceipt = await redemptionResponse.json();
  assert.equal(redemptionResponse.status(), 201);
  assert.equal(redemptionResponse.fromServiceWorker(), true);
  assert.equal(redemptionReceipt.status, 'pending');
  const redemptionRequest = await redemptionResponse.request().postDataJSON();
  assert.equal(redemptionRequest.amount, 50);
  assert.ok(
    initialSnapshot.positions.some((position) => position.id === redemptionRequest.positionId),
  );
  const redemptionKey = redemptionResponse.request().headers()['idempotency-key'];
  assert.ok(redemptionKey && redemptionKey.length >= 8);
  redemptionPendingUi = await inspectPendingReceipt(
    redemptionReceipt,
    'Yêu cầu rút vốn đã được ghi nhận.',
  );
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[2]), fullPage: true });
  const redemptionSnapshotResponse = await redemptionSnapshotPromise;
  assert.equal(redemptionSnapshotResponse.status(), 200);
  snapshotAfterRedemption = await redemptionSnapshotResponse.json();
  assert.deepEqual(
    snapshotAfterRedemption.positions,
    initialSnapshot.positions,
    'A pending redemption must not be represented as a finalized position change.',
  );
  await returnToSavingsIfOnReceipt();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Kịch bản màn hình').selectOption('earnHistory');
  const transactionsPromise = waitForEarnResponse('GET', '/api/earn/transactions');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/earn/savings/history');
  const transactionsResponse = await transactionsPromise;
  assert.equal(transactionsResponse.status(), 200);
  assert.equal(transactionsResponse.fromServiceWorker(), true);
  const transactionsUrl = new URL(transactionsResponse.url());
  assert.equal(transactionsUrl.searchParams.get('domain'), 'savings');
  const transactionsPayload = await transactionsResponse.json();
  assert.ok(transactionsPayload.items.length > 0);
  pendingHistoryCount = transactionsPayload.items.filter(
    (item) => item.status === 'pending',
  ).length;
  assert.ok(pendingHistoryCount > 0, 'The history response should contain a pending transaction.');
  await page.getByText('Đăng ký · USDT Linh hoạt', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[3]), fullPage: true });

  finalRoute = new URL(page.url()).pathname;
  const observedOperationIds = [
    ...new Set(
      responses
        .filter(
          (response) =>
            expectedScenarioOperationIds.includes(response.operationId) &&
            response.status >= 200 &&
            response.status < 300,
        )
        .map((response) => response.operationId),
    ),
  ].sort();
  assert.deepEqual(observedOperationIds, [...expectedScenarioOperationIds].sort());
  if (
    !subscriptionPendingUi?.pendingHeadingVisible ||
    !subscriptionPendingUi.pendingStatusVisible ||
    !subscriptionPendingUi.receiptReferenceVisible ||
    subscriptionPendingUi.completedHeadingVisible ||
    subscriptionPendingUi.genericSuccessVisible
  ) {
    failures.push(
      'Subscription HTTP 201 pending receipt was not represented as a pending receipt in the UI.',
    );
  }
  if (
    !redemptionPendingUi?.pendingHeadingVisible ||
    !redemptionPendingUi.pendingStatusVisible ||
    !redemptionPendingUi.receiptReferenceVisible ||
    redemptionPendingUi.completedHeadingVisible ||
    redemptionPendingUi.genericSuccessVisible
  ) {
    failures.push(
      'Redemption HTTP 201 pending receipt was not represented as a pending receipt in the UI.',
    );
  }
  if (requests.length !== responses.length + requestFailures.length) {
    failures.push(
      'API requests were not completely accounted for by responses and browser failures.',
    );
  }
  if (requestFailures.some((request) => request.path.startsWith('/api/earn/'))) {
    failures.push('An Earn request failed at the transport boundary.');
  }
  assert.equal(pageErrors.length, 0);
  assert.equal(externalApiOrigins.size, 0);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  await page
    .screenshot({ path: path.join(evidenceDirectory, failureScreenshotName), fullPage: true })
    .catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenario = {
    id: 'earn.pending',
    domain: 'earn',
    state: 'pending',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    permissions: loginPayload?.session?.user?.permissions ?? [],
    route: '/w/earn/savings',
    finalRoute,
    routes: [
      '/w/earn/savings/product/sav001',
      '/w/earn/savings/redeem/:positionId',
      '/w/earn/savings/receipt',
      '/w/earn/savings/history',
    ],
    operationIds: expectedScenarioOperationIds,
    observedOperationIds: [
      ...new Set(
        responses
          .filter(
            (response) =>
              expectedScenarioOperationIds.includes(response.operationId) &&
              response.status >= 200 &&
              response.status < 300,
          )
          .map((response) => response.operationId),
      ),
    ].sort(),
    operationRequestCounts: Object.fromEntries(
      expectedOperationIds.map((id) => [
        id,
        requests.filter((request) => request.operationId === id).length,
      ]),
    ),
    requests,
    responses,
    requestFailures,
    pageErrors,
    initialSessionResponse: initialSessionResponse
      ? {
          status: initialSessionResponse.status(),
          fromServiceWorker: initialSessionResponse.fromServiceWorker(),
        }
      : null,
    loginResponse: loginResponse
      ? { status: loginResponse.status(), fromServiceWorker: loginResponse.fromServiceWorker() }
      : null,
    scenarioSelected,
    initialSnapshot: initialSnapshot
      ? {
          activePositions: initialSnapshot.summary.activePositions,
          totalDepositedUsd: initialSnapshot.summary.totalDepositedUsd,
        }
      : null,
    subscriptionReceipt,
    redemptionReceipt,
    subscriptionPendingUi,
    redemptionPendingUi,
    snapshotAfterSubscription: snapshotAfterSubscription
      ? {
          activePositions: snapshotAfterSubscription.summary.activePositions,
          positionCount: snapshotAfterSubscription.positions.length,
        }
      : null,
    snapshotAfterRedemption: snapshotAfterRedemption
      ? {
          activePositions: snapshotAfterRedemption.summary.activePositions,
          positionCount: snapshotAfterRedemption.positions.length,
        }
      : null,
    pendingHistoryCount,
    transactionRequestCount: requests.filter(
      (request) => request.operationId === 'listEarnTransactions',
    ).length,
    idempotencyKeyPresent: {
      subscribe: requests.some(
        (request) =>
          request.operationId === 'createEarnSubscription' && request.idempotencyKeyPresent,
      ),
      redeem: requests.some(
        (request) => request.operationId === 'redeemEarnPosition' && request.idempotencyKeyPresent,
      ),
    },
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames.filter((name) =>
      fsSync.existsSync(path.join(evidenceDirectory, name)),
    ),
    failures,
    note:
      failures.length === 0
        ? 'Local Chromium/MSW observed contract-valid pending 201 receipts for subscription and redemption, stable receipt IDs, pending history and unchanged positions until final confirmation. This is local fixture evidence and does not prove server-side pending durability or settlement.'
        : 'The local Earn pending browser scenario did not satisfy every pending-receipt UI assertion. Inspect request/response traces, receipt UI observations and screenshots; no backend or staging behavior is established.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...sourcePaths, runnerRelativePath])]
      .sort()
      .map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      [...new Set([...sourcePaths, runnerRelativePath])]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

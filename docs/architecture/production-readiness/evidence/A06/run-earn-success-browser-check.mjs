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
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-earn-success-browser-check.mjs';
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/earn-success-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotNames = [
  'preview-earn-success-products-2026-09-29.png',
  'preview-earn-success-subscription-2026-09-29.png',
  'preview-earn-success-redemption-2026-09-29.png',
  'preview-earn-success-history-2026-09-29.png',
];
const failureScreenshotName = 'preview-earn-success-failure-2026-09-29.png';
const sourcePaths = [
  'contracts/openapi/earn.yaml',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/earn-fixtures.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/earn/api/earn-api.ts',
  'src/features/earn/components/EarnFeatureComponents.tsx',
  'src/features/earn/model/earn-queries.ts',
  'src/features/earn/model/earn-types.ts',
  'src/features/earn/pages/EarnPage.tsx',
  'src/features/earn/pages/EarnHistoryPage.tsx',
  'src/features/earn/routes.ts',
];
const expectedOperationIds = [
  'getEarnSnapshot',
  'listEarnTransactions',
  'createEarnSubscription',
  'redeemEarnPosition',
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

const masterPath = path.join(root, masterReportRelativePath);
const reportPath = path.join(root, reportRelativePath);
const master = JSON.parse(await fs.readFile(masterPath, 'utf8'));
for (const [relativePath, expectedHash] of Object.entries(master.sourceHashes ?? {})) {
  if (relativePath === runnerRelativePath) continue;
  assert.equal(
    sha256(relativePath),
    expectedHash,
    `Existing browser evidence is stale at ${relativePath}; refresh the full preview runner first.`,
  );
}

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
  'Earn evidence must match the A06 baseline.',
);
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
const externalApiOrigins = new Set();
const requestStartTimes = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let scenarioSelected = false;
let finalRoute = null;
let initialSnapshot = null;
let subscriptionReceipt = null;
let redemptionReceipt = null;
let snapshotAfterSubscription = null;
let snapshotAfterRedemption = null;
const failures = [];

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
  const loginPayload = await loginResponse.json();
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  assert.ok(loginPayload.session?.user?.permissions.includes('earn:write'));
  await page.waitForURL('**/w/home');

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('earn');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('earn.success', { exact: true })
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
  assert.deepEqual(await subscriptionResponse.request().postDataJSON(), {
    productId: 'sav001',
    amount: 100,
  });
  const subscriptionKey = subscriptionResponse.request().headers()['idempotency-key'];
  assert.ok(subscriptionKey && subscriptionKey.length >= 8);
  await page.getByText('Đăng ký sản phẩm thành công.', { exact: true }).waitFor();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[1]), fullPage: true });
  const subscriptionSnapshotResponse = await subscriptionSnapshotPromise;
  assert.equal(subscriptionSnapshotResponse.status(), 200);
  snapshotAfterSubscription = await subscriptionSnapshotResponse.json();
  assert.ok(
    snapshotAfterSubscription.positions.some(
      (position) => position.id === subscriptionReceipt.positionId,
    ),
  );

  const savingsPositionsTab = page.getByRole('tab', { name: /Của tôi \(\d+\)/ });
  await savingsPositionsTab.click();
  await page.getByRole('button', { name: 'Rút vốn', exact: true }).last().click();
  await page.getByRole('dialog', { name: 'Rút vốn' }).waitFor();
  await page.getByRole('textbox', { name: 'Số lượng' }).fill('100');
  const redemptionPromise = waitForEarnResponse('POST', '/api/earn/redemptions');
  const redemptionSnapshotPromise = waitForEarnResponse('GET', '/api/earn/snapshot');
  await page.getByRole('button', { name: 'Xác nhận rút vốn' }).click();
  const redemptionResponse = await redemptionPromise;
  redemptionReceipt = await redemptionResponse.json();
  assert.equal(redemptionResponse.status(), 201);
  assert.equal(redemptionResponse.fromServiceWorker(), true);
  assert.deepEqual(await redemptionResponse.request().postDataJSON(), {
    positionId: subscriptionReceipt.positionId,
    amount: 100,
  });
  const redemptionKey = redemptionResponse.request().headers()['idempotency-key'];
  assert.ok(redemptionKey && redemptionKey.length >= 8);
  await page.getByText('Yêu cầu rút vốn đã được ghi nhận.', { exact: true }).waitFor();
  const redemptionSnapshotResponse = await redemptionSnapshotPromise;
  assert.equal(redemptionSnapshotResponse.status(), 200);
  snapshotAfterRedemption = await redemptionSnapshotResponse.json();
  assert.equal(
    snapshotAfterRedemption.positions.some(
      (position) => position.id === subscriptionReceipt.positionId,
    ),
    false,
  );
  await page.getByRole('tab', { name: /Của tôi \(1\)/ }).waitFor();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[2]), fullPage: true });

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
  await page.getByText('Đăng ký · USDT Linh hoạt', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[3]), fullPage: true });

  finalRoute = new URL(page.url()).pathname;
  const observedOperationIds = [
    ...new Set(
      responses
        .filter(
          (response) =>
            expectedOperationIds.includes(response.operationId) &&
            response.status >= 200 &&
            response.status < 300,
        )
        .map((response) => response.operationId),
    ),
  ].sort();
  assert.deepEqual(observedOperationIds, [...expectedOperationIds].sort());
  assert.equal(externalApiOrigins.size, 0);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  await page
    .screenshot({ path: path.join(evidenceDirectory, failureScreenshotName), fullPage: true })
    .catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenario = {
    id: 'earn.success',
    domain: 'earn',
    state: 'success',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    permissions: ['earn:write'],
    route: '/w/earn/savings',
    finalRoute,
    operationIds: expectedOperationIds,
    observedOperationIds: [
      ...new Set(
        responses
          .filter(
            (response) =>
              expectedOperationIds.includes(response.operationId) &&
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
    snapshotAfterSubscription: snapshotAfterSubscription
      ? {
          activePositions: snapshotAfterSubscription.summary.activePositions,
          totalDepositedUsd: snapshotAfterSubscription.summary.totalDepositedUsd,
          createdPositionVisible: snapshotAfterSubscription.positions.some(
            (position) => position.id === subscriptionReceipt?.positionId,
          ),
        }
      : null,
    snapshotAfterRedemption: snapshotAfterRedemption
      ? {
          activePositions: snapshotAfterRedemption.summary.activePositions,
          totalDepositedUsd: snapshotAfterRedemption.summary.totalDepositedUsd,
          redeemedPositionStillVisible: snapshotAfterRedemption.positions.some(
            (position) => position.id === subscriptionReceipt?.positionId,
          ),
        }
      : null,
    transactionCount: responses.some((response) => response.operationId === 'listEarnTransactions')
      ? requests.filter((request) => request.operationId === 'listEarnTransactions').length
      : 0,
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
        ? `Chromium exercised all four Earn success operations through local MSW: snapshot GET, transaction GET, subscription POST 201 and redemption POST 201. The subscription added a local position; full redemption removed that position from the refreshed snapshot. Snapshot totalDepositedUsd was ${initialSnapshot?.summary.totalDepositedUsd} before, ${snapshotAfterSubscription?.summary.totalDepositedUsd} after the 100 USDT subscription and ${snapshotAfterRedemption?.summary.totalDepositedUsd} after full redemption; the mock does not reconcile this aggregate, and no asset-to-USD valuation contract/source is configured, so the runner records the fixture aggregation gap without inventing a conversion. Required Idempotency-Key headers were observed, but same-key replay semantics were not tested or inferred. Transaction history shows the checked-in savings fixture rows; the mock does not correlate these rows to the new receipts. No real funds, backend, staging or user acceptance were involved.`
        : 'Local Chromium check failed before all Earn success operations were observed. See failures, observedOperationIds, request/response trace and screenshots; this report is not a passing scenario. No backend, staging or user acceptance was involved.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths, runnerRelativePath])]
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
  master.sourceHashes = sourceHashes;
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'earn.success');
  master.scenarios.push(scenario);
  master.earnSuccessEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Focused local browser check for the four Earn success operations; local fixture state only, with no backend persistence or same-key replay claim.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...scenario.screenshots])];
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

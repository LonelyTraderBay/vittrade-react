import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const directory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-earn-empty-current-head-browser-check.mjs';
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/earn-empty-current-head-browser-check-${runId}.json`;
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotNames = [
  `preview-earn-empty-portfolio-current-head-${runId}.png`,
  `preview-earn-empty-history-current-head-${runId}.png`,
];
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
  'src/features/earn/model/earn-queries.ts',
  'src/features/earn/pages/EarnPage.tsx',
  'src/features/earn/pages/EarnHistoryPage.tsx',
  'src/features/earn/routes.ts',
  operationMapRelativePath,
];
const expectedOperationIds = ['getEarnSnapshot', 'listEarnTransactions'];
const readFile = (p) => fsSync.readFileSync(path.join(root, p));
const sha256 = (p) => crypto.createHash('sha256').update(readFile(p)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });
const operationMap = JSON.parse(
  await fs.readFile(path.join(root, operationMapRelativePath), 'utf8'),
);
assert.deepEqual(
  operationMap.operations.filter((x) => x.domain === 'earn').map((x) => x.operationId),
  ['getEarnSnapshot', 'listEarnTransactions', 'createEarnSubscription', 'redeemEarnPosition'],
);
const operationFor = (method, pathname) =>
  operationMap.operations.find((op) => {
    if (op.method !== method) return false;
    const routePattern = op.path
      .split('/')
      .map((segment) =>
        segment.startsWith('{') && segment.endsWith('}')
          ? '[^/]+'
          : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    return new RegExp(`${routePattern}$`).test(pathname);
  })?.operationId ?? null;
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [],
  responses = [],
  pageErrors = [];
const externalApiOrigins = new Set();
const requestStartTimes = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null,
  loginResponse = null,
  scenarioSelected = false;
let snapshotPayload = null,
  transactionsPayload = null,
  snapshotEmptyVisible = false,
  historyEmptyVisible = false,
  finalRoute = null;
const failures = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartTimes.set(request, Date.now());
  const operationId = operationFor(request.method(), url.pathname);
  requests.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    resourceType: request.resourceType(),
    idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const request = response.request();
  const operationId = operationFor(request.method(), url.pathname);
  responses.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    elapsedMs: Date.now() - (requestStartTimes.get(request) ?? Date.now()),
  });
});
const waitResponse = (method, pathname) =>
  page.waitForResponse(
    (r) => new URL(r.url()).pathname === pathname && r.request().method() === method,
  );
try {
  const sessionPromise = waitResponse('GET', '/api/auth/session');
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginPromise = waitResponse('POST', '/api/auth/login');
  await page.getByTestId('auth-submit').click();
  initialSessionResponse = await sessionPromise;
  loginResponse = await loginPromise;
  assert.equal(initialSessionResponse.status(), 401);
  assert.equal(loginResponse.status(), 200);
  assert.equal(initialSessionResponse.fromServiceWorker(), true);
  assert.equal(loginResponse.fromServiceWorker(), true);
  await page.waitForURL('**/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('earn');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('earn.empty', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  const snapshotPromise = waitResponse('GET', '/api/earn/snapshot');
  await page.getByLabel('Kịch bản màn hình').selectOption('earn');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/earn/savings/portfolio');
  const snapshotResponse = await snapshotPromise;
  assert.equal(snapshotResponse.status(), 200);
  assert.equal(snapshotResponse.fromServiceWorker(), true);
  snapshotPayload = await snapshotResponse.json();
  assert.deepEqual(snapshotPayload.positions, []);
  await page.getByText('Chưa có vị thế tiết kiệm', { exact: true }).waitFor();
  snapshotEmptyVisible = true;
  await page.screenshot({ path: path.join(directory, screenshotNames[0]), fullPage: true });
  const transactionsPromise = waitResponse('GET', '/api/earn/transactions');
  await page.getByLabel('Kịch bản màn hình').selectOption('earnHistory');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/earn/savings/history');
  const transactionsResponse = await transactionsPromise;
  assert.equal(transactionsResponse.status(), 200);
  assert.equal(transactionsResponse.fromServiceWorker(), true);
  assert.equal(new URL(transactionsResponse.url()).searchParams.get('domain'), 'savings');
  transactionsPayload = await transactionsResponse.json();
  assert.deepEqual(transactionsPayload.items, []);
  await page.getByText('Chưa có giao dịch tiết kiệm', { exact: true }).waitFor();
  historyEmptyVisible = true;
  await page.screenshot({ path: path.join(directory, screenshotNames[1]), fullPage: true });
  finalRoute = new URL(page.url()).pathname;
  assert.equal(
    requests.filter((x) => expectedOperationIds.includes(x.operationId) && x.method !== 'GET')
      .length,
    0,
  );
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);
  const observed = [
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
  assert.deepEqual(observed, expectedOperationIds);
  assert.equal(
    requests.filter((request) => expectedOperationIds.includes(request.operationId)).length,
    2,
  );
  assert.equal(
    responses
      .filter((response) => expectedOperationIds.includes(response.operationId))
      .every((response) => response.fromServiceWorker),
    true,
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  await page
    .screenshot({
      path: path.join(directory, `preview-earn-empty-failure-current-head-${runId}.png`),
      fullPage: true,
    })
    .catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const observedOperationIds = [
    ...new Set(
      responses
        .filter(
          (r) => expectedOperationIds.includes(r.operationId) && r.status >= 200 && r.status < 300,
        )
        .map((r) => r.operationId),
    ),
  ].sort();
  const scenario = {
    id: 'earn.empty',
    domain: 'earn',
    state: 'empty',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    route: '/w/earn/savings/portfolio',
    finalRoute,
    operationIds: expectedOperationIds,
    observedOperationIds,
    operationRequestCounts: Object.fromEntries(
      expectedOperationIds.map((id) => [id, requests.filter((r) => r.operationId === id).length]),
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
    snapshot: snapshotPayload
      ? {
          positions: snapshotPayload.positions.length,
          totalDepositedUsd: snapshotPayload.summary?.totalDepositedUsd ?? null,
        }
      : null,
    transactions: transactionsPayload
      ? { items: transactionsPayload.items.length, domain: 'savings' }
      : null,
    emptyStates: { portfolio: snapshotEmptyVisible, history: historyEmptyVisible },
    externalApiOrigins: [...externalApiOrigins],
    pageErrors,
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames.filter((name) => fsSync.existsSync(path.join(directory, name))),
    failures,
    note:
      failures.length === 0
        ? 'Chromium observed empty Earn snapshot and transaction fixtures through local MSW; portfolio and history show explicit empty guidance. No Earn write was sent. This verifies only client rendering against local fixtures, not real account data or backend behavior.'
        : 'Earn empty-state browser check failed; consult the request/response trace, failures and screenshots. No backend, staging or user acceptance is implied.',
  };
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      [...new Set([...sourcePaths, runnerRelativePath])].sort().map((p) => [p, sha256(p)]),
    ),
    scenario,
  };
  await fs.writeFile(
    path.join(root, reportRelativePath),
    await serializeJson(sidecar, path.join(root, reportRelativePath)),
  );
  process.stdout.write(
    `${JSON.stringify({ report: reportRelativePath, scenario, sourceHashCount: Object.keys(sidecar.sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}
if (failures.length > 0) process.exitCode = 1;

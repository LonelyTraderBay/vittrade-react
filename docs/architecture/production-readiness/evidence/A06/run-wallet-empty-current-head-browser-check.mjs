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
const originUrl = new URL(origin);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(originUrl.hostname));
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/wallet-empty-current-head-browser-check-${runId}.json`;
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-wallet-empty-current-head-browser-check.mjs';
const screenshotNames = [
  `preview-wallet-empty-overview-${runId}.png`,
  `preview-wallet-empty-history-${runId}.png`,
];
const sourcePaths = [
  'contracts/openapi/wallet.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes/walletProfileProtectedRoutes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/wallet/api/wallet-api.ts',
  'src/features/wallet/model/wallet-queries.ts',
  'src/features/wallet/model/wallet-types.ts',
  'src/features/wallet/pages/WalletOverviewContractPage.tsx',
  'src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx',
  'src/features/wallet/routes.ts',
  operationMapPath,
];
const readFile = (p) => fsSync.readFileSync(path.join(root, p));
const sha256 = (p) => crypto.createHash('sha256').update(readFile(p)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });
const operationMap = JSON.parse(await fs.readFile(path.join(root, operationMapPath), 'utf8'));
const operations = operationMap.operations.filter((x) => x.domain === 'wallet');
const operationIds = operations.map((x) => x.operationId);
assert.deepEqual(
  operations
    .filter((x) => ['getWalletAssets', 'getWalletTransactions'].includes(x.operationId))
    .map((x) => x.operationId),
  ['getWalletAssets', 'getWalletTransactions'],
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const externalRequests = [];
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();
const externalResourceOrigins = new Set();
const requestStartedAt = new WeakMap();
const pendingWalletRequests = new Set();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let loginPayload = null;
let assetsResponse = null;
let overviewTransactionsResponse = null;
let historyTransactionsResponse = null;
let assetsPayload = null;
let overviewTransactionsPayload = null;
let historyTransactionsPayload = null;
let scenarioSelected = false;
let overviewEmptyStateVisible = false;
let historyEmptyStateVisible = false;
let finalRoute = null;
let walletFlowMs = null;
const failures = [];

page.on('request', (request) => {
  const url = new URL(request.url());
  const type = request.resourceType();
  if (url.origin !== originUrl.origin) {
    externalRequests.push({
      origin: url.origin,
      path: url.pathname,
      method: request.method(),
      resourceType: type,
    });
    if (['image', 'font', 'stylesheet'].includes(type)) externalAssetOrigins.add(url.origin);
    else if (url.pathname.startsWith('/api/')) externalApiOrigins.add(url.origin);
    else externalResourceOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
  const op = operations.find((x) => x.method === request.method() && url.pathname.endsWith(x.path));
  const isWalletRequest = url.pathname.startsWith('/api/wallet/');
  if (isWalletRequest) pendingWalletRequests.add(request);
  requests.push({
    operationId: op?.operationId ?? null,
    method: request.method(),
    path: url.pathname,
    resourceType: type,
    ...(isWalletRequest ? { query: Object.fromEntries(url.searchParams.entries()) } : {}),
  });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const op = operations.find(
    (x) => x.method === response.request().method() && url.pathname.endsWith(x.path),
  );
  const started = requestStartedAt.get(response.request());
  pendingWalletRequests.delete(response.request());
  responses.push({
    operationId: op?.operationId ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(started === undefined ? {} : { elapsedMs: Date.now() - started }),
  });
});
page.on('requestfailed', (request) => {
  pendingWalletRequests.delete(request);
});
page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));

const reportPath = path.join(root, reportRelativePath);
try {
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  initialSessionResponse = await sessionPromise;
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('auth-submit').click();
  loginResponse = await loginPromise;
  loginPayload = await loginResponse.json();
  await page.waitForURL('**/w/home');
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('wallet.empty', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const walletFlowStartedAt = Date.now();
  const assetsPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/wallet/assets' &&
      response.request().method() === 'GET',
  );
  const overviewTransactionsPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/wallet/transactions' &&
      response.request().method() === 'GET' &&
      new URL(response.url()).searchParams.get('limit') === '10',
  );
  await page.getByRole('button', { name: 'Ví', exact: true }).first().click();
  await page.waitForURL('**/w/wallet');
  [assetsResponse, overviewTransactionsResponse] = await Promise.all([
    assetsPromise,
    overviewTransactionsPromise,
  ]);
  assetsPayload = await assetsResponse.json();
  overviewTransactionsPayload = await overviewTransactionsResponse.json();
  assert.equal(assetsResponse.status(), 200);
  assert.equal(assetsResponse.fromServiceWorker(), true);
  assert.equal(overviewTransactionsResponse.status(), 200);
  assert.equal(overviewTransactionsResponse.fromServiceWorker(), true);
  assert.ok(Array.isArray(assetsPayload.items));
  assert.ok(assetsPayload.items.length > 0);
  assert.equal(overviewTransactionsPayload.total, 0);
  assert.deepEqual(overviewTransactionsPayload.items, []);
  await page.getByText('No wallet activity yet.', { exact: true }).waitFor();
  overviewEmptyStateVisible = true;
  await page.screenshot({ path: path.join(directory, screenshotNames[0]), fullPage: true });

  const historyTransactionsPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/wallet/transactions' &&
      response.request().method() === 'GET' &&
      new URL(response.url()).searchParams.get('limit') === '50',
  );
  await page.getByRole('button', { name: 'Transaction history', exact: true }).click();
  await page.waitForURL('**/w/wallet/history');
  await page.getByText('No transactions match the selected filters.', { exact: true }).waitFor();
  historyTransactionsResponse = await historyTransactionsPromise;
  historyTransactionsPayload = await historyTransactionsResponse.json();
  assert.equal(historyTransactionsResponse.status(), 200);
  assert.equal(historyTransactionsResponse.fromServiceWorker(), true);
  assert.equal(historyTransactionsPayload.total, 0);
  assert.deepEqual(historyTransactionsPayload.items, []);
  historyEmptyStateVisible = true;
  walletFlowMs = Date.now() - walletFlowStartedAt;
  await page.screenshot({ path: path.join(directory, screenshotNames[1]), fullPage: true });

  const walletRequests = requests.filter((request) => request.path.startsWith('/api/wallet/'));
  const walletResponses = responses.filter((response) => response.path.startsWith('/api/wallet/'));
  const writeRequests = walletRequests.filter((request) => request.method !== 'GET');
  assert.equal(walletRequests.length, 3);
  assert.equal(walletResponses.length, 3);
  assert.equal(writeRequests.length, 0);
  assert.equal(pendingWalletRequests.size, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(
    walletResponses.every((response) => response.fromServiceWorker),
    true,
  );
  assert.deepEqual(failures, []);
  finalRoute = new URL(page.url()).pathname;
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  for (const screenshotName of screenshotNames) {
    const screenshotPath = path.join(directory, screenshotName);
    if (!fsSync.existsSync(screenshotPath))
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const walletRequests = requests.filter((request) => request.path.startsWith('/api/wallet/'));
  const walletResponses = responses.filter((response) => response.path.startsWith('/api/wallet/'));
  const observedOperationIds = [...new Set(walletResponses.map((response) => response.operationId))]
    .filter(Boolean)
    .sort();
  const scenario = {
    id: 'wallet.empty',
    domain: 'wallet',
    state: 'empty',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'developer',
    permissions: loginPayload?.session?.user?.permissions ?? [],
    route: '/w/wallet',
    finalRoute,
    operationIds: ['getWalletAssets', 'getWalletTransactions'],
    observedOperationIds,
    operationRequestCounts: Object.fromEntries(
      ['getWalletAssets', 'getWalletTransactions'].map((id) => [
        id,
        walletRequests.filter((request) => request.operationId === id).length,
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
    selectedScenario: scenarioSelected ? 'wallet.empty' : null,
    walletEvidence: {
      requestCount: walletRequests.length,
      responseCount: walletResponses.length,
      writeRequestCount: walletRequests.filter((request) => request.method !== 'GET').length,
      pendingRequestCount: pendingWalletRequests.size,
      allResponsesFromServiceWorker: walletResponses.every(
        (response) => response.fromServiceWorker,
      ),
      assetCount: assetsPayload?.items?.length ?? null,
      assetTotalUsd: assetsPayload?.summary?.totalUsd ?? null,
      overviewTransactionCount: overviewTransactionsPayload?.total ?? null,
      historyTransactionCount: historyTransactionsPayload?.total ?? null,
      overviewEmptyStateVisible,
      historyEmptyStateVisible,
      elapsedMs: walletFlowMs,
    },
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    externalResourceOrigins: [...externalResourceOrigins],
    externalRequests,
    pageErrors: failures.filter((failure) => failure.startsWith('pageerror:')),
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames.filter((name) => fsSync.existsSync(path.join(directory, name))),
    failures,
    note: 'Local Chromium/Vite/MSW Wallet empty-activity scenario. The overview balances remain populated; the recent-activity and transaction-history reads return contract-valid empty collections. Only getWalletAssets and getWalletTransactions were called (three GET requests across two routes); no Wallet mutation was sent. This does not establish backend/staging behavior, authorization, production availability or user acceptance.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...sourcePaths, runnerRelativePath])].sort().map((p) => [p, sha256(p)]),
  );
  const sidecar = {
    schemaVersion: 1,
    checkedAt,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allWalletResponsesFromServiceWorker: walletResponses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      walletWriteRequestCount: walletRequests.filter((request) => request.method !== 'GET').length,
    },
    sourceHashes,
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));
  process.stdout.write(
    `${JSON.stringify({ reportRelativePath, scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}
if (failures.length > 0) process.exitCode = 1;

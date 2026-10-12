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
const directory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const originUrl = new URL(origin);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(originUrl.hostname));
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-wallet-forbidden-current-head-browser-check.mjs';
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/wallet-forbidden-current-head-browser-check-${runId}.json`;
const screenshotNames = [
  `preview-wallet-forbidden-overview-${runId}.png`,
  `preview-wallet-forbidden-history-${runId}.png`,
];
const sourcePaths = [
  'contracts/openapi/wallet.yaml',
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json',
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
  'src/features/wallet/pages/WalletOverviewContractPage.test.tsx',
  'src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx',
  'src/features/wallet/pages/WalletTransactionHistoryContractPage.test.tsx',
  'src/features/wallet/routes.ts',
  'src/shared/api/api-error.ts',
  'src/shared/api/query-client.ts',
  'src/shared/ui/ErrorState.tsx',
];
const readFile = (p) => fsSync.readFileSync(path.join(root, p));
const sha256 = (p) => crypto.createHash('sha256').update(readFile(p)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });
const contract = parse(await fs.readFile(path.join(root, 'contracts/openapi/wallet.yaml'), 'utf8'));
const operations = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) =>
    ['getWalletAssets', 'getWalletTransactions'].includes(operation.operationId),
  );
assert.deepEqual(operations.map((operation) => operation.operationId).sort(), [
  'getWalletAssets',
  'getWalletTransactions',
]);
assert.ok(operations.every((operation) => Object.hasOwn(operation.responses ?? {}, '403')));
const operationByPath = new Map(
  operations.map((operation) => [
    `/api${Object.keys(contract.paths).find((p) => contract.paths[p].get === operation)}`,
    operation.operationId,
  ]),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const externalRequests = [];
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();
const requestStartedAt = new WeakMap();
const pendingWalletRequests = new Set();
const pageErrors = [];
const failures = [];
let initialSessionResponse = null;
let loginResponse = null;
let loginPayload = null;
let successAssetsPayload = null;
let successOverviewTransactionsPayload = null;
let successHistoryTransactionsPayload = null;
let forbiddenOverview = null;
let forbiddenHistory = null;
let historyAssetMarker = null;
let scenarioSelected = false;
let walletFlowMs = null;
let finalRoute = null;
const startedAt = Date.now();

page.on('request', (request) => {
  const url = new URL(request.url());
  const resourceType = request.resourceType();
  if (url.origin !== originUrl.origin) {
    externalRequests.push({
      origin: url.origin,
      path: url.pathname,
      method: request.method(),
      resourceType,
    });
    if (['image', 'font', 'stylesheet'].includes(resourceType))
      externalAssetOrigins.add(url.origin);
    else if (url.pathname.startsWith('/api/')) externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
  const operationId = operationByPath.get(url.pathname) ?? null;
  const isWalletRequest = url.pathname.startsWith('/api/wallet/');
  if (isWalletRequest) pendingWalletRequests.add(request);
  requests.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    resourceType,
    ...(url.pathname.endsWith('/transactions')
      ? { query: Object.fromEntries(url.searchParams.entries()) }
      : {}),
  });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const request = response.request();
  const started = requestStartedAt.get(request);
  pendingWalletRequests.delete(request);
  const operationId = operationByPath.get(url.pathname) ?? null;
  responses.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(started === undefined ? {} : { elapsedMs: Date.now() - started }),
  });
});
page.on('requestfailed', (request) => pendingWalletRequests.delete(request));
page.on('pageerror', (error) => pageErrors.push(error.message));

async function selectWalletScenario(state) {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption(state);
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText(`wallet.${state}`).waitFor();
  scenarioSelected = true;
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
}

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

function walletResponse(pathname, method, query = {}) {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === pathname &&
      response.request().method() === method &&
      Object.entries(query).every(([key, value]) => url.searchParams.get(key) === value)
    );
  });
}

async function readForbiddenObservation(route, responsePairs, markers) {
  const routeStartedAt = Date.now();
  await navigateWithinSpa(route);
  const routeResponses = await Promise.all(responsePairs);
  const payloads = await Promise.all(routeResponses.map((response) => response.json()));
  const errorCopy = route === '/w/wallet' ? 'Unable to load wallet' : 'Có lỗi xảy ra';
  await page.waitForFunction(
    ([expectedError, permissionError]) =>
      document.body.innerText.includes(expectedError) ||
      document.body.innerText.includes(permissionError),
    [errorCopy, 'Không có quyền truy cập'],
  );
  const deniedTitle = page.getByText('Không có quyền truy cập', { exact: true });
  const genericOverviewTitle = page.getByText('Unable to load wallet', { exact: true });
  const genericHistoryTitle = page.getByText('Có lỗi xảy ra', { exact: true });
  const isOverview = route === '/w/wallet';
  const genericErrorVisible = isOverview
    ? await genericOverviewTitle.isVisible().catch(() => false)
    : await genericHistoryTitle.isVisible().catch(() => false);
  const permissionErrorVisible = await deniedTitle.isVisible().catch(() => false);
  const retryActionVisible = await page
    .getByRole('button', { name: 'Thử lại', exact: true })
    .count();
  const staleMarkersVisible = {};
  for (const marker of markers) {
    staleMarkersVisible[marker] = (await page.getByText(marker, { exact: true }).count()) > 0;
  }
  const emptyStateVisible = isOverview
    ? (await page.getByText('No wallet activity yet.', { exact: true }).count()) > 0 ||
      (await page.getByText('No assets match this filter.', { exact: true }).count()) > 0
    : (await page
        .getByText('No transactions match the selected filters.', { exact: true })
        .count()) > 0;
  const screenshot = screenshotNames[isOverview ? 0 : 1];
  await page.screenshot({ path: path.join(directory, screenshot), fullPage: true });
  return {
    route,
    responses: routeResponses.map((response) => ({
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    })),
    payloads,
    permissionErrorVisible,
    genericErrorVisible,
    retryActionVisible,
    staleMarkersVisible,
    emptyStateVisible,
    elapsedMs: Date.now() - routeStartedAt,
    screenshot,
  };
}

const reportPath = path.join(root, reportRelativePath);
try {
  const sessionPromise = walletResponse('/api/auth/session', 'GET');
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginPromise = walletResponse('/api/auth/login', 'POST');
  await page.getByTestId('auth-submit').click();
  [initialSessionResponse, loginResponse] = await Promise.all([sessionPromise, loginPromise]);
  loginPayload = await loginResponse.json();
  await page.waitForURL('**/w/home');
  assert.equal(initialSessionResponse.status(), 401);
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);

  await selectWalletScenario('success');
  const walletFlowStartedAt = Date.now();
  const successAssetsPromise = walletResponse('/api/wallet/assets', 'GET');
  const successOverviewTransactionsPromise = walletResponse('/api/wallet/transactions', 'GET', {
    limit: '10',
  });
  await navigateWithinSpa('/w/wallet');
  const [successAssetsResponse, successOverviewTransactionsResponse] = await Promise.all([
    successAssetsPromise,
    successOverviewTransactionsPromise,
  ]);
  successAssetsPayload = await successAssetsResponse.json();
  successOverviewTransactionsPayload = await successOverviewTransactionsResponse.json();
  assert.equal(successAssetsResponse.status(), 200);
  assert.equal(successAssetsResponse.fromServiceWorker(), true);
  assert.equal(successOverviewTransactionsResponse.status(), 200);
  assert.ok(successAssetsPayload.items?.length > 0);
  await page.getByText('$16,754.32', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Transaction history', exact: true }).click();
  await page.waitForURL('**/w/wallet/history');
  const successHistoryTransactionsResponse = await walletResponse(
    '/api/wallet/transactions',
    'GET',
    { limit: '50' },
  );
  successHistoryTransactionsPayload = await successHistoryTransactionsResponse.json();
  assert.equal(successHistoryTransactionsResponse.status(), 200);
  assert.equal(successHistoryTransactionsResponse.fromServiceWorker(), true);
  assert.ok(successHistoryTransactionsPayload.items?.length > 0);
  historyAssetMarker = String(successHistoryTransactionsPayload.items[0].asset);
  await page.getByText(historyAssetMarker, { exact: true }).first().waitFor();
  await navigateWithinSpa('/w/home');
  await selectWalletScenario('forbidden');
  await page.waitForTimeout(5_200);

  const forbiddenAssetsPromise = walletResponse('/api/wallet/assets', 'GET');
  const forbiddenOverviewTransactionsPromise = walletResponse('/api/wallet/transactions', 'GET', {
    limit: '10',
  });
  forbiddenOverview = await readForbiddenObservation(
    '/w/wallet',
    [forbiddenAssetsPromise, forbiddenOverviewTransactionsPromise],
    ['$16,754.32'],
  );
  await page
    .getByText('Không có quyền truy cập', { exact: true })
    .waitFor({ timeout: 250 })
    .catch(() => {});
  await page.waitForTimeout(100);
  forbiddenOverview.permissionErrorVisible =
    (await page.getByText('Không có quyền truy cập', { exact: true }).count()) > 0;
  forbiddenOverview.genericErrorVisible =
    (await page.getByText('Unable to load wallet', { exact: true }).count()) > 0;
  forbiddenOverview.retryActionVisible =
    (await page.getByRole('button', { name: 'Thử lại', exact: true }).count()) > 0;

  const forbiddenHistoryTransactionsPromise = walletResponse('/api/wallet/transactions', 'GET', {
    limit: '50',
  });
  forbiddenHistory = await readForbiddenObservation(
    '/w/wallet/history',
    [forbiddenHistoryTransactionsPromise],
    [historyAssetMarker],
  );
  await page
    .getByText('Không có quyền truy cập', { exact: true })
    .waitFor({ timeout: 250 })
    .catch(() => {});
  await page.waitForTimeout(100);
  forbiddenHistory.permissionErrorVisible =
    (await page.getByText('Không có quyền truy cập', { exact: true }).count()) > 0;
  forbiddenHistory.genericErrorVisible =
    (await page.getByText('Có lỗi xảy ra', { exact: true }).count()) > 0;
  forbiddenHistory.retryActionVisible =
    (await page.getByRole('button', { name: 'Thử lại', exact: true }).count()) > 0;
  walletFlowMs = Date.now() - walletFlowStartedAt;

  const walletRequests = requests.filter((request) => request.path.startsWith('/api/wallet/'));
  const walletResponses = responses.filter((response) => response.path.startsWith('/api/wallet/'));
  assert.equal(
    walletRequests.some((request) => request.method !== 'GET'),
    false,
  );
  assert.equal(
    walletRequests.some((request) => !operationByPath.has(request.path)),
    false,
  );
  assert.equal(pendingWalletRequests.size, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(
    walletResponses.every((response) => response.fromServiceWorker),
    true,
  );
  assert.deepEqual(pageErrors, []);
  finalRoute = new URL(page.url()).pathname;
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  for (const screenshotName of screenshotNames) {
    const screenshotPath = path.join(directory, screenshotName);
    if (!fsSync.existsSync(screenshotPath)) {
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    }
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const walletRequests = requests.filter((request) => request.path.startsWith('/api/wallet/'));
  const walletResponses = responses.filter((response) => response.path.startsWith('/api/wallet/'));
  const staleDataHidden = [forbiddenOverview, forbiddenHistory].every(
    (observation) =>
      observation && Object.values(observation.staleMarkersVisible).every((visible) => !visible),
  );
  const forbiddenUiDistinct = [forbiddenOverview, forbiddenHistory].every(
    (observation) => observation?.permissionErrorVisible && !observation.genericErrorVisible,
  );
  const noRetryOnForbidden = [forbiddenOverview, forbiddenHistory].every(
    (observation) => observation && !observation.retryActionVisible,
  );
  const allForbiddenResponses = walletResponses.filter((response) => response.status === 403);
  const walletOperationIds = ['getWalletAssets', 'getWalletTransactions'];
  const operationRequestCounts = Object.fromEntries(
    walletOperationIds.map((operationId) => [
      operationId,
      walletRequests.filter((request) => request.operationId === operationId).length,
    ]),
  );
  const scenario = {
    id: 'wallet.forbidden',
    domain: 'wallet',
    state: 'forbidden',
    status:
      failures.length === 0 &&
      allForbiddenResponses.length >= 3 &&
      staleDataHidden &&
      forbiddenUiDistinct &&
      noRetryOnForbidden
        ? 'passed'
        : failures.length === 0 && allForbiddenResponses.length >= 3 && staleDataHidden
          ? 'gap_observed'
          : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'developer',
    permissions: loginPayload?.session?.user?.permissions ?? [],
    routes: ['/w/wallet', '/w/wallet/history'],
    operationIds: walletOperationIds,
    observedOperationIds: [...new Set(walletResponses.map((response) => response.operationId))]
      .filter(Boolean)
      .sort(),
    declared403OperationCount: operations.filter((operation) =>
      Object.hasOwn(operation.responses ?? {}, '403'),
    ).length,
    operationRequestCounts,
    requests,
    responses,
    successBaseline: {
      assetCount: successAssetsPayload?.items?.length ?? null,
      totalUsd: successAssetsPayload?.summary?.totalUsd ?? null,
      overviewTransactionCount: successOverviewTransactionsPayload?.total ?? null,
      historyTransactionCount: successHistoryTransactionsPayload?.total ?? null,
      historyAssetMarker,
    },
    observations: { overview: forbiddenOverview, history: forbiddenHistory },
    acceptance: {
      permissionSpecificErrorVisibleOnAllRoutes: forbiddenUiDistinct,
      staleSuccessDataHiddenOnAllRoutes: staleDataHidden,
      retryActionHiddenOnAllRoutes: noRetryOnForbidden,
      emptyStateHiddenOnAllRoutes: [forbiddenOverview, forbiddenHistory].every(
        (observation) => observation && !observation.emptyStateVisible,
      ),
      allForbiddenResponsesFromServiceWorker: allForbiddenResponses.every(
        (response) => response.fromServiceWorker,
      ),
      mutationRequestCount: walletRequests.filter((request) => request.method !== 'GET').length,
    },
    finalRoute,
    elapsedMs: Date.now() - startedAt,
    walletFlowMs,
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    externalRequests,
    pageErrors,
    screenshotNames,
    failures,
    note: 'Current-head local Chromium/MSW check. Three safe GET attempts cover the two current Wallet routes after successful wallet data was cached: assets, overview transactions (limit=10), and history transactions (limit=50). It does not call Wallet mutations or certify backend authorization, staging, production, or user acceptance.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...sourcePaths, runnerRelativePath])].sort().map((p) => [p, sha256(p)]),
  );
  const sidecar = {
    schemaVersion: 1,
    checkedAt,
    observedAt: scenario.observedAt,
    sourceHead,
    branch,
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: responses.every(
        (response) => response.fromServiceWorker,
      ),
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
  const observationSummary = (observation) =>
    observation && {
      route: observation.route,
      statuses: observation.responses.map((response) => response.status),
      permissionErrorVisible: observation.permissionErrorVisible,
      genericErrorVisible: observation.genericErrorVisible,
      retryActionVisible: observation.retryActionVisible,
      staleMarkersVisible: observation.staleMarkersVisible,
      emptyStateVisible: observation.emptyStateVisible,
      elapsedMs: observation.elapsedMs,
      screenshot: observation.screenshot,
    };
  process.stdout.write(
    `${JSON.stringify(
      {
        reportRelativePath,
        status: scenario.status,
        observedOperationIds: scenario.observedOperationIds,
        operationRequestCounts,
        forbiddenResponseCount: allForbiddenResponses.length,
        acceptance: scenario.acceptance,
        observations: {
          overview: observationSummary(forbiddenOverview),
          history: observationSummary(forbiddenHistory),
        },
        elapsedMs: scenario.elapsedMs,
        walletFlowMs,
        externalApiOrigins: scenario.externalApiOrigins,
        pageErrors,
        failureCount: failures.length,
        sourceHashCount: Object.keys(sourceHashes).length,
      },
      null,
      2,
    )}\n`,
  );
  await browser.close();
}
if (failures.length > 0) process.exitCode = 1;

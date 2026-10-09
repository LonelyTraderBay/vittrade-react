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
const directory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const originUrl = new URL(origin);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(originUrl.hostname));
assert.equal(originUrl.pathname, '/');

const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/wallet-error-current-head-browser-check-${runId}.json`;
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-wallet-error-current-head-browser-check.mjs';
const screenshotNames = [
  `preview-wallet-error-overview-${runId}.png`,
  `preview-wallet-error-overview-retry-${runId}.png`,
  `preview-wallet-error-history-${runId}.png`,
  `preview-wallet-error-history-retry-${runId}.png`,
];
const sourcePaths = [
  'contracts/openapi/wallet.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/app/routes/walletProfileProtectedRoutes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/dev/mocks/trading-fixtures.ts',
  'src/features/wallet/api/wallet-api.ts',
  'src/features/wallet/model/wallet-queries.ts',
  'src/features/wallet/model/wallet-queries.test.tsx',
  'src/features/wallet/model/wallet-types.ts',
  'src/features/wallet/pages/WalletOverviewContractPage.tsx',
  'src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx',
  'src/shared/api/api-error.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/http-client.test.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/ui/ErrorState.tsx',
];
const sha256 = (relativePath) =>
  crypto
    .createHash('sha256')
    .update(fsSync.readFileSync(path.join(root, relativePath)))
    .digest('hex');

const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const expectedAttemptsPerQuery = Number(process.env.WALLET_ERROR_EXPECTED_ATTEMPTS ?? 6);
assert.ok(Number.isInteger(expectedAttemptsPerQuery) && expectedAttemptsPerQuery > 0);
const sourceHashes = Object.fromEntries(
  [...new Set([...sourcePaths, runnerRelativePath])]
    .sort()
    .map((relativePath) => [relativePath, sha256(relativePath)]),
);

const operationFor = (method, pathname) => {
  if (method !== 'GET') return null;
  if (pathname === '/api/wallet/assets') return 'getWalletAssets';
  if (pathname === '/api/wallet/transactions') return 'getWalletTransactions';
  return null;
};
const queryKeyFor = (operationId, query) =>
  operationId === 'getWalletTransactions' ? `${operationId}:${query.limit ?? ''}` : operationId;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const startedAt = Date.now();
const requests = [];
const responses = [];
const requestFailures = [];
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();
const externalResourceOrigins = new Set();
const externalRequests = [];
const pageErrors = [];
const requestStartedAt = new WeakMap();
const pendingWalletRequests = new Set();
const failures = [];
let initialSessionResponse = null;
let loginResponse = null;
let scenarioSelected = false;
let serviceWorkerControlled = false;
let overviewErrorVisible = false;
let historyErrorVisible = false;
let overviewStaleContentHidden = false;
let historyStaleContentHidden = false;
let overviewAttempts = null;
let overviewRetryAttempts = null;
let historyAttempts = null;
let historyRetryAttempts = null;

await page.addInitScript(() => {
  const originalFetch = window.fetch.bind(window);
  Object.defineProperty(window, '__walletTransportAttempts', {
    configurable: true,
    value: [],
  });
  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const url = new URL(requestUrl, window.location.href);
    const operationId =
      method === 'GET' && url.pathname === '/api/wallet/assets'
        ? 'getWalletAssets'
        : method === 'GET' && url.pathname === '/api/wallet/transactions'
          ? 'getWalletTransactions'
          : null;
    if (url.origin === window.location.origin && operationId) {
      window.__walletTransportAttempts.push({
        method,
        path: url.pathname,
        operationId,
        query: Object.fromEntries(url.searchParams.entries()),
        errorText: 'Failed to fetch',
        source: 'runner-scoped pre-network fetch rejection',
      });
      throw new TypeError('Failed to fetch');
    }
    return originalFetch(input, init);
  };
});

page.on('pageerror', (error) => pageErrors.push(error.message));
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
  const operationId = operationFor(request.method(), url.pathname);
  if (url.pathname.startsWith('/api/wallet/')) pendingWalletRequests.add(request);
  requests.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    resourceType: type,
    query: Object.fromEntries(url.searchParams.entries()),
  });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const request = response.request();
  pendingWalletRequests.delete(request);
  responses.push({
    operationId: operationFor(request.method(), url.pathname),
    method: request.method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    elapsedMs: Date.now() - (requestStartedAt.get(request) ?? Date.now()),
  });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  pendingWalletRequests.delete(request);
  requestFailures.push({
    operationId: operationFor(request.method(), url.pathname),
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown',
  });
});

const attemptCounts = async () =>
  page.evaluate(() => {
    const result = {};
    for (const item of window.__walletTransportAttempts) {
      const key =
        item.operationId === 'getWalletTransactions'
          ? `${item.operationId}:${item.query.limit ?? ''}`
          : item.operationId;
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  });
const navigateSpa = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};
const waitForAttemptCounts = async (targets) =>
  page.waitForFunction((expected) => {
    const counts = {};
    for (const item of window.__walletTransportAttempts) {
      const key =
        item.operationId === 'getWalletTransactions'
          ? `${item.operationId}:${item.query.limit ?? ''}`
          : item.operationId;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(expected).every(([key, value]) => (counts[key] ?? 0) >= value);
  }, targets);
const screenshot = (name) => path.join(directory, name);

try {
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  serviceWorkerControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
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
  await page.waitForURL('**/w/home');
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('wallet.error', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const overviewStartedAt = Date.now();
  await page.getByRole('button', { name: 'Ví', exact: true }).first().click();
  await page.waitForURL('**/w/wallet');
  await page.getByText('Unable to load wallet', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  await waitForAttemptCounts({
    getWalletAssets: expectedAttemptsPerQuery,
    'getWalletTransactions:10': expectedAttemptsPerQuery,
  });
  await page.waitForTimeout(100);
  overviewAttempts = await attemptCounts();
  overviewErrorVisible = true;
  overviewStaleContentHidden =
    (await page.getByText('$16,754.32', { exact: true }).count()) === 0 &&
    (await page.getByText('No wallet activity yet.', { exact: true }).count()) === 0 &&
    (await page.getByText('No assets match this filter.', { exact: true }).count()) === 0;
  assert.equal(overviewStaleContentHidden, true);
  const overviewInitialCounts = {
    getWalletAssets: overviewAttempts.getWalletAssets ?? 0,
    'getWalletTransactions:10': overviewAttempts['getWalletTransactions:10'] ?? 0,
  };
  assert.deepEqual(overviewInitialCounts, {
    getWalletAssets: expectedAttemptsPerQuery,
    'getWalletTransactions:10': expectedAttemptsPerQuery,
  });
  await page.screenshot({ path: screenshot(screenshotNames[0]), fullPage: true });

  await page.getByRole('button', { name: 'Thử lại' }).click();
  await waitForAttemptCounts({
    getWalletAssets: expectedAttemptsPerQuery * 2,
    'getWalletTransactions:10': expectedAttemptsPerQuery * 2,
  });
  await page.getByText('Unable to load wallet', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  overviewRetryAttempts = await attemptCounts();
  assert.deepEqual(
    {
      getWalletAssets:
        (overviewRetryAttempts.getWalletAssets ?? 0) - overviewInitialCounts.getWalletAssets,
      'getWalletTransactions:10':
        (overviewRetryAttempts['getWalletTransactions:10'] ?? 0) -
        overviewInitialCounts['getWalletTransactions:10'],
    },
    {
      getWalletAssets: expectedAttemptsPerQuery,
      'getWalletTransactions:10': expectedAttemptsPerQuery,
    },
  );
  await page.screenshot({ path: screenshot(screenshotNames[1]), fullPage: true });

  const historyStartedAt = Date.now();
  await navigateSpa('/w/wallet/history');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  await waitForAttemptCounts({
    'getWalletTransactions:50': expectedAttemptsPerQuery,
  });
  historyAttempts = await attemptCounts();
  historyErrorVisible = true;
  historyStaleContentHidden =
    (await page.getByText('6 transactions', { exact: true }).count()) === 0 &&
    (await page.getByText('P2P buy', { exact: false }).count()) === 0 &&
    (await page
      .getByText('No transactions match the selected filters.', { exact: true })
      .count()) === 0;
  assert.equal(historyStaleContentHidden, true);
  const historyInitialCount = historyAttempts['getWalletTransactions:50'] ?? 0;
  assert.equal(historyInitialCount, expectedAttemptsPerQuery);
  await page.screenshot({ path: screenshot(screenshotNames[2]), fullPage: true });

  await page.getByRole('button', { name: 'Thử lại' }).click();
  await waitForAttemptCounts({
    'getWalletTransactions:50': expectedAttemptsPerQuery * 2,
  });
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  historyRetryAttempts = await attemptCounts();
  assert.equal(
    (historyRetryAttempts['getWalletTransactions:50'] ?? 0) - historyInitialCount,
    expectedAttemptsPerQuery,
  );
  await page.screenshot({ path: screenshot(screenshotNames[3]), fullPage: true });

  const injectedTransportAttempts = await page.evaluate(() => [
    ...window.__walletTransportAttempts,
  ]);
  const walletRequests = requests.filter((request) => request.path.startsWith('/api/wallet/'));
  const walletResponses = responses.filter((response) => response.path.startsWith('/api/wallet/'));
  const walletWrites = walletRequests.filter((request) => request.method !== 'GET');
  const walletFailures = requestFailures.filter((failure) =>
    failure.path.startsWith('/api/wallet/'),
  );
  const observedOperationIds = [
    ...new Set(injectedTransportAttempts.map((attempt) => attempt.operationId)),
  ].sort();
  assert.equal(serviceWorkerControlled, true);
  assert.deepEqual(observedOperationIds, ['getWalletAssets', 'getWalletTransactions']);
  assert.equal(
    walletRequests.length,
    0,
    'Injected TypeErrors must occur before browser network dispatch.',
  );
  assert.equal(
    walletResponses.length,
    0,
    'Statusless transport failures must not become HTTP responses.',
  );
  assert.equal(
    walletFailures.length,
    0,
    'The runner injects failures before browser network dispatch.',
  );
  assert.equal(walletWrites.length, 0);
  assert.equal(pendingWalletRequests.size, 0);
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);
  assert.equal(overviewErrorVisible, true);
  assert.equal(historyErrorVisible, true);
  assert.equal(overviewStaleContentHidden, true);
  assert.equal(historyStaleContentHidden, true);

  const scenario = {
    id: 'wallet.error',
    domain: 'wallet',
    state: 'error',
    status: 'passed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture with runner-scoped transport failure)',
    role: 'developer',
    route: '/w/wallet',
    finalRoute: '/w/wallet/history',
    operationIds: ['getWalletAssets', 'getWalletTransactions'],
    observedOperationIds,
    requests,
    responses,
    requestFailures,
    injectedTransportAttempts,
    initialSessionResponse: {
      status: initialSessionResponse.status(),
      fromServiceWorker: initialSessionResponse.fromServiceWorker(),
    },
    loginResponse: {
      status: loginResponse.status(),
      fromServiceWorker: loginResponse.fromServiceWorker(),
    },
    selectedScenario: scenarioSelected ? 'wallet.error' : null,
    walletEvidence: {
      requestCount: walletRequests.length,
      responseCount: walletResponses.length,
      writeRequestCount: walletWrites.length,
      requestFailureCount: walletFailures.length,
      injectedTransportFailureCount: injectedTransportAttempts.length,
      noHttpResponse: walletResponses.length === 0,
      expectedAttemptsPerQuery,
      overviewErrorVisible,
      overviewRetryPreservedError: true,
      overviewStaleContentHidden,
      overviewInitialAttempts: {
        getWalletAssets: overviewInitialCounts.getWalletAssets,
        getWalletTransactions: overviewInitialCounts['getWalletTransactions:10'],
      },
      overviewRetryAdditionalAttempts: {
        getWalletAssets:
          (overviewRetryAttempts.getWalletAssets ?? 0) - overviewInitialCounts.getWalletAssets,
        getWalletTransactions:
          (overviewRetryAttempts['getWalletTransactions:10'] ?? 0) -
          overviewInitialCounts['getWalletTransactions:10'],
      },
      historyErrorVisible,
      historyRetryPreservedError: true,
      historyStaleContentHidden,
      historyInitialAttempts: historyInitialCount,
      historyRetryAdditionalAttempts:
        (historyRetryAttempts['getWalletTransactions:50'] ?? 0) - historyInitialCount,
      overviewElapsedMs: Date.now() - overviewStartedAt,
      historyElapsedMs: Date.now() - historyStartedAt,
      pendingRequestCount: pendingWalletRequests.size,
    },
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    externalResourceOrigins: [...externalResourceOrigins],
    externalRequests,
    pageErrors,
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames,
    failures,
    note: 'Local Chromium/Vite/MSW Wallet error scenario. The two Wallet GET contracts do not declare a 5xx response, so the runner injects TypeError before network dispatch; no HTTP status/response is fabricated. Initial queries and explicit Retry remain visibly recoverable, stale fixture data and false empty states stay hidden, and no Wallet mutation is sent. This does not establish backend/staging behavior, authorization, production availability or user acceptance.',
  };
  const reportPath = path.join(root, reportRelativePath);
  const sidecar = {
    schemaVersion: 1,
    checkedAt,
    observedAt: scenario.observedAt,
    sourceHead,
    branch,
    origin,
    viewport: { width: 1440, height: 900 },
    fixtureBoundary: {
      serviceWorkerControlled,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      walletWriteRequestCount: walletWrites.length,
      transportFailureNoHttpResponse: true,
    },
    sourceHashes,
    scenario,
  };
  await fs.writeFile(
    reportPath,
    await prettier.format(JSON.stringify(sidecar), { parser: 'json' }),
  );
  process.stdout.write(
    `${JSON.stringify({ reportRelativePath, scenario: { ...scenario, injectedTransportAttempts: `${injectedTransportAttempts.length} attempts`, requests, responses }, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.stderr.write(`${failures.at(-1)}\n`);
  process.exitCode = 1;
} finally {
  await browser.close();
}

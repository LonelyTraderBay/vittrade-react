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
  'docs/architecture/production-readiness/evidence/A06/run-wallet-unauthorized-current-head-browser-check.mjs';
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/wallet-unauthorized-current-head-browser-check-${runId}.json`;
const screenshotNames = [
  `preview-wallet-unauthorized-overview-${runId}.png`,
  `preview-wallet-unauthorized-history-${runId}.png`,
];
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/wallet.yaml',
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/routeConfig.ts',
  'src/app/routes/walletProfileProtectedRoutes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/wallet/api/wallet-api.ts',
  'src/features/wallet/model/wallet-queries.ts',
  'src/features/wallet/model/wallet-types.ts',
  'src/features/wallet/pages/WalletOverviewContractPage.tsx',
  'src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
];
const readFile = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(readFile(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });
const walletContract = parse(
  await fs.readFile(path.join(root, 'contracts/openapi/wallet.yaml'), 'utf8'),
);
const walletOperations = Object.values(walletContract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) => operation.operationId);
const contract401OperationIds = walletOperations
  .filter((operation) => Object.hasOwn(operation.responses ?? {}, '401'))
  .map((operation) => operation.operationId)
  .sort();
assert.deepEqual(
  contract401OperationIds,
  ['getWalletAssets', 'getWalletTransactions', 'verifyWalletWithdrawalChallenge'].sort(),
);
const routeOperationIds = ['getWalletAssets', 'getWalletTransactions'];
const operationByPath = new Map(
  walletOperations.map((operation) => {
    const operationPath = Object.keys(walletContract.paths).find((candidate) =>
      Object.values(walletContract.paths[candidate]).includes(operation),
    );
    return [`/api${operationPath}`, operation.operationId];
  }),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ headless: true });
const startedAt = Date.now();
const routeObservations = [];
const failures = [];

async function observeRoute(route, screenshotName) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    const refreshFixtures = [];
    Object.defineProperty(window, '__vittradeWalletAuthRefreshFixtures', {
      configurable: false,
      value: refreshFixtures,
    });
    window.fetch = async (input, init) => {
      const inputUrl = input instanceof Request ? input.url : String(input);
      const url = new URL(inputUrl, window.location.href);
      const method = (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
      ).toUpperCase();
      if (url.pathname !== '/api/auth/refresh' || method !== 'POST') {
        return originalFetch(input, init);
      }
      refreshFixtures.push({
        method,
        path: url.pathname,
        status: 200,
        body: null,
        source: 'runner-local Auth OpenAPI fixture; request not sent to service worker or backend',
      });
      return new Response('null', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
  });
  const requests = [];
  const responses = [];
  const externalRequests = [];
  const externalApiOrigins = new Set();
  const externalAssetOrigins = new Set();
  const pageErrors = [];
  const requestStartedAt = new WeakMap();
  const pendingWalletRequests = new Set();
  let initialSessionResponse = null;
  let loginResponse = null;
  let loginPayload = null;
  let baselineAssets = null;
  let baselineHistory = null;
  let scenarioSelected = false;
  let finalRoute = null;
  let loginFormVisible = false;
  let protectedWalletContentVisible = null;
  const routeStartedAt = Date.now();

  page.on('request', (request) => {
    const url = new URL(request.url());
    const resourceType = request.resourceType();
    if (url.origin !== originUrl.origin) {
      externalRequests.push({ origin: url.origin, path: url.pathname, resourceType });
      if (['image', 'font', 'stylesheet'].includes(resourceType))
        externalAssetOrigins.add(url.origin);
      else if (url.pathname.startsWith('/api/')) externalApiOrigins.add(url.origin);
    }
    if (!url.pathname.startsWith('/api/')) return;
    requestStartedAt.set(request, Date.now());
    const operationId = operationByPath.get(url.pathname) ?? null;
    if (url.pathname.startsWith('/api/wallet/')) pendingWalletRequests.add(request);
    requests.push({
      operationId,
      method: request.method(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      resourceType,
    });
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    const request = response.request();
    const started = requestStartedAt.get(request);
    pendingWalletRequests.delete(request);
    responses.push({
      operationId: operationByPath.get(url.pathname) ?? null,
      method: request.method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      ...(started === undefined ? {} : { elapsedMs: Date.now() - started }),
    });
  });
  page.on('requestfailed', (request) => pendingWalletRequests.delete(request));
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    const sessionPromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/auth/session' &&
        response.request().method() === 'GET',
    );
    await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
    await page.getByTestId('auth-email').fill('developer@vittrade.local');
    await page.getByTestId('auth-password').fill('Preview-123!');
    const loginPromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/auth/login' &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('auth-submit').click();
    [initialSessionResponse, loginResponse] = await Promise.all([sessionPromise, loginPromise]);
    loginPayload = await loginResponse.json();
    await page.waitForURL('**/w/home');
    assert.equal(initialSessionResponse.status(), 401);
    assert.equal(loginResponse.status(), 200);
    assert.equal(loginResponse.fromServiceWorker(), true);

    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
    await page.getByLabel('Miền API').selectOption('wallet');
    await page.getByLabel('Trạng thái phản hồi').selectOption('success');
    await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
    await page.getByTestId('active-preview-scenario').getByText('wallet.success').waitFor();
    const assetsPromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/wallet/assets' &&
        response.request().method() === 'GET',
    );
    await page.evaluate(() => {
      window.history.pushState({}, '', '/w/wallet');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    const assetsResponse = await assetsPromise;
    baselineAssets = await assetsResponse.json();
    assert.equal(assetsResponse.status(), 200);
    assert.equal(assetsResponse.fromServiceWorker(), true);
    assert.ok(baselineAssets.items?.length > 0);
    await page.getByText('$16,754.32', { exact: true }).first().waitFor();
    await page.getByRole('button', { name: 'Transaction history', exact: true }).click();
    await page.waitForURL('**/w/wallet/history');
    const historyResponse = await page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/wallet/transactions' &&
        response.request().method() === 'GET' &&
        new URL(response.url()).searchParams.get('limit') === '50',
    );
    baselineHistory = await historyResponse.json();
    assert.equal(historyResponse.status(), 200);
    assert.equal(historyResponse.fromServiceWorker(), true);
    assert.ok(baselineHistory.items?.length > 0);
    const historyAssetMarker = String(baselineHistory.items[0].asset);
    await page.getByText(historyAssetMarker, { exact: true }).first().waitFor();

    await page.evaluate(() => {
      window.history.pushState({}, '', '/w/home');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
    await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
    await page.getByTestId('active-preview-scenario').getByText('wallet.unauthorized').waitFor();
    scenarioSelected = true;
    if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
      await page.getByRole('button', { name: 'Thu gọn' }).click();
    }
    await page.waitForTimeout(5_200);
    const refreshFixtureStart = await page.evaluate(
      () => window.__vittradeWalletAuthRefreshFixtures?.length ?? 0,
    );

    const expectedReads =
      route === '/w/wallet'
        ? [
            page.waitForResponse(
              (response) =>
                new URL(response.url()).pathname === '/api/wallet/assets' &&
                response.request().method() === 'GET' &&
                response.status() === 401,
            ),
            page.waitForResponse(
              (response) =>
                new URL(response.url()).pathname === '/api/wallet/transactions' &&
                response.request().method() === 'GET' &&
                new URL(response.url()).searchParams.get('limit') === '10' &&
                response.status() === 401,
            ),
          ]
        : [
            page.waitForResponse(
              (response) =>
                new URL(response.url()).pathname === '/api/wallet/transactions' &&
                response.request().method() === 'GET' &&
                new URL(response.url()).searchParams.get('limit') === '50' &&
                response.status() === 401,
            ),
          ];
    await page.evaluate((nextRoute) => {
      window.history.pushState({}, '', nextRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
    const unauthorizedResponses = await Promise.all(expectedReads);
    await page.waitForURL(/\/(?:w\/)?auth\/login$/, { timeout: 10_000 });
    await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
    await page.waitForTimeout(150);
    const authRefreshContractFixtures = await page.evaluate(
      (start) => window.__vittradeWalletAuthRefreshFixtures?.slice(start) ?? [],
      refreshFixtureStart,
    );
    finalRoute = new URL(page.url()).pathname;
    loginFormVisible = await page.getByTestId('auth-submit').isVisible();
    protectedWalletContentVisible = await page
      .getByText('$16,754.32', { exact: true })
      .isVisible()
      .catch(() => false);
    const staleMarkers = ['$16,754.32', historyAssetMarker];
    const staleMarkersVisible = Object.fromEntries(
      await Promise.all(
        staleMarkers.map(async (marker) => [
          marker,
          (await page.getByText(marker, { exact: true }).count()) > 0,
        ]),
      ),
    );
    await page.screenshot({ path: path.join(directory, screenshotName), fullPage: true });

    const walletRequests = requests.filter((request) => request.path.startsWith('/api/wallet/'));
    const walletWrites = walletRequests.filter((request) => request.method !== 'GET');
    const unauthorizedRouteResponses = responses.filter(
      (response) => routeOperationIds.includes(response.operationId) && response.status === 401,
    );
    const observation = {
      route,
      status: unauthorizedResponses.every((response) => response.fromServiceWorker())
        ? 'observed'
        : 'failed',
      unauthorizedResponses: unauthorizedResponses.map((response) => ({
        operationId: operationByPath.get(new URL(response.url()).pathname),
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      })),
      authRefreshContractFixtures,
      finalRoute,
      loginFormVisible,
      protectedWalletContentVisible,
      staleMarkersVisible,
      walletWrites: walletWrites.length,
      pendingWalletRequests: pendingWalletRequests.size,
      screenshot: screenshotName,
      elapsedMs: Date.now() - routeStartedAt,
    };
    assert.equal(scenarioSelected, true);
    assert.equal(
      unauthorizedResponses.every((response) => response.fromServiceWorker()),
      true,
    );
    assert.equal(authRefreshContractFixtures.length, unauthorizedResponses.length);
    assert.equal(
      authRefreshContractFixtures.every(
        (fixture) => fixture.status === 200 && fixture.body === null,
      ),
      true,
    );
    assert.match(finalRoute, /\/(?:w\/)?auth\/login$/);
    assert.equal(loginFormVisible, true);
    assert.equal(protectedWalletContentVisible, false);
    assert.equal(
      Object.values(staleMarkersVisible).every((visible) => !visible),
      true,
    );
    assert.equal(walletWrites.length, 0);
    assert.equal(pendingWalletRequests.size, 0);
    assert.equal(externalApiOrigins.size, 0);
    assert.deepEqual(pageErrors, []);
    assert.ok(unauthorizedRouteResponses.length >= unauthorizedResponses.length);
    routeObservations.push({
      ...observation,
      requests,
      traceResponses: responses,
      baseline: {
        assetCount: baselineAssets.items.length,
        totalUsd: baselineAssets.summary?.totalUsd ?? null,
        historyTransactionCount: baselineHistory.total ?? baselineHistory.items.length,
        historyAssetMarker,
      },
      initialSessionResponse: initialSessionResponse.status(),
      loginResponse: loginResponse.status(),
      externalApiOrigins: [...externalApiOrigins],
      externalAssetOrigins: [...externalAssetOrigins],
      externalRequests,
      pageErrors,
    });
  } catch (error) {
    failures.push({
      route,
      message: error instanceof Error ? (error.stack ?? error.message) : String(error),
      requests,
      responses,
      pageErrors,
    });
    if (!fsSync.existsSync(path.join(directory, screenshotName))) {
      await page
        .screenshot({ path: path.join(directory, screenshotName), fullPage: true })
        .catch(() => {});
    }
  } finally {
    await context.close();
  }
}

try {
  await observeRoute('/w/wallet', screenshotNames[0]);
  await observeRoute('/w/wallet/history', screenshotNames[1]);
} finally {
  const walletResponses = routeObservations.flatMap((observation) =>
    observation.unauthorizedResponses.map((response) => response),
  );
  const walletWriteCount = routeObservations.reduce((count, item) => count + item.walletWrites, 0);
  const allProtectedViewsHidden =
    routeObservations.length === 2 &&
    routeObservations.every(
      (observation) =>
        observation.loginFormVisible &&
        !observation.protectedWalletContentVisible &&
        Object.values(observation.staleMarkersVisible).every((visible) => !visible),
    );
  const allReadsContract401 = walletResponses.every(
    (response) => response.status === 401 && contract401OperationIds.includes(response.operationId),
  );
  const scenario = {
    id: 'wallet.unauthorized',
    domain: 'wallet',
    state: 'unauthorized',
    status:
      failures.length === 0 &&
      routeObservations.length === 2 &&
      allReadsContract401 &&
      allProtectedViewsHidden &&
      walletWriteCount === 0
        ? 'passed'
        : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'developer',
    permissions: ['wallet:read', 'wallet:write'],
    routes: ['/w/wallet', '/w/wallet/history'],
    operationIds: routeOperationIds,
    observedOperationIds: [...new Set(walletResponses.map((response) => response.operationId))]
      .filter(Boolean)
      .sort(),
    declared401OperationIds: contract401OperationIds,
    routeObservations,
    acceptance: {
      contractSupportedWalletReadsOnly: allReadsContract401,
      sessionRedirectOnBothRoutes:
        routeObservations.length === 2 &&
        routeObservations.every((observation) =>
          /\/(?:w\/)?auth\/login$/.test(observation.finalRoute),
        ),
      staleWalletDataHiddenOnBothRoutes: allProtectedViewsHidden,
      walletWriteRequestCount: walletWriteCount,
      allWalletUnauthorizedResponsesFromServiceWorker: walletResponses.every(
        (response) => response.fromServiceWorker,
      ),
    },
    elapsedMs: Date.now() - startedAt,
    failures,
    screenshots: screenshotNames,
    knownContractLimitations: [
      'Only getWalletAssets and getWalletTransactions are exercised; verifyWalletWithdrawalChallenge also declares 401 but is not called because it is a mutation.',
      'Auth refresh fixtures return the declared 200/null response before service-worker/backend dispatch. The runner measures local session and route behavior, not a backend refresh implementation.',
      'No backend, staging, production authorization or user acceptance is certified by this local MSW run.',
    ],
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...sourcePaths, runnerRelativePath])]
      .sort()
      .map((relativePath) => [relativePath, sha256(relativePath)]),
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
      allObservedResponsesFromServiceWorker: routeObservations.every((item) =>
        item.traceResponses.every((response) => response.fromServiceWorker),
      ),
      allWalletResponsesFromServiceWorker: walletResponses.every(
        (response) => response.fromServiceWorker,
      ),
      authRefreshFixtureResponsesAreNotNetworkRequests: true,
      authRefreshContractFixtureCount: routeObservations.reduce(
        (count, item) => count + item.authRefreshContractFixtures.length,
        0,
      ),
      externalApiOrigins: [
        ...new Set(routeObservations.flatMap((item) => item.externalApiOrigins)),
      ],
      realBackendRequestSent: false,
      walletWriteRequestCount: walletWriteCount,
    },
    sourceHashes,
    scenario,
  };
  const reportPath = path.join(root, reportRelativePath);
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));
  process.stdout.write(
    `${JSON.stringify(
      {
        reportRelativePath,
        status: scenario.status,
        observedOperationIds: scenario.observedOperationIds,
        declared401OperationIds: contract401OperationIds,
        observations: routeObservations.map(
          ({
            route,
            status,
            unauthorizedResponses,
            finalRoute,
            loginFormVisible,
            staleMarkersVisible,
            elapsedMs,
            screenshot,
          }) => ({
            route,
            status,
            responses: unauthorizedResponses,
            finalRoute,
            loginFormVisible,
            staleMarkersVisible,
            elapsedMs,
            screenshot,
          }),
        ),
        acceptance: scenario.acceptance,
        elapsedMs: scenario.elapsedMs,
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

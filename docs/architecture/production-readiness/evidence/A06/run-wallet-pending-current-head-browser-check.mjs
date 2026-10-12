import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const directory = path.dirname(fileURLToPath(import.meta.url));
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname));
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be a loopback origin without a path.');
const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-wallet-pending-current-head-browser-check.mjs';
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/wallet-pending-current-head-browser-check-${runId}.json`;
const screenshotNames = [
  `preview-wallet-pending-transfer-inflight-${runId}.png`,
  `preview-wallet-pending-transfer-receipt-${runId}.png`,
];
const runnerHoldConfiguredMs = 2_000;
const sourcePaths = [
  'contracts/openapi/wallet.yaml',
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json',
  'src/app/routes.ts',
  'src/app/routes/walletProfileProtectedRoutes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/wallet/api/wallet-api.test.ts',
  'src/features/wallet/api/wallet-api.ts',
  'src/features/wallet/model/wallet-queries.test.tsx',
  'src/features/wallet/model/wallet-queries.ts',
  'src/features/wallet/model/wallet-types.ts',
  'src/features/wallet/pages/WalletTransferContractPage.test.tsx',
  'src/features/wallet/pages/WalletTransferContractPage.tsx',
  'src/features/wallet/routes.ts',
  'src/main.tsx',
  runnerRelativePath,
];
const sha256 = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, relativePath)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourcePaths.map(async (relativePath) => [relativePath, await sha256(relativePath)]),
  ),
);
const operationMap = JSON.parse(
  await fs.readFile(
    path.join(
      root,
      'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json',
    ),
    'utf8',
  ),
);
const walletOperations = operationMap.operations.filter(
  (operation) => operation.domain === 'wallet',
);
const operationFor = (method, pathname) =>
  walletOperations.find(
    (operation) => operation.method === method && pathname.endsWith(operation.path),
  )?.operationId ?? null;
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const screenshots = screenshotNames.map((name) => path.join(directory, name));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15_000);
const requests = [];
const responses = [];
const requestFailures = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const requestStartedAt = new WeakMap();
const startedAt = Date.now();
const walletRoute = '/w/wallet/transfer';
let initialSessionResponse;
let loginResponse;
let loginPayload;
let selectedScenario = false;
let serviceWorkerControlled = false;
let transferResponse;
let transferReceipt;
let transferRequestBody;
let idempotencyKey = '';
let inFlightVisibleMs;
let inFlightButtonDisabled = false;
let pendingReceiptVisible = false;
let duplicateSubmitBlocked = false;
let responseTimeMs;
let inFlightButtonPresentation;
let runnerHoldMs;
let uiMutationPendingMs;

await page.addInitScript((holdMs) => {
  const originalFetch = window.fetch.bind(window);
  const holdState = { configuredMs: holdMs, count: 0, elapsedMs: null };
  Object.defineProperty(window, '__walletTransferRunnerHold', {
    configurable: true,
    value: holdState,
  });
  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const pathname = new URL(requestUrl, window.location.href).pathname;
    const response = await originalFetch(input, init);
    if (method === 'POST' && pathname === '/api/wallet/transfers') {
      holdState.count += 1;
      const startedAt = Date.now();
      await new Promise((resolve) => setTimeout(resolve, holdMs));
      holdState.elapsedMs = Date.now() - startedAt;
    }
    return response;
  };
}, runnerHoldConfiguredMs);

page.on('request', (request) => {
  const url = new URL(request.url());
  requestStartedAt.set(request, Date.now());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    url.pathname.startsWith('/api/')
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  const operationId = operationFor(request.method(), url.pathname);
  const record = {
    operationId,
    method: request.method(),
    path: url.pathname,
  };
  if (request.method() === 'POST' && url.pathname === '/api/wallet/transfers') {
    transferRequestBody = request.postDataJSON();
    idempotencyKey = request.headers()['idempotency-key'] ?? '';
  }
  requests.push(record);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const operationId = operationFor(response.request().method(), url.pathname);
  const started = requestStartedAt.get(response.request());
  const record = {
    operationId,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(started === undefined ? {} : { elapsedMs: Date.now() - started }),
  };
  responses.push(record);
  if (url.pathname === '/api/wallet/transfers' && response.request().method() === 'POST') {
    responseTimeMs = record.elapsedMs;
  }
});
page.on('requestfailed', (request) => {
  if (new URL(request.url()).pathname.startsWith('/api/')) {
    requestFailures.push({
      method: request.method(),
      path: new URL(request.url()).pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function openPreviewControls() {
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
}

async function applyScenario() {
  await openPreviewControls();
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  selectedScenario = await page
    .getByTestId('active-preview-scenario')
    .getByText('wallet.pending', { exact: true })
    .isVisible();
  assert.equal(selectedScenario, true);
}

async function signInAsWalletPersona() {
  await page.getByTestId('auth-email').fill('wallet@vittrade.local');
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
}

async function collapsePreviewControls() {
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
}

try {
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  initialSessionResponse = await sessionPromise;
  assert.equal(initialSessionResponse.fromServiceWorker(), true);
  await applyScenario();
  await signInAsWalletPersona();
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  const permissions = loginPayload.session.user.permissions;
  assert.ok(permissions.includes('wallet:read'));
  assert.ok(permissions.includes('wallet:transfer'));
  serviceWorkerControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
  assert.equal(serviceWorkerControlled, true);
  await collapsePreviewControls();

  const accountAndAssetResponsePromises = ['/api/wallet/accounts', '/api/wallet/assets'].map(
    (pathname) =>
      page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === pathname && response.request().method() === 'GET',
      ),
  );
  await page.evaluate((pathname) => {
    window.history.pushState({}, '', pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, walletRoute);
  await page.waitForURL((url) => url.pathname === walletRoute);
  const accountAndAssetResponses = await Promise.all(accountAndAssetResponsePromises);
  assert.ok(accountAndAssetResponses.every((response) => response.status() === 200));
  assert.ok(accountAndAssetResponses.every((response) => response.fromServiceWorker()));
  await page.getByLabel('Transfer amount').waitFor();

  await page.getByLabel('Transfer amount').fill('12.5');
  let transferPromiseFailure = null;
  const transferPromise = page
    .waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/wallet/transfers' &&
        response.request().method() === 'POST',
    )
    .catch((error) => {
      transferPromiseFailure = error;
      return null;
    });
  const submit = page.getByTestId('wallet-transfer-submit');
  const submitStartedAt = Date.now();
  await submit.click();
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="wallet-transfer-submit"]');
    return button?.disabled && button.getAttribute('aria-busy') === 'true';
  });
  inFlightVisibleMs = Date.now() - submitStartedAt;
  inFlightButtonDisabled = await submit.isDisabled();
  assert.equal(inFlightButtonDisabled, true);
  await page.getByRole('button', { name: 'Submitting transfer…' }).waitFor();
  inFlightButtonPresentation = await submit.evaluate((button) => {
    const label = [...button.querySelectorAll('span')].find(
      (span) => span.childElementCount === 0 && span.textContent?.includes('Submitting transfer'),
    );
    return {
      text: button.innerText,
      color: getComputedStyle(button).color,
      labelColor: label ? getComputedStyle(label).color : null,
      labelOpacity: label ? getComputedStyle(label).opacity : null,
      labelVisibility: label ? getComputedStyle(label).visibility : null,
    };
  });
  assert.notEqual(
    inFlightButtonPresentation.labelColor,
    'rgb(255, 255, 255)',
    'The in-flight label must contrast with the disabled button surface.',
  );
  await page.screenshot({ path: screenshots[0], fullPage: true });

  await page.waitForTimeout(250);
  const transferRequestCountWhilePending = requests.filter(
    (request) => request.method === 'POST' && request.path === '/api/wallet/transfers',
  ).length;
  assert.equal(transferRequestCountWhilePending, 1);

  transferResponse = await transferPromise;
  assert.ok(transferResponse, transferPromiseFailure?.message ?? 'Transfer response was not seen.');
  await page.waitForFunction(() => window.__walletTransferRunnerHold?.elapsedMs !== null);
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="wallet-transfer-submit"]');
    return button?.disabled && button.getAttribute('aria-busy') !== 'true';
  });
  const runnerHoldState = await page.evaluate(() => window.__walletTransferRunnerHold);
  runnerHoldMs = runnerHoldState.elapsedMs;
  uiMutationPendingMs = Date.now() - submitStartedAt;
  assert.equal(runnerHoldState.configuredMs, runnerHoldConfiguredMs);
  assert.equal(runnerHoldState.count, 1);
  assert.ok((runnerHoldMs ?? 0) >= 1_900 && (runnerHoldMs ?? 0) < 8_000);
  transferReceipt = await transferResponse.json();
  assert.equal(transferResponse.status(), 201);
  assert.equal(transferResponse.fromServiceWorker(), true);
  assert.ok((responseTimeMs ?? 0) >= 0 && (responseTimeMs ?? 0) < 1_500);
  assert.match(idempotencyKey, /^wallet-transfer-/);
  assert.ok(idempotencyKey.length >= 16);
  assert.deepEqual(transferRequestBody, {
    fromWallet: 'spot',
    toWallet: 'funding',
    asset: 'USDT',
    amount: 12.5,
  });
  assert.deepEqual(transferReceipt, {
    ...transferRequestBody,
    id: transferReceipt.id,
    status: 'pending',
    createdAt: transferReceipt.createdAt,
  });
  assert.match(transferReceipt.id, /^preview-wallet-transfer-/);
  assert.ok(Number.isFinite(Date.parse(transferReceipt.createdAt)));
  assert.equal('transactionId' in transferReceipt, false);

  const pendingStatus = page.locator('[role="status"]').filter({ hasText: 'Transfer pending' });
  await pendingStatus.waitFor();
  await page.getByText(`Reference ${transferReceipt.id}`, { exact: false }).waitFor();
  pendingReceiptVisible = true;
  assert.equal(await submit.isDisabled(), true);
  await page.evaluate(() => {
    document.querySelector('[data-testid="wallet-transfer-submit"]')?.click();
  });
  await page.waitForTimeout(250);
  duplicateSubmitBlocked =
    requests.filter(
      (request) => request.method === 'POST' && request.path === '/api/wallet/transfers',
    ).length === 1;
  assert.equal(duplicateSubmitBlocked, true);
  await page.screenshot({ path: screenshots[1], fullPage: true });

  const transferRequests = requests.filter(
    (request) => request.method === 'POST' && request.path === '/api/wallet/transfers',
  );
  const withdrawalRequests = requests.filter((request) =>
    request.path.includes('/api/wallet/withdrawals'),
  );
  const walletResponses = responses.filter((response) => response.path.startsWith('/api/wallet/'));
  const observedSupportingOperations = [
    ...new Set(
      requests
        .filter((request) => ['getWalletAccounts', 'getWalletAssets'].includes(request.operationId))
        .map((request) => request.operationId),
    ),
  ];
  assert.equal(transferRequests.length, 1);
  assert.equal(withdrawalRequests.length, 0);
  assert.equal(
    walletResponses.filter((response) => response.path === '/api/wallet/transfers').length,
    1,
  );
  assert.ok(walletResponses.every((response) => response.fromServiceWorker));
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(requestFailures, []);
  assert.deepEqual(pageErrors, []);

  const report = {
    schemaVersion: 1,
    checkedAt,
    observedAt: new Date().toISOString(),
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    fixtureBoundary: {
      serviceWorkerControlled,
      allWalletResponsesFromServiceWorker: walletResponses.every(
        (response) => response.fromServiceWorker,
      ),
      allObservedResponsesFromServiceWorker: responses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      walletWriteRequestCount: transferRequests.length,
      withdrawalRequestCount: withdrawalRequests.length,
    },
    sourceHashes,
    scenario: {
      id: 'wallet.pending',
      domain: 'wallet',
      state: 'pending',
      status: 'passed',
      observedAt: new Date().toISOString(),
      persona: 'wallet (local MSW fixture)',
      role: 'wallet',
      permissions,
      route: walletRoute,
      finalRoute: new URL(page.url()).pathname,
      operationIds: ['createWalletTransfer'],
      observedOperationIds: ['createWalletTransfer'],
      supportingOperationIds: observedSupportingOperations,
      expectedDomainOperationCount: walletOperations.length,
      coverage: 'representative_browser_observed',
      operationRequestCounts: Object.fromEntries(
        walletOperations.map((operation) => [
          operation.operationId,
          requests.filter((request) => request.operationId === operation.operationId).length,
        ]),
      ),
      requests,
      responses,
      transfer: {
        httpStatus: transferResponse.status(),
        receiptStatus: transferReceipt.status,
        receiptReference: transferReceipt.id,
        transactionIdReturned: false,
        idempotencyKeyPresent: true,
        idempotencyKeyLength: idempotencyKey.length,
        idempotencyKeyPrefix: 'wallet-transfer-',
        requestBody: transferRequestBody,
        requestCount: transferRequests.length,
        inFlightButtonDisabled,
        inFlightLabel: 'Submitting transfer…',
        inFlightButtonPresentation,
        inFlightVisibleMs,
        runnerHoldConfiguredMs,
        runnerHoldMs,
        uiMutationPendingMs,
        responseTimeMs,
        pendingReceiptVisible,
        duplicateSubmitBlocked,
      },
      externalApiOrigins: [...externalApiOrigins],
      pageErrors,
      requestFailures,
      elapsedMs: Date.now() - startedAt,
      screenshots: screenshotNames,
      note: 'Local Chromium/Vite/MSW only. The browser runner holds the service-worker-resolved transfer response for 2 seconds before delivering it to the UI, keeping the mutation promise pending while one POST receives a local contract-shaped HTTP 201 receipt with mock status pending. The measured request response time is local MSW timing; the runner hold is test harness time. This does not establish backend latency or pending semantics, backend authorization, reconciliation, production behavior or user acceptance. No withdrawal/challenge/verification or transaction lookup was requested; the transfer receipt id is not treated as a transaction id.',
    },
  };
  const reportPath = path.join(root, reportRelativePath);
  const formattedReport = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
    ...((await prettier.resolveConfig(reportPath)) ?? {}),
    parser: 'json',
  });
  await fs.writeFile(reportPath, formattedReport);
  console.log(
    JSON.stringify(
      {
        status: 'passed',
        report: reportRelativePath,
        screenshots: screenshotNames,
        transferRequestCount: transferRequests.length,
        httpStatus: transferResponse.status(),
        receiptStatus: transferReceipt.status,
        runnerHoldMs,
        responseTimeMs,
        sourceHashCount: Object.keys(sourceHashes).length,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await Promise.all(screenshots.map((screenshot) => fs.rm(screenshot, { force: true })));
  throw error;
} finally {
  await browser.close();
}

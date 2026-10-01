import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const previewUrl = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(previewUrl.hostname),
  'This check is restricted to a loopback preview.',
);
assert.equal(previewUrl.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');
const origin = previewUrl.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const screenshotPaths = {
  placePending: path.join(directory, `preview-trading-pending-place-${date}.png`),
  modifyPending: path.join(directory, `preview-trading-pending-modify-${date}.png`),
  cancelPending: path.join(directory, `preview-trading-pending-cancel-${date}.png`),
  historyAfterCancel: path.join(directory, `preview-trading-pending-history-${date}.png`),
};
const reportPath = path.join(directory, `trading-pending-browser-check-${date}.json`);
const sourceFiles = [
  'contracts/openapi/trading.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/features/trading/components/TradeTerminal.tsx',
  'src/features/trading/components/TradingOrderEntryPanel.tsx',
  'src/features/trading/components/OrderConfirmationSheet.tsx',
  'src/features/trading/components/OpenOrdersPanel.tsx',
  'src/features/trading/components/OrderModifySheet.tsx',
  'src/features/trading/components/OrderHistoryPanel.tsx',
  'src/features/trading/model/trading-queries.ts',
  'src/features/trading/api/trading-api.ts',
  'src/shared/api/http-client.ts',
  'docs/architecture/production-readiness/evidence/A06/generate-scenario-matrix.mjs',
  'docs/architecture/production-readiness/evidence/A06/run-trading-pending-browser-check.mjs',
];
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (file) => [
      file,
      createHash('sha256')
        .update(await fs.readFile(path.join(root, file)))
        .digest('hex'),
    ]),
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const contract = parse(
  await fs.readFile(path.join(root, 'contracts/openapi/trading.yaml'), 'utf8'),
);
const operationContracts = new Map();
for (const [apiPath, pathItem] of Object.entries(contract.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (operation && typeof operation === 'object' && operation.operationId) {
      operationContracts.set(operation.operationId, {
        method: method.toUpperCase(),
        path: apiPath,
        responses: Object.keys(operation.responses ?? {}),
        idempotencyKeyRequired:
          operation.parameters?.some(
            (parameter) => parameter.name === 'Idempotency-Key' && parameter.required,
          ) ?? false,
      });
    }
  }
}
const matrix = JSON.parse(
  await fs.readFile(
    path.join(
      root,
      'docs/architecture/production-readiness/evidence/A06/scenario-matrix-2026-09-28.json',
    ),
    'utf8',
  ),
);
const matrixScenario = matrix.domains
  .find((domain) => domain.domain === 'trading')
  ?.scenarios.find((scenario) => scenario.id === 'trading.pending');
const expectedOperationIds = matrixScenario?.operationIds ?? [];
assert.deepEqual(
  [...expectedOperationIds].sort(),
  ['cancelOrder', 'listOpenOrders', 'listOrderHistory', 'modifyOrder', 'placeOrder'].sort(),
);
for (const operationId of ['placeOrder', 'modifyOrder', 'cancelOrder'])
  assert.equal(operationContracts.get(operationId)?.idempotencyKeyRequired, true);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const apiRequests = [];
const apiResponses = [];
const apiFailures = [];
const pageErrors = [];
const externalApiOrigins = new Set();
const requestRecords = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];
const classifyOperation = (method, pathname) => {
  if (method === 'GET' && pathname === '/api/trading/orders') return 'listOpenOrders';
  if (method === 'POST' && pathname === '/api/trading/orders') return 'placeOrder';
  if (method === 'GET' && pathname === '/api/trading/orders/history') return 'listOrderHistory';
  if (method === 'PATCH' && /^\/api\/trading\/orders\/[^/]+$/.test(pathname)) return 'modifyOrder';
  if (method === 'POST' && /^\/api\/trading\/orders\/[^/]+\/cancel$/.test(pathname))
    return 'cancelOrder';
  return null;
};
function summarizeBody(body) {
  if (!body || typeof body !== 'object') return body ?? null;
  const result = {};
  for (const key of ['id', 'status', 'symbol', 'side', 'type', 'price', 'amount'])
    if (body[key] !== undefined) result[key] = body[key];
  if (Array.isArray(body.items)) {
    result.itemCount = body.items.length;
    result.items = body.items.map((item) => ({ id: item.id, status: item.status }));
  }
  return result;
}
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const headers = request.headers();
  const idempotencyKey = headers['idempotency-key'];
  const record = {
    method: request.method(),
    path: url.pathname,
    operationId: classifyOperation(request.method(), url.pathname),
    routeAtRequest: new URL(page.url()).pathname,
    startedAt: Date.now(),
    idempotencyKeyPresent: Boolean(idempotencyKey),
    idempotencyKeyLength: idempotencyKey?.length ?? 0,
    idempotencyKeyHash: idempotencyKey
      ? createHash('sha256').update(idempotencyKey).digest('hex')
      : null,
  };
  requestRecords.set(request, record);
  apiRequests.push(record);
  if (url.pathname.startsWith('/api/trading/') && !record.operationId)
    record.unexpectedTradingRequest = true;
  if (url.origin !== origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  responseTasks.push(
    (async () => {
      const url = new URL(response.url());
      if (!url.pathname.startsWith('/api/')) return;
      const request = response.request();
      requestsWithResponse.add(request);
      const record = requestRecords.get(request);
      const parsedBody = await response.json().catch(() => null);
      apiResponses.push({
        method: request.method(),
        path: url.pathname,
        operationId: record?.operationId ?? null,
        status: response.status(),
        fromServiceWorker: await response.fromServiceWorker(),
        elapsedMs: Date.now() - (record?.startedAt ?? Date.now()),
        body: summarizeBody(parsedBody),
      });
    })(),
  );
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiFailures.push({
    method: request.method(),
    path: url.pathname,
    operationId: classifyOperation(request.method(), url.pathname),
    failure: request.failure()?.errorText ?? 'unknown',
    hadResponse: requestsWithResponse.has(request),
    routeAtRequest: requestRecords.get(request)?.routeAtRequest ?? null,
    routeAtFailure: new URL(page.url()).pathname,
  });
});
const waitFor = async (predicate, description, timeoutMs = 15_000) => {
  const deadline = Date.now() + timeoutMs;
  while (!(await predicate()) && Date.now() < deadline) await page.waitForTimeout(25);
  assert.ok(await predicate(), `Timed out waiting for ${description}.`);
};
const requestsFor = (operationId) =>
  apiRequests.filter((record) => record.operationId === operationId);
const responsesFor = (operationId) =>
  apiResponses.filter((record) => record.operationId === operationId);
const pendingStates = {};
const tradingWrites = [];
const startedAt = Date.now();
try {
  await page.goto(`${origin}/w/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="dev-preview-controls"]').waitFor();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker?.controller)), true);
  const expandPreview = page.getByRole('button', { name: 'Mở công cụ xem trước' });
  if (await expandPreview.count()) await expandPreview.click();
  await page.locator('#preview-persona').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page
    .locator('[data-testid="dev-preview-controls"]')
    .getByText('developer@vittrade.local')
    .waitFor();
  await page.locator('#preview-domain').selectOption('trading');
  await page.locator('#preview-state').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.pending').waitFor();
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/btcusdt');
  await page.waitForURL((url) => url.pathname === '/w/trade/btcusdt');
  await page.locator('#trade-limit-price').waitFor({ state: 'visible' });
  await page.locator('#trade-limit-price').fill('50000');
  await page.getByTestId('trade-amount').fill('0.01');
  await page.getByRole('button', { name: 'Đặt lệnh mua BTC/USDT' }).click();
  await page.getByTestId('trade-confirm-submit').waitFor({ state: 'visible' });
  await page.getByTestId('trade-confirm-submit').click();
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="trade-confirm-submit"]');
    return (
      button instanceof HTMLButtonElement &&
      button.disabled &&
      button.textContent?.includes('Đang đặt lệnh')
    );
  });
  assert.equal(await page.getByTestId('trade-confirm-submit').getAttribute('aria-busy'), 'true');
  await waitFor(() => requestsFor('placeOrder').length === 1, 'placeOrder request');
  const placeRequest = requestsFor('placeOrder')[0];
  const placePendingCapturedAt = Date.now();
  assert.equal(placeRequest.idempotencyKeyPresent, true);
  assert.equal(
    responsesFor('placeOrder').length,
    0,
    'Place response must remain unresolved while the UI is pending.',
  );
  pendingStates.placeOrder = {
    visible: true,
    actionDisabled: true,
    responseUnsettledAtCapture: true,
    pendingUiElapsedMs: placePendingCapturedAt - placeRequest.startedAt,
    screenshot: path.basename(screenshotPaths.placePending),
  };
  await page.screenshot({ path: screenshotPaths.placePending, fullPage: true });
  await waitFor(() => responsesFor('placeOrder').length === 1, 'placeOrder response');
  await Promise.all(responseTasks);
  const placeResponse = responsesFor('placeOrder')[0];
  assert.equal(placeResponse.status, 201);
  const orderId = placeResponse.body?.id;
  assert.ok(orderId, 'Place response must include the stable order reference.');
  assert.equal(placeResponse.body?.status, 'open');
  await page.waitForURL((url) => url.pathname.endsWith('/trade/order-receipt'));
  const receiptId = page.getByText(orderId, { exact: true });
  await receiptId.waitFor({ state: 'visible' });
  const receiptVisible = (await receiptId.textContent())?.includes(orderId) ?? false;
  assert.equal(receiptVisible, true);

  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/btcusdt');
  await page.waitForURL((url) => url.pathname === '/w/trade/btcusdt');
  await page.getByRole('tab', { name: /^Đang mở/ }).click();
  const cancelOrderButton = page.getByTestId(`cancel-order-${orderId}`);
  await cancelOrderButton.waitFor({ state: 'visible' });
  await waitFor(
    () =>
      responsesFor('listOpenOrders').some((response) =>
        response.body?.items?.some((item) => item.id === orderId && item.status === 'open'),
      ),
    'created order in open-order read',
  );
  const modifyButton = cancelOrderButton.locator('xpath=preceding-sibling::button[1]');
  await modifyButton.click();
  await page.getByTestId('trade-modify-price').fill('51000');
  await page.getByTestId('trade-modify-amount').fill('0.01');
  await page.getByTestId('trade-modify-submit').click();
  await waitFor(() => requestsFor('modifyOrder').length === 1, 'modifyOrder request');
  const modifyRequest = requestsFor('modifyOrder')[0];
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="trade-modify-submit"]');
    return button instanceof HTMLButtonElement && button.disabled;
  });
  assert.match((await page.getByTestId('trade-modify-submit').textContent()) ?? '', /Đang lưu/);
  assert.equal(await page.getByTestId('trade-modify-submit').getAttribute('aria-busy'), 'true');
  assert.equal(modifyRequest.idempotencyKeyPresent, true);
  assert.equal(
    responsesFor('modifyOrder').length,
    0,
    'Modify response must remain unresolved while the UI is pending.',
  );
  const modifyPendingCapturedAt = Date.now();
  pendingStates.modifyOrder = {
    visible: true,
    actionDisabled: true,
    responseUnsettledAtCapture: true,
    pendingUiElapsedMs: modifyPendingCapturedAt - modifyRequest.startedAt,
    screenshot: path.basename(screenshotPaths.modifyPending),
  };
  await page.screenshot({ path: screenshotPaths.modifyPending, fullPage: true });
  await waitFor(() => responsesFor('modifyOrder').length === 1, 'modifyOrder response');
  await Promise.all(responseTasks);
  const modifyResponse = responsesFor('modifyOrder')[0];
  assert.equal(modifyResponse.status, 200);
  assert.equal(modifyResponse.body?.id, orderId);
  assert.equal(modifyResponse.body?.status, 'open');
  assert.equal(modifyResponse.body?.price, 51000);
  await page.getByTestId('trade-modify-submit').waitFor({ state: 'detached' });

  const currentCancelButton = page.getByTestId(`cancel-order-${orderId}`);
  await currentCancelButton.waitFor({ state: 'visible' });
  await currentCancelButton.click();
  await waitFor(() => requestsFor('cancelOrder').length === 1, 'cancelOrder request');
  const cancelRequest = requestsFor('cancelOrder')[0];
  await waitFor(() => currentCancelButton.isDisabled(), 'disabled cancel action');
  assert.match((await currentCancelButton.textContent()) ?? '', /Đang hủy/);
  assert.equal(await currentCancelButton.getAttribute('aria-busy'), 'true');
  assert.equal(cancelRequest.idempotencyKeyPresent, true);
  assert.equal(
    responsesFor('cancelOrder').length,
    0,
    'Cancel response must remain unresolved while the UI is pending.',
  );
  const cancelPendingCapturedAt = Date.now();
  pendingStates.cancelOrder = {
    visible: true,
    actionDisabled: true,
    responseUnsettledAtCapture: true,
    pendingUiElapsedMs: cancelPendingCapturedAt - cancelRequest.startedAt,
    screenshot: path.basename(screenshotPaths.cancelPending),
  };
  await page.screenshot({ path: screenshotPaths.cancelPending, fullPage: true });
  await waitFor(() => responsesFor('cancelOrder').length === 1, 'cancelOrder response');
  await Promise.all(responseTasks);
  const cancelResponse = responsesFor('cancelOrder')[0];
  assert.equal(cancelResponse.status, 200);
  assert.equal(cancelResponse.body?.id, orderId);
  assert.equal(cancelResponse.body?.status, 'cancelled');
  await waitFor(
    () =>
      page
        .getByTestId(`cancel-order-${orderId}`)
        .count()
        .then((count) => count === 0),
    'cancelled order removal from open list',
  );

  await page.getByRole('tab', { name: 'Lịch sử', exact: true }).click();
  await waitFor(() => responsesFor('listOrderHistory').length >= 1, 'order-history response');
  await waitFor(
    () =>
      responsesFor('listOrderHistory').some(
        (response) =>
          response.status === 200 &&
          response.body?.items?.some((item) => item.id === orderId && item.status === 'cancelled'),
      ),
    'cancelled order in history response',
  );
  const historyResponse = responsesFor('listOrderHistory').find((response) =>
    response.body?.items?.some((item) => item.id === orderId && item.status === 'cancelled'),
  );
  await page.getByText('Đã hủy', { exact: true }).waitFor({ state: 'visible' });
  await page.screenshot({ path: screenshotPaths.historyAfterCancel, fullPage: true });

  for (const operationId of expectedOperationIds)
    assert.ok(responsesFor(operationId).length > 0, `Expected a ${operationId} response.`);
  assert.equal(requestsFor('placeOrder').length, 1);
  assert.equal(requestsFor('modifyOrder').length, 1);
  assert.equal(requestsFor('cancelOrder').length, 1);
  const idempotencyKeysDistinct =
    new Set(
      ['placeOrder', 'modifyOrder', 'cancelOrder'].map(
        (operationId) => requestsFor(operationId)[0].idempotencyKeyHash,
      ),
    ).size === 3;
  assert.equal(idempotencyKeysDistinct, true);
  assert.equal(tradingWrites.length, 0);
  const writeRequests = apiRequests.filter((request) =>
    ['placeOrder', 'modifyOrder', 'cancelOrder'].includes(request.operationId),
  );
  tradingWrites.push(...writeRequests);
  assert.equal(writeRequests.length, 3);
  assert.ok(
    writeRequests.every(
      (request) => request.idempotencyKeyPresent && request.idempotencyKeyLength >= 8,
    ),
  );
  assert.deepEqual(externalApiOrigins, new Set());
  assert.deepEqual(pageErrors, []);
  await Promise.all(responseTasks);
  const expectedNavigationAborts = apiFailures.filter(
    (failure) =>
      !failure.hadResponse &&
      failure.failure === 'net::ERR_ABORTED' &&
      failure.operationId === null &&
      failure.path === '/api/market/pairs' &&
      failure.routeAtRequest !== null &&
      failure.routeAtRequest !== failure.routeAtFailure,
  );
  const unmatchedFailures = apiFailures.filter(
    (failure) => !failure.hadResponse && !expectedNavigationAborts.includes(failure),
  );
  assert.equal(unmatchedFailures.length, 0, JSON.stringify(unmatchedFailures));
  const unexpectedTradingRequests = apiRequests.filter(
    (request) => request.unexpectedTradingRequest,
  );
  assert.deepEqual(unexpectedTradingRequests, []);
  const allOperationsObserved = [
    ...new Set(apiResponses.map((response) => response.operationId).filter(Boolean)),
  ].filter((operationId) => expectedOperationIds.includes(operationId));
  assert.deepEqual([...allOperationsObserved].sort(), [...expectedOperationIds].sort());
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'trading.pending',
      status: 'passed',
      persona: 'developer',
      route: '/w/trade/btcusdt',
      operationIds: expectedOperationIds,
      observedOperationIds: [...allOperationsObserved],
      expectedDomainOperationCount: expectedOperationIds.length,
      coverage: 'full_scenario_operations_browser_observed',
      mutationCount: writeRequests.length,
      duplicateMutationSubmissionCount: 0,
      idempotencyKeyPresentForAllMutations: true,
      idempotencyKeysDistinct,
      createdOrderId: orderId,
      receiptVisible,
      createdStatus: placeResponse.body.status,
      modifiedPrice: modifyResponse.body.price,
      modifiedStatus: modifyResponse.body.status,
      cancelledStatus: cancelResponse.body.status,
      historyContainsCancelledOrder: Boolean(historyResponse),
      pendingStates,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, value]) => [key, path.basename(value)]),
      ),
    },
    contract: {
      operationContracts: Object.fromEntries(
        expectedOperationIds.map((operationId) => [
          operationId,
          operationContracts.get(operationId),
        ]),
      ),
      pendingSemantics:
        'Client request-in-flight only. OpenAPI does not declare a durable server pending status; create returns 201 open and cancel returns 200 cancelled.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      operationResponseCounts: Object.fromEntries(
        expectedOperationIds.map((operationId) => [operationId, responsesFor(operationId).length]),
      ),
      mutationResponseMs: Object.fromEntries(
        ['placeOrder', 'modifyOrder', 'cancelOrder'].map((operationId) => [
          operationId,
          responsesFor(operationId)[0]?.elapsedMs,
        ]),
      ),
      readResponseStatuses: Object.fromEntries(
        ['listOpenOrders', 'listOrderHistory'].map((operationId) => [
          operationId,
          responsesFor(operationId).map((response) => response.status),
        ]),
      ),
      tradingWriteCount: writeRequests.length,
      expectedNavigationAbortCount: expectedNavigationAborts.length,
      unmatchedApiFailureCount: unmatchedFailures.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    apiRequests,
    apiResponses,
    expectedNavigationAborts,
    sourceHashes,
    limitations:
      'All writes ran through local MSW in an isolated preview; this does not establish persistence, real backend idempotency, exchange execution, server-side pending states or user acceptance.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

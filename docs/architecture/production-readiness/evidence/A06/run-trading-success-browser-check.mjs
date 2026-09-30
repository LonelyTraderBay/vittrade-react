import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const previewUrl = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(previewUrl.hostname),
  'Trading mutations are permitted only against a loopback preview.',
);
assert.equal(previewUrl.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');
const origin = previewUrl.origin;
const evidenceDate = new Date().toISOString().slice(0, 10);
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const reportPath = path.join(
  evidenceDirectory,
  `trading-success-browser-check-${evidenceDate}.json`,
);
const screenshotPaths = {
  frontendStatus: path.join(
    evidenceDirectory,
    `preview-trading-success-status-${evidenceDate}.png`,
  ),
  copyRelationship: path.join(
    evidenceDirectory,
    `preview-trading-success-copy-${evidenceDate}.png`,
  ),
  orderReceipt: path.join(
    evidenceDirectory,
    `preview-trading-success-order-receipt-${evidenceDate}.png`,
  ),
  positionsUnavailable: path.join(
    evidenceDirectory,
    `preview-trading-success-positions-unavailable-${evidenceDate}.png`,
  ),
  analytics: path.join(evidenceDirectory, `preview-trading-success-analytics-${evidenceDate}.png`),
  orderHistory: path.join(
    evidenceDirectory,
    `preview-trading-success-order-history-${evidenceDate}.png`,
  ),
};
const sourceFiles = [
  'contracts/openapi/trading.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/trading-fixtures.ts',
  'src/dev/mocks/trading-analytics-fixtures.ts',
  'src/dev/mocks/trading-screen-fixtures.ts',
  'src/dev/mocks/market-data-simulator.ts',
  'src/dev/mocks/market-preview-fixtures.ts',
  'src/features/trading/routes.ts',
  'src/features/trading/api/trading-api.ts',
  'src/features/trading/api/analytics-api.ts',
  'src/features/trading/api/copy-frontend-view-status-api.ts',
  'src/features/trading/model/trading-queries.ts',
  'src/features/trading/model/analytics-queries.ts',
  'src/features/trading/model/copy-frontend-view-queries.ts',
  'src/features/trading/pages/TradePage.tsx',
  'src/features/trading/pages/TradeAnalyticsContractPage.tsx',
  'src/features/trading/pages/OpenPositionsPage.tsx',
  'src/features/trading/pages/OrderReceiptPage.tsx',
  'src/features/trading/pages/CopyFrontendStatusPages.tsx',
  'src/features/trading/pages/CopyTradingPage.tsx',
  'src/features/trading/pages/CopyProviderDetailContractPage.tsx',
  'src/features/trading/pages/PreCopyAssessmentContractPage.tsx',
  'src/features/trading/pages/CopyConfigurationContractPage.tsx',
  'src/features/trading/pages/CopyConfirmationContractPage.tsx',
  'src/features/trading/pages/ActiveCopiesContractPage.tsx',
  'src/features/trading/components/TradeTerminal.tsx',
  'src/features/trading/components/TradingOrderEntryPanel.tsx',
  'src/features/trading/components/OrderConfirmationSheet.tsx',
  'src/features/trading/components/OrderModifySheet.tsx',
  'src/features/trading/components/OpenOrdersPanel.tsx',
  'src/features/trading/components/OrderHistoryPanel.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-trading-success-browser-check.mjs',
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);

const apiRequests = [];
const apiResponses = [];
const apiRequestFailureEvents = [];
const respondedRequests = new WeakSet();
const pageErrors = [];
const externalApiOrigins = new Set();
page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/')) {
    apiRequests.push({ method: request.method(), path: url.pathname });
    if (url.origin !== origin) externalApiOrigins.add(url.origin);
  }
});
page.on('response', (response) => {
  respondedRequests.add(response.request());
  const url = new URL(response.url());
  if (url.pathname.startsWith('/api/')) {
    apiResponses.push({
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  }
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/')) {
    apiRequestFailureEvents.push({
      method: request.method(),
      path: url.pathname,
      failure: request.failure()?.errorText ?? null,
      hadResponse: respondedRequests.has(request),
    });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL(`**${route}`);
}

function waitForApiResponse(method, pathname) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === pathname && response.request().method() === method,
  );
}

const startedAt = Date.now();

try {
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  await page.getByLabel('Miền API').selectOption('trading');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.success').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const statusResponsePromise = waitForApiResponse('GET', '/api/trading/copy/frontend-view-status');
  await navigateWithinSpa('/w/trade/copy-safety-center');
  const statusResponse = await statusResponsePromise;
  const frontendStatus = await statusResponse.json();
  await page.getByText('Chưa kết nối backend', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.frontendStatus, fullPage: true });
  assert.equal(statusResponse.status(), 200);
  assert.equal(frontendStatus.state, 'backend-required');
  assert.equal(statusResponse.fromServiceWorker(), true);

  const providersResponsePromise = waitForApiResponse('GET', '/api/trading/copy/providers');
  await navigateWithinSpa('/w/trade/copy-trading');
  const providersResponse = await providersResponsePromise;
  const providersPayload = await providersResponse.json();
  assert.equal(providersResponse.status(), 200);
  assert.equal(providersResponse.fromServiceWorker(), true);
  assert.ok(providersPayload.items.length > 0, 'copy provider list should contain preview data');
  const provider = providersPayload.items[0];
  await page.getByText(provider.name, { exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Xem chi tiết' }).first().click();

  const providerProfileResponse = await waitForApiResponse(
    'GET',
    `/api/trading/copy/providers/${provider.id}`,
  );
  assert.equal(providerProfileResponse.status(), 200);
  assert.equal(providerProfileResponse.fromServiceWorker(), true);
  await page.getByText(provider.name, { exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Đánh giá trước khi copy' }).click();
  await page.getByText('Xác nhận hiểu rủi ro', { exact: true }).waitFor();
  const assessmentChecks = page.getByRole('checkbox');
  for (let index = 0; index < (await assessmentChecks.count()); index += 1) {
    await assessmentChecks.nth(index).check();
  }
  await page.getByRole('button', { name: 'Tiếp tục cấu hình' }).click();
  await page.getByText('Cấu hình Copy', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Xem xác nhận' }).click();
  await page.getByText('Xác nhận bắt buộc', { exact: true }).waitFor();
  const confirmationChecks = page.getByRole('checkbox');
  for (let index = 0; index < (await confirmationChecks.count()); index += 1) {
    await confirmationChecks.nth(index).check();
  }

  const createRelationshipRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/trading/copy/relationships' &&
      request.method() === 'POST',
  );
  const createRelationshipResponsePromise = waitForApiResponse(
    'POST',
    '/api/trading/copy/relationships',
  );
  const activeRelationshipsResponsePromise = waitForApiResponse(
    'GET',
    '/api/trading/copy/relationships',
  );
  await page.getByRole('button', { name: 'Xác nhận & Bắt đầu Copy' }).click();
  const [createRelationshipRequest, createRelationshipResponse, activeRelationshipsResponse] =
    await Promise.all([
      createRelationshipRequestPromise,
      createRelationshipResponsePromise,
      activeRelationshipsResponsePromise,
    ]);
  const createdRelationship = await createRelationshipResponse.json();
  const createRelationshipPayload = createRelationshipRequest.postDataJSON();
  const createRelationshipKey = createRelationshipRequest.headers()['idempotency-key'] ?? '';
  const activeRelationships = await activeRelationshipsResponse.json();
  assert.equal(createRelationshipResponse.status(), 201);
  assert.equal(createRelationshipResponse.fromServiceWorker(), true);
  assert.ok(createRelationshipKey.length >= 8);
  assert.equal(createRelationshipPayload.providerId, provider.id);
  assert.equal(createdRelationship.status, 'active');
  assert.ok(activeRelationships.items.some((item) => item.id === createdRelationship.copyId));
  await page.getByText(provider.name, { exact: true }).last().waitFor();
  await page.screenshot({ path: screenshotPaths.copyRelationship, fullPage: true });

  const stopInput = page.getByLabel(`Lý do dừng ${provider.name}`).last();
  await stopInput.fill('Local preview verification only');
  const stopRelationshipRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname ===
        `/api/trading/copy/relationships/${createdRelationship.copyId}/stop` &&
      request.method() === 'POST',
  );
  const stopRelationshipResponsePromise = waitForApiResponse(
    'POST',
    `/api/trading/copy/relationships/${createdRelationship.copyId}/stop`,
  );
  const stoppedRelationshipsResponsePromise = waitForApiResponse(
    'GET',
    '/api/trading/copy/relationships',
  );
  await page.getByRole('button', { name: 'Dừng', exact: true }).last().click();
  const [stopRelationshipRequest, stopRelationshipResponse, stoppedRelationshipsResponse] =
    await Promise.all([
      stopRelationshipRequestPromise,
      stopRelationshipResponsePromise,
      stoppedRelationshipsResponsePromise,
    ]);
  const stopRelationshipPayload = stopRelationshipRequest.postDataJSON();
  const stoppedRelationship = await stopRelationshipResponse.json();
  const finalRelationships = await stoppedRelationshipsResponse.json();
  assert.equal(stopRelationshipResponse.status(), 200);
  assert.equal(stopRelationshipResponse.fromServiceWorker(), true);
  assert.ok(stopRelationshipRequest.headers()['idempotency-key']?.length >= 8);
  assert.equal(stopRelationshipPayload.reason, 'Local preview verification only');
  assert.equal(stopRelationshipPayload.closeOpenPositions, true);
  assert.equal(stoppedRelationship.status, 'stopped');
  assert.ok(
    finalRelationships.items.some(
      (item) => item.id === createdRelationship.copyId && item.status === 'stopped',
    ),
  );
  await stopInput.waitFor({ state: 'detached' });

  const analyticsResponsePromise = waitForApiResponse('GET', '/api/trading/analytics');
  await navigateWithinSpa('/w/trade/analytics');
  const analyticsResponse = await analyticsResponsePromise;
  const analyticsPayload = await analyticsResponse.json();
  await page.getByText('Performance summary', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.analytics, fullPage: true });
  assert.equal(analyticsResponse.status(), 200);
  assert.equal(analyticsResponse.fromServiceWorker(), true);
  assert.equal(analyticsPayload.period, '1M');
  assert.ok(analyticsPayload.summary);

  const positionsResponsePromise = waitForApiResponse('GET', '/api/trading/positions');
  await navigateWithinSpa('/w/trade/positions');
  const positionsResponse = await positionsResponsePromise;
  const positionsPayload = await positionsResponse.json();
  await page.getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.positionsUnavailable, fullPage: true });
  assert.equal(positionsResponse.status(), 503);
  assert.equal(positionsResponse.fromServiceWorker(), true);
  assert.equal(positionsPayload.code, 'positions_source_unavailable');
  assert.equal(await page.getByText('Không có vị thế phù hợp.', { exact: true }).count(), 0);

  const openOrdersResponsePromise = waitForApiResponse('GET', '/api/trading/orders');
  const initialHistoryResponsePromise = waitForApiResponse('GET', '/api/trading/orders/history');
  await navigateWithinSpa('/w/trade/btcusdt');
  const [openOrdersResponse, initialHistoryResponse] = await Promise.all([
    openOrdersResponsePromise,
    initialHistoryResponsePromise,
  ]);
  assert.equal(openOrdersResponse.status(), 200);
  assert.equal(openOrdersResponse.fromServiceWorker(), true);
  assert.equal(initialHistoryResponse.status(), 200);
  assert.equal(initialHistoryResponse.fromServiceWorker(), true);
  await page.getByText('BTC/USDT', { exact: true }).first().waitFor();
  await page.getByTestId('trade-amount').fill('0.01');
  await page.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i }).click();
  await page.getByText('Xác nhận lệnh', { exact: true }).waitFor();

  const placeOrderRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/trading/orders' && request.method() === 'POST',
  );
  const placeOrderResponsePromise = waitForApiResponse('POST', '/api/trading/orders');
  await page.getByTestId('trade-confirm-submit').click();
  const [placeOrderRequest, placeOrderResponse] = await Promise.all([
    placeOrderRequestPromise,
    placeOrderResponsePromise,
  ]);
  const placedOrder = await placeOrderResponse.json();
  const placeOrderKey = placeOrderRequest.headers()['idempotency-key'] ?? '';
  await page.waitForURL('**/w/trade/order-receipt');
  await page.getByText(placedOrder.id, { exact: true }).waitFor();
  const receiptRoute = new URL(page.url()).pathname;
  await page.screenshot({ path: screenshotPaths.orderReceipt, fullPage: true });
  assert.equal(placeOrderResponse.status(), 201);
  assert.equal(placeOrderResponse.fromServiceWorker(), true);
  assert.ok(placeOrderKey.length >= 8);
  assert.equal(placedOrder.status, 'open');

  await navigateWithinSpa('/w/trade/btcusdt');
  await page.getByRole('tab', { name: /Đang mở/ }).click();
  await page.getByTestId(`cancel-order-${placedOrder.id}`).waitFor();
  await page.getByRole('button', { name: 'Sửa', exact: true }).click();
  await page.getByText('Sửa lệnh', { exact: true }).waitFor();
  await page.getByTestId('trade-modify-price').fill('65100');
  const modifyOrderRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === `/api/trading/orders/${placedOrder.id}` &&
      request.method() === 'PATCH',
  );
  const modifyOrderResponsePromise = waitForApiResponse(
    'PATCH',
    `/api/trading/orders/${placedOrder.id}`,
  );
  const refreshedOpenOrdersPromise = waitForApiResponse('GET', '/api/trading/orders');
  await page.getByTestId('trade-modify-submit').click();
  const [modifyOrderRequest, modifyOrderResponse, refreshedOpenOrdersResponse] = await Promise.all([
    modifyOrderRequestPromise,
    modifyOrderResponsePromise,
    refreshedOpenOrdersPromise,
  ]);
  const modifiedOrder = await modifyOrderResponse.json();
  const refreshedOrders = await refreshedOpenOrdersResponse.json();
  assert.equal(modifyOrderResponse.status(), 200);
  assert.equal(modifyOrderResponse.fromServiceWorker(), true);
  assert.ok(modifyOrderRequest.headers()['idempotency-key']?.length >= 8);
  assert.equal(modifiedOrder.id, placedOrder.id);
  assert.equal(modifiedOrder.price, 65_100);
  assert.ok(
    refreshedOrders.items.some((item) => item.id === placedOrder.id && item.price === 65_100),
  );

  await page.getByTestId(`cancel-order-${placedOrder.id}`).waitFor();
  const cancelOrderRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === `/api/trading/orders/${placedOrder.id}/cancel` &&
      request.method() === 'POST',
  );
  const cancelOrderResponsePromise = waitForApiResponse(
    'POST',
    `/api/trading/orders/${placedOrder.id}/cancel`,
  );
  const cancelledHistoryResponsePromise = waitForApiResponse('GET', '/api/trading/orders/history');
  await page.getByTestId(`cancel-order-${placedOrder.id}`).click();
  const [cancelOrderRequest, cancelOrderResponse, cancelledHistoryResponse] = await Promise.all([
    cancelOrderRequestPromise,
    cancelOrderResponsePromise,
    cancelledHistoryResponsePromise,
  ]);
  const cancelledOrder = await cancelOrderResponse.json();
  const cancelledHistory = await cancelledHistoryResponse.json();
  assert.equal(cancelOrderResponse.status(), 200);
  assert.equal(cancelOrderResponse.fromServiceWorker(), true);
  assert.ok(cancelOrderRequest.headers()['idempotency-key']?.length >= 8);
  assert.equal(cancelledOrder.status, 'cancelled');
  assert.ok(
    cancelledHistory.items.some(
      (item) => item.id === placedOrder.id && item.status === 'cancelled',
    ),
  );
  const tradeTabs = page
    .getByRole('tablist')
    .filter({ has: page.getByRole('tab', { name: /Đang mở/ }) });
  const historyTab = tradeTabs.getByRole('tab', { name: 'Lịch sử', exact: true });
  assert.equal(await tradeTabs.count(), 1);
  await historyTab.click();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('[role="tablist"]')]
        .find((list) => list.textContent?.includes('Đang mở'))
        ?.querySelector('[role="tab"]:last-child')
        ?.getAttribute('aria-selected') === 'true',
  );
  assert.equal(await historyTab.getAttribute('aria-selected'), 'true');
  await page.getByText('Đã hủy', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.orderHistory, fullPage: true });

  const successfulOperationIds = [
    'getCopyFrontendViewStatus',
    'listCopyProviders',
    'getCopyProviderProfile',
    'listCopyRelationships',
    'createCopyRelationship',
    'stopCopyRelationship',
    'getTradingAnalytics',
    'listOpenOrders',
    'placeOrder',
    'listOrderHistory',
    'modifyOrder',
    'cancelOrder',
  ];
  const operationRequestCounts = {
    getCopyFrontendViewStatus: apiRequests.filter(
      (x) => x.path === '/api/trading/copy/frontend-view-status' && x.method === 'GET',
    ).length,
    listCopyProviders: apiRequests.filter(
      (x) => x.path === '/api/trading/copy/providers' && x.method === 'GET',
    ).length,
    getCopyProviderProfile: apiRequests.filter(
      (x) => /^\/api\/trading\/copy\/providers\/[^/]+$/.test(x.path) && x.method === 'GET',
    ).length,
    listCopyRelationships: apiRequests.filter(
      (x) => x.path === '/api/trading/copy/relationships' && x.method === 'GET',
    ).length,
    createCopyRelationship: apiRequests.filter(
      (x) => x.path === '/api/trading/copy/relationships' && x.method === 'POST',
    ).length,
    stopCopyRelationship: apiRequests.filter(
      (x) =>
        /^\/api\/trading\/copy\/relationships\/[^/]+\/stop$/.test(x.path) && x.method === 'POST',
    ).length,
    getTradingAnalytics: apiRequests.filter(
      (x) => x.path === '/api/trading/analytics' && x.method === 'GET',
    ).length,
    listOpenOrders: apiRequests.filter(
      (x) => x.path === '/api/trading/orders' && x.method === 'GET',
    ).length,
    placeOrder: apiRequests.filter((x) => x.path === '/api/trading/orders' && x.method === 'POST')
      .length,
    listOpenPositions: apiRequests.filter(
      (x) => x.path === '/api/trading/positions' && x.method === 'GET',
    ).length,
    listOrderHistory: apiRequests.filter(
      (x) => x.path === '/api/trading/orders/history' && x.method === 'GET',
    ).length,
    modifyOrder: apiRequests.filter(
      (x) => /^\/api\/trading\/orders\/[^/]+$/.test(x.path) && x.method === 'PATCH',
    ).length,
    cancelOrder: apiRequests.filter(
      (x) => /^\/api\/trading\/orders\/[^/]+\/cancel$/.test(x.path) && x.method === 'POST',
    ).length,
  };
  assert.deepEqual(externalApiOrigins, new Set());
  assert.equal(
    apiRequestFailureEvents.filter((event) => !event.hadResponse).length,
    0,
    JSON.stringify(apiRequestFailureEvents.filter((event) => !event.hadResponse)),
  );
  assert.deepEqual(pageErrors, []);
  assert.ok(successfulOperationIds.every((id) => operationRequestCounts[id] > 0));
  assert.ok(operationRequestCounts.listOpenPositions > 0);
  assert.ok(
    apiResponses.every((response) => response.fromServiceWorker),
    JSON.stringify(apiResponses.filter((response) => !response.fromServiceWorker)),
  );

  const checkedAt = new Date().toISOString();
  const report = {
    checkedAt,
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    origin,
    scenario: {
      id: 'trading.success',
      status: 'passed',
      route: '/w/trade/btcusdt',
      operationIds: successfulOperationIds,
      observedOperationIds: successfulOperationIds,
      expectedOperationIds: [...successfulOperationIds, 'listOpenPositions'],
      coverage: 'representative_success_operations; listOpenPositions returns declared 503',
      operationRequestCounts,
      responses: apiResponses,
      copyRelationship: {
        providerId: provider.id,
        copyId: createdRelationship.copyId,
        createStatus: createRelationshipResponse.status(),
        createIdempotencyKeyLength: createRelationshipKey.length,
        stopStatus: stopRelationshipResponse.status(),
        stopIdempotencyKeyLength: stopRelationshipRequest.headers()['idempotency-key']?.length ?? 0,
        relationshipVisibleAfterCreate: activeRelationships.items.some(
          (item) => item.id === createdRelationship.copyId,
        ),
        stoppedRelationshipStatus: stoppedRelationship.status,
        stoppedRelationshipHiddenFromActiveUi: await stopInput.count().then((count) => count === 0),
        relationshipRetainedAsStoppedInMockRead: finalRelationships.items.some(
          (item) => item.id === createdRelationship.copyId && item.status === 'stopped',
        ),
      },
      orderLifecycle: {
        id: placedOrder.id,
        placeStatus: placeOrderResponse.status(),
        placeIdempotencyKeyLength: placeOrderKey.length,
        receiptRoute,
        modifyStatus: modifyOrderResponse.status(),
        modifiedPrice: modifiedOrder.price,
        cancelStatus: cancelOrderResponse.status(),
        finalStatus: cancelledOrder.status,
        historyContainsCancelledOrder: cancelledHistory.items.some(
          (item) => item.id === placedOrder.id && item.status === 'cancelled',
        ),
      },
      positions: {
        status: positionsResponse.status(),
        responseCode: positionsPayload.code,
        visibleUnavailableState: true,
        falseEmptyStateVisible: false,
        successfulCoverage: false,
      },
      visibleUi: {
        copyFrontendStatus: frontendStatus.state,
        providerName: provider.name,
        analyticsSummaryVisible: true,
        cancelledOrderVisibleInHistory: true,
      },
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, value]) => [key, path.basename(value)]),
      ),
    },
    operationRequestCounts,
    apiRequestCount: apiRequests.length,
    apiResponseCount: apiResponses.length,
    apiRequestFailureEvents,
    unmatchedApiRequestFailureCount: apiRequestFailureEvents.filter((event) => !event.hadResponse)
      .length,
    pageErrors,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    fixtureBoundary: {
      serviceWorkerControlled: apiResponses.every((response) => response.fromServiceWorker),
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins],
      scenarioSuccessfulOperationCount: successfulOperationIds.length,
      expectedScenarioOperationCount: successfulOperationIds.length + 1,
      positionsSuccessfulCoverage: false,
    },
    sourceHashes: Object.fromEntries(
      sourceFiles.map((sourcePath) => [
        sourcePath,
        createHash('sha256')
          .update(readFileSync(path.resolve(sourcePath)))
          .digest('hex'),
      ]),
    ),
    evidenceBoundary:
      'Chromium browser evidence for local preview and MSW only. It does not establish backend persistence, authorization, exchange execution, same-key replay, staging or user acceptance. listOpenPositions deliberately returns its contract-declared 503 because no account position source is configured.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

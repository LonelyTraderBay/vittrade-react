import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(evidenceDirectory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
const allowedPreviewHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
assert.ok(allowedPreviewHosts.has(origin.hostname), 'Only a loopback preview is allowed.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');
const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const evidenceRunSuffix = process.env.EVIDENCE_RUN_SUFFIX?.trim() ?? '';
assert.match(
  evidenceRunSuffix,
  /^[a-z0-9][a-z0-9-]{0,39}$/i,
  'EVIDENCE_RUN_SUFFIX must be a short filename-safe label.',
);
const artifactDate = evidenceRunSuffix ? `${date}-${evidenceRunSuffix}` : date;
const screenshotPaths = {
  escrowPaid: path.join(evidenceDirectory, `preview-p2p-success-escrow-paid-${artifactDate}.png`),
  createdOrder: path.join(
    evidenceDirectory,
    `preview-p2p-success-order-created-${artifactDate}.png`,
  ),
};
const reportPath = path.join(evidenceDirectory, `p2p-success-browser-check-${artifactDate}.json`);
const sourceFiles = [
  'contracts/openapi/p2p.yaml',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/p2p/api/p2p-api.ts',
  'src/features/p2p/model/p2p-order-creation-queries.ts',
  'src/features/p2p/pages/P2PAdDetailContractPage.tsx',
  'src/features/p2p/pages/P2PEscrowDetailPage.tsx',
  'src/features/p2p/routes.ts',
  'docs/architecture/production-readiness/evidence/A06/run-p2p-success-browser-check.mjs',
];
const sha256 = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(repositoryRoot, relativePath)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (relativePath) => [relativePath, await sha256(relativePath)]),
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).trim();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);

const externalApiOrigins = new Set();
const pageErrors = [];
const p2pResponses = [];
const p2pRequestFailures = [];
const p2pMutations = [];
const apiRequests = [];
const startedAt = Date.now();

page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.protocol.startsWith('http') && url.origin !== originUrl) {
    if (request.headers().accept?.includes('application/json') || url.pathname.includes('/api/')) {
      externalApiOrigins.add(url.origin);
    }
  }
  if (url.pathname.startsWith('/api/')) {
    apiRequests.push({ method: request.method(), path: url.pathname });
  }
  if (url.pathname.startsWith('/api/p2p/') && request.method() !== 'GET') {
    p2pMutations.push({ method: request.method(), path: url.pathname });
  }
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/p2p/')) return;
  p2pResponses.push({
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/p2p/')) {
    p2pRequestFailures.push({
      method: request.method(),
      path: url.pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const waitForResponse = (pathSuffix, method) =>
  page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(pathSuffix) &&
      response.request().method() === method,
  );

async function applyP2PSuccessScenario() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.success').waitFor();
}

async function signInDeveloperThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await applyP2PSuccessScenario();
  await signInDeveloperThroughPreview();

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by its local service worker.',
  );

  const escrowStartedAt = Date.now();
  const paidOrderResponsePromise = waitForResponse('/api/p2p/orders/p2p002', 'GET');
  await navigateWithinSpa('/w/p2p/escrow/p2p002');
  const paidOrderResponse = await paidOrderResponsePromise;
  const paidOrder = await paidOrderResponse.json();
  await page.getByText('Đã thanh toán · Chờ release').waitFor();
  await page.getByRole('button', { name: 'Start escrow release' }).waitFor();
  const paidEscrowMs = Date.now() - escrowStartedAt;
  const paidEscrowRoute = new URL(page.url()).pathname;
  const previewPanelToggle = page.getByRole('button', { name: 'Thu gọn' });
  if ((await previewPanelToggle.count()) > 0) await previewPanelToggle.click();
  await page.screenshot({ path: screenshotPaths.escrowPaid, fullPage: true });

  const adStartedAt = Date.now();
  const adResponsePromise = waitForResponse('/api/p2p/ads/ad001', 'GET');
  await navigateWithinSpa('/w/p2p/ad/ad001');
  const adResponse = await adResponsePromise;
  const ad = await adResponse.json();
  await page.getByText('CryptoKing_VN', { exact: true }).waitFor();
  await page.getByLabel('Fiat amount').fill('500000');
  await page.getByRole('button', { name: 'Xem xác nhận đơn P2P' }).click();

  const createdOrderResponsePromise = page.waitForResponse(
    (response) =>
      /^\/api\/p2p\/orders\/dev-p2p-order-/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  );
  const orderCreateResponsePromise = waitForResponse('/api/p2p/orders', 'POST');
  const createStartedAt = Date.now();
  await page.getByRole('button', { name: 'Confirm P2P order' }).click();
  const orderCreateResponse = await orderCreateResponsePromise;
  const orderCreatePayload = await orderCreateResponse.json();
  const orderCreateRequest = orderCreateResponse.request();
  const orderCreateBody = orderCreateRequest.postDataJSON();
  const idempotencyKey = orderCreateRequest.headers()['idempotency-key'] ?? '';
  const createdOrderResponse = await createdOrderResponsePromise;
  const createdOrder = await createdOrderResponse.json();
  await page.waitForURL(`**/w/p2p/order/${orderCreatePayload.orderId}`);
  await page.getByText(`Order #${createdOrder.orderNumber}`, { exact: true }).waitFor();
  const createdOrderRoute = new URL(page.url()).pathname;
  const createOrderMs = Date.now() - createStartedAt;
  const adAndCreateMs = Date.now() - adStartedAt;
  const collapsedPanel = page.getByRole('button', { name: 'Thu gọn' });
  if ((await collapsedPanel.count()) > 0) await collapsedPanel.click();
  await page.screenshot({ path: screenshotPaths.createdOrder, fullPage: true });

  assert.equal(paidOrderResponse.status(), 200);
  assert.equal(paidOrderResponse.fromServiceWorker(), true);
  assert.equal(paidOrder.status, 'paid');
  assert.equal(paidEscrowRoute, '/w/p2p/escrow/p2p002');
  assert.equal(adResponse.status(), 200);
  assert.equal(adResponse.fromServiceWorker(), true);
  assert.equal(ad.id, 'ad001');
  assert.equal(orderCreateResponse.status(), 201);
  assert.equal(orderCreateResponse.fromServiceWorker(), true);
  assert.equal(orderCreatePayload.status, 'created');
  assert.equal(typeof orderCreatePayload.orderId, 'string');
  assert.equal(typeof orderCreatePayload.expiresAt, 'string');
  assert.equal(orderCreateBody.adId, 'ad001');
  assert.equal(orderCreateBody.asset, 'USDT');
  assert.equal(orderCreateBody.currency, 'VND');
  assert.equal(orderCreateBody.fiatAmount, 500000);
  assert.equal(orderCreateBody.paymentMethod, 'Vietcombank');
  assert.ok(Math.abs(orderCreateBody.amount - 500000 / 25350) < 1e-10);
  assert.match(idempotencyKey, /^p2p-ad-order-/);
  assert.equal(createdOrderResponse.status(), 200);
  assert.equal(createdOrderResponse.fromServiceWorker(), true);
  assert.equal(createdOrder.id, orderCreatePayload.orderId);
  assert.equal(createdOrderRoute, `/w/p2p/order/${orderCreatePayload.orderId}`);
  assert.equal(
    p2pMutations.filter(
      (request) => request.method === 'POST' && request.path === '/api/p2p/orders',
    ).length,
    1,
    'Exactly one P2P create-order POST is permitted in this scenario.',
  );
  assert.equal(
    p2pMutations.filter((request) => /\/release(?:\/|$)|\/mark-paid$/.test(request.path)).length,
    0,
    'No escrow release, challenge, verification, or mark-paid mutation may be sent.',
  );
  assert.ok(
    p2pResponses.length >= 4,
    'Expected paid order, ad, create receipt and created-order responses.',
  );
  assert.ok(p2pResponses.every((response) => response.fromServiceWorker));
  assert.equal(p2pRequestFailures.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.deepEqual(pageErrors, []);

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'p2p.success',
      status: 'passed',
      persona: 'developer (preview only)',
      route: '/w/p2p/escrow/p2p002',
      additionalRoutes: ['/w/p2p/ad/ad001', createdOrderRoute],
      observedOperationIds: ['getP2POrder', 'getP2PAd', 'createP2POrder'],
      expectedDomainOperationCount: 42,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled: serviceWorkerControlled,
      allP2PResponsesFromServiceWorker: p2pResponses.every(
        (response) => response.fromServiceWorker,
      ),
      p2pMutationsAreLocalInMemoryFixtureChanges: true,
      externalApiOrigins: [...externalApiOrigins],
      realBackendMutationSent: false,
      escrowReleaseTriggered: false,
      markPaidTriggered: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      paidEscrowRouteMs: paidEscrowMs,
      adLoadAndCreateOrderFlowMs: adAndCreateMs,
      createOrderToCreatedDetailMs: createOrderMs,
      p2pApiResponseCount: p2pResponses.length,
      apiRequestCount: apiRequests.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      paidEscrowGet: {
        status: paidOrderResponse.status(),
        fromServiceWorker: paidOrderResponse.fromServiceWorker(),
        orderStatus: paidOrder.status,
      },
      paidEscrowUi: {
        route: paidEscrowRoute,
        paymentStateVisible: true,
        authorizedReleaseActionVisible: true,
        releaseClicked: false,
      },
      adGet: {
        status: adResponse.status(),
        fromServiceWorker: adResponse.fromServiceWorker(),
        adId: ad.id,
      },
      createOrderPost: {
        status: orderCreateResponse.status(),
        fromServiceWorker: orderCreateResponse.fromServiceWorker(),
        resultStatus: orderCreatePayload.status,
        orderId: orderCreatePayload.orderId,
        idempotencyKeyPresent: idempotencyKey.length > 0,
        idempotencyKeyPrefixValid: /^p2p-ad-order-/.test(idempotencyKey),
        request: {
          adId: orderCreateBody.adId,
          asset: orderCreateBody.asset,
          currency: orderCreateBody.currency,
          fiatAmount: orderCreateBody.fiatAmount,
          paymentMethod: orderCreateBody.paymentMethod,
          amount: orderCreateBody.amount,
        },
        createPostCount: p2pMutations.filter(
          (request) => request.method === 'POST' && request.path === '/api/p2p/orders',
        ).length,
      },
      createdOrderGet: {
        status: createdOrderResponse.status(),
        fromServiceWorker: createdOrderResponse.fromServiceWorker(),
        idMatchesReceipt: createdOrder.id === orderCreatePayload.orderId,
        route: createdOrderRoute,
      },
      p2pMutationRequests: p2pMutations,
      p2pResponses,
      p2pRequestFailures,
      pageErrors,
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([key, value]) => [key, path.basename(value)]),
    ),
    sourceHashes,
    limitations: [
      'This is local Chromium/MSW UI and adapter evidence only; it does not verify backend persistence, authorization enforcement, reconciliation, staging or user acceptance.',
      'Only three of 42 P2P operations were observed; p2p.success remains representative coverage.',
      'The release action was checked for visibility and deliberately not invoked; paid does not mean released.',
    ],
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  const content = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
    ...prettierOptions,
    parser: 'json',
  });
  await fs.writeFile(reportPath, content);
  process.stdout.write(content);
} finally {
  await browser.close();
}

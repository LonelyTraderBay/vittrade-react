import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Loopback preview only.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');
const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const evidenceRunSuffix = process.env.EVIDENCE_RUN_SUFFIX ?? '';
assert.match(
  evidenceRunSuffix,
  /^[a-z0-9-]*$/i,
  'Evidence run suffix must be alphanumeric or hyphenated.',
);
const artifactSuffix = evidenceRunSuffix ? `-${evidenceRunSuffix}` : '';
const route = '/w/p2p/escrow/p2p002';
const screenshots = Object.fromEntries(
  ['create-inflight', 'created-order', 'mark-paid-inflight', 'release-inflight', 'released'].map(
    (name) => [
      name,
      path.join(directory, `preview-p2p-pending-${name}-${date}${artifactSuffix}.png`),
    ],
  ),
);
const reportPath = path.join(directory, `p2p-pending-browser-check-${date}${artifactSuffix}.json`);
const sourceFiles = [
  'contracts/openapi/p2p.yaml',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/p2p/api/p2p-api.ts',
  'src/features/p2p/model/p2p-order-creation-queries.ts',
  'src/features/p2p/model/p2p-order-action-queries.ts',
  'src/features/p2p/pages/P2PAdDetailContractPage.tsx',
  'src/features/p2p/pages/P2PEscrowDetailPage.tsx',
  'src/features/p2p/routes.ts',
];
const hash = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, relativePath)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (p) => [p, await hash(p)])),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const startedAt = Date.now();
const apiRequests = [];
const p2pResponses = [];
const p2pMutations = [];
const requestFailures = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const requestStartedAt = new WeakMap();
page.on('request', (request) => {
  requestStartedAt.set(request, Date.now());
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    (request.headers().accept?.includes('json') || url.pathname.includes('/api/'))
  )
    externalApiOrigins.add(url.origin);
  if (url.pathname.startsWith('/api/'))
    apiRequests.push({ method: request.method(), path: url.pathname });
  if (url.pathname.startsWith('/api/p2p/') && request.method() !== 'GET')
    p2pMutations.push({
      method: request.method(),
      path: url.pathname,
      idempotencyKey: request.headers()['idempotency-key'] ?? null,
    });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (url.pathname.startsWith('/api/p2p/'))
    p2pResponses.push({
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      responseTimeMs: Date.now() - (requestStartedAt.get(response.request()) ?? Date.now()),
    });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/p2p/'))
    requestFailures.push({
      method: request.method(),
      path: url.pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
});
page.on('pageerror', (error) => pageErrors.push(error.message));
const waitResponse = (predicate) =>
  page.waitForResponse((response) => predicate(response, new URL(response.url())));
const navigate = async (next) => {
  await page.evaluate((pathname) => {
    window.history.pushState({}, '', pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, next);
  await page.waitForURL((url) => url.pathname === next);
};
async function applyScenario() {
  if (!(await page.getByLabel('Miền API').count()))
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.pending').waitFor();
}
async function signIn() {
  if (!(await page.getByLabel('Tài khoản xem trước').count()))
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}
async function capture(name) {
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
  await page.screenshot({ path: screenshots[name], fullPage: true });
}
try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await applyScenario();
  await signIn();
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by local service worker.',
  );

  const adResponsePromise = waitResponse(
    (res, url) => url.pathname === '/api/p2p/ads/ad001' && res.request().method() === 'GET',
  );
  await navigate('/w/p2p/ad/ad001');
  const adResponse = await adResponsePromise;
  const ad = await adResponse.json();
  await page.getByLabel('Fiat amount').fill('500000');
  await page.getByRole('button', { name: 'Xem xác nhận đơn P2P' }).click();
  const createResponsePromise = waitResponse(
    (res, url) => url.pathname === '/api/p2p/orders' && res.request().method() === 'POST',
  );
  const createStarted = Date.now();
  await page.getByRole('button', { name: 'Confirm P2P order' }).click();
  const createButton = page.getByRole('button', { name: 'Confirm P2P order' });
  await page.getByText('Đang tạo…', { exact: true }).waitFor();
  const createButtonDisabled = await createButton.isDisabled();
  const createPendingVisibleMs = Date.now() - createStarted;
  assert.equal(createButtonDisabled, true);
  await capture('create-inflight');
  await page.waitForTimeout(250);
  assert.equal(
    p2pMutations.filter((x) => x.method === 'POST' && x.path === '/api/p2p/orders').length,
    1,
  );
  const createResponse = await createResponsePromise;
  const createResponseTimeMs = p2pResponses.findLast(
    (x) => x.method === 'POST' && x.path === '/api/p2p/orders',
  )?.responseTimeMs;
  const receipt = await createResponse.json();
  const createKey = createResponse.request().headers()['idempotency-key'] ?? '';
  assert.equal(createResponse.status(), 201);
  assert.equal(createResponse.fromServiceWorker(), true);
  assert.equal(receipt.status, 'created');
  assert.match(createKey, /^p2p-ad-order-/);
  assert.equal(typeof receipt.orderId, 'string');
  assert.ok(
    createResponseTimeMs >= 1_500 && createResponseTimeMs < 5_000,
    `Expected delayed create response, got ${createResponseTimeMs} ms.`,
  );

  const createdOrderPath = `/api/p2p/orders/${receipt.orderId}`;
  const createdOrderGetPromise = waitResponse(
    (res, url) => url.pathname === createdOrderPath && res.request().method() === 'GET',
  );
  const createRoute = `/w/p2p/order/${receipt.orderId}`;
  await page.waitForURL(`**${createRoute}`);
  const createdOrderGet = await createdOrderGetPromise;
  const createdOrder = await createdOrderGet.json();
  await page.getByRole('button', { name: 'Mark order paid' }).waitFor();
  await capture('created-order');

  const markPaidPath = `/api/p2p/orders/${receipt.orderId}/mark-paid`;
  const markPaidPromise = waitResponse(
    (res, url) => url.pathname === markPaidPath && res.request().method() === 'POST',
  );
  const markPaidStarted = Date.now();
  await page.getByRole('button', { name: 'Mark order paid' }).click();
  const markPaidButton = page.getByRole('button', { name: 'Mark order paid' });
  await page.getByText('Đang cập nhật…', { exact: true }).waitFor();
  const markPaidButtonDisabled = await markPaidButton.isDisabled();
  const markPaidPendingVisibleMs = Date.now() - markPaidStarted;
  assert.equal(markPaidButtonDisabled, true);
  await capture('mark-paid-inflight');
  await page.waitForTimeout(250);
  assert.equal(p2pMutations.filter((x) => x.path === markPaidPath).length, 1);
  const markPaidResponse = await markPaidPromise;
  const markPaidResponseTimeMs = p2pResponses.findLast(
    (x) => x.method === 'POST' && x.path === markPaidPath,
  )?.responseTimeMs;
  const paidOrder = await markPaidResponse.json();
  const markPaidKey = markPaidResponse.request().headers()['idempotency-key'] ?? '';
  assert.equal(markPaidResponse.status(), 200);
  assert.equal(markPaidResponse.fromServiceWorker(), true);
  assert.equal(paidOrder.status, 'paid');
  assert.match(markPaidKey, /^p2p-mark-paid-/);
  assert.ok(
    markPaidResponseTimeMs >= 1_500 && markPaidResponseTimeMs < 5_000,
    `Expected delayed mark-paid response, got ${markPaidResponseTimeMs} ms.`,
  );
  await page.getByText('Đã thanh toán · Chờ release', { exact: true }).waitFor();

  const initialEscrowPromise = waitResponse(
    (res, url) => url.pathname === '/api/p2p/orders/p2p002' && res.request().method() === 'GET',
  );
  await navigate(route);
  const initialEscrow = await initialEscrowPromise;
  const initialEscrowOrder = await initialEscrow.json();
  await page.getByRole('button', { name: 'Start escrow release' }).waitFor();
  assert.equal(initialEscrow.status(), 200);
  assert.equal(initialEscrowOrder.status, 'paid');
  const challengePromise = waitResponse(
    (res, url) =>
      url.pathname === '/api/p2p/orders/p2p002/release/challenge' &&
      res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Start escrow release' }).click();
  const challengeResponse = await challengePromise;
  const challenge = await challengeResponse.json();
  assert.equal(challengeResponse.status(), 201);
  await page.getByLabel('Release verification code').fill('000000');
  const verifyPromise = waitResponse(
    (res, url) =>
      url.pathname.includes('/release/challenge/') &&
      url.pathname.endsWith('/verify') &&
      res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Verify release code' }).click();
  const verifyResponse = await verifyPromise;
  const verification = await verifyResponse.json();
  assert.equal(verifyResponse.status(), 200);
  assert.ok(verification.verificationToken);

  const releasePromise = waitResponse(
    (res, url) =>
      url.pathname === '/api/p2p/orders/p2p002/release' && res.request().method() === 'POST',
  );
  const releaseStarted = Date.now();
  await page.getByRole('button', { name: 'Confirm escrow release' }).click();
  const releaseButton = page.getByRole('button', { name: 'Confirm escrow release' });
  await page.getByText('Đang release…', { exact: true }).waitFor();
  const releaseButtonDisabled = await releaseButton.isDisabled();
  const releasePendingVisibleMs = Date.now() - releaseStarted;
  assert.equal(releaseButtonDisabled, true);
  await capture('release-inflight');
  await page.waitForTimeout(250);
  assert.equal(p2pMutations.filter((x) => x.path === '/api/p2p/orders/p2p002/release').length, 1);
  const releaseResponse = await releasePromise;
  const releaseResponseTimeMs = p2pResponses.findLast(
    (x) => x.method === 'POST' && x.path === '/api/p2p/orders/p2p002/release',
  )?.responseTimeMs;
  const releasedOrder = await releaseResponse.json();
  const releaseKey = releaseResponse.request().headers()['idempotency-key'] ?? '';
  assert.equal(releaseResponse.status(), 200);
  assert.equal(releaseResponse.fromServiceWorker(), true);
  assert.equal(releasedOrder.status, 'released');
  assert.match(releaseKey, /^p2p-escrow-release-/);
  assert.ok(
    releaseResponseTimeMs >= 1_500 && releaseResponseTimeMs < 5_000,
    `Expected delayed release response, got ${releaseResponseTimeMs} ms.`,
  );
  await page.getByText('Đã release', { exact: true }).waitFor();
  await page.getByText('Escrow released', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Confirm escrow release' }).waitFor({ state: 'detached' });
  const finalEscrowGet = p2pResponses
    .filter((x) => x.method === 'GET' && x.path === '/api/p2p/orders/p2p002')
    .at(-1);
  assert.equal(finalEscrowGet?.status, 200);
  await capture('released');

  const observedOperations = new Set(
    p2pResponses
      .map((x) => {
        if (x.method === 'GET' && x.path === '/api/p2p/ads/ad001') return 'getP2PAd';
        if (x.method === 'POST' && x.path === '/api/p2p/orders') return 'createP2POrder';
        if (x.method === 'GET' && x.path.startsWith('/api/p2p/orders/')) return 'getP2POrder';
        if (x.method === 'POST' && /\/mark-paid$/.test(x.path)) return 'markP2POrderPaid';
        if (x.method === 'POST' && /\/release$/.test(x.path)) return 'releaseP2POrderEscrow';
        if (x.path.endsWith('/release/challenge')) return 'createP2PReleaseChallenge';
        if (x.path.endsWith('/verify')) return 'verifyP2PReleaseChallenge';
        return null;
      })
      .filter(Boolean),
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(requestFailures, []);
  assert.deepEqual(pageErrors, []);
  assert.ok([...p2pResponses].every((x) => x.fromServiceWorker));
  assert.equal(p2pMutations.filter((x) => x.path === '/api/p2p/orders').length, 1);
  assert.equal(p2pMutations.filter((x) => /\/mark-paid$/.test(x.path)).length, 1);
  assert.equal(p2pMutations.filter((x) => /\/release$/.test(x.path)).length, 1);
  assert.ok(createKey && markPaidKey && releaseKey);

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'p2p.pending',
      status: 'passed',
      persona: 'developer (preview only)',
      route,
      additionalRoutes: [createRoute],
      operationIds: ['createP2POrder', 'getP2POrder', 'markP2POrderPaid', 'releaseP2POrderEscrow'],
      observedOperationIds: [
        'createP2POrder',
        'getP2POrder',
        'markP2POrderPaid',
        'releaseP2POrderEscrow',
      ],
      supportingOperationIds: [
        'getP2PAd',
        'createP2PReleaseChallenge',
        'verifyP2PReleaseChallenge',
      ],
      expectedDomainOperationCount: 42,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allP2PResponsesFromServiceWorker: p2pResponses.every((x) => x.fromServiceWorker),
      p2pStateChangesAreLocalPreviewOnly: true,
      externalApiOrigins: [...externalApiOrigins],
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      p2pResponseCount: p2pResponses.length,
      p2pMutationCount: p2pMutations.length,
      createPendingVisibleMs,
      createResponseTimeMs,
      markPaidPendingVisibleMs,
      markPaidResponseTimeMs,
      releasePendingVisibleMs,
      releaseResponseTimeMs,
      totalApiRequestCount: apiRequests.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      ad: {
        status: adResponse.status(),
        fromServiceWorker: adResponse.fromServiceWorker(),
        id: ad.id,
      },
      create: {
        status: createResponse.status(),
        receiptStatus: receipt.status,
        fromServiceWorker: createResponse.fromServiceWorker(),
        idempotencyKeyPresent: Boolean(createKey),
        orderId: receipt.orderId,
        requestCount: 1,
        disabledWhilePending: createButtonDisabled,
        pendingText: 'Đang tạo…',
        pendingVisibleAfterMs: createPendingVisibleMs,
        requestResponseMs: createResponseTimeMs,
      },
      createdOrder: {
        status: createdOrderGet.status(),
        fromServiceWorker: createdOrderGet.fromServiceWorker(),
        id: createdOrder.id,
        orderStatus: createdOrder.status,
        route: createRoute,
      },
      markPaid: {
        status: markPaidResponse.status(),
        fromServiceWorker: markPaidResponse.fromServiceWorker(),
        orderStatus: paidOrder.status,
        idempotencyKeyPresent: Boolean(markPaidKey),
        requestCount: 1,
        disabledWhilePending: markPaidButtonDisabled,
        pendingText: 'Đang cập nhật…',
        pendingVisibleAfterMs: markPaidPendingVisibleMs,
        requestResponseMs: markPaidResponseTimeMs,
      },
      challenge: {
        status: challengeResponse.status(),
        challengeId: challenge.id,
        supportingOnly: true,
      },
      verification: {
        status: verifyResponse.status(),
        verificationTokenIssued: Boolean(verification.verificationToken),
        supportingOnly: true,
      },
      release: {
        status: releaseResponse.status(),
        fromServiceWorker: releaseResponse.fromServiceWorker(),
        orderStatus: releasedOrder.status,
        idempotencyKeyPresent: Boolean(releaseKey),
        requestCount: 1,
        disabledWhilePending: releaseButtonDisabled,
        pendingText: 'Đang release…',
        pendingVisibleAfterMs: releasePendingVisibleMs,
        requestResponseMs: releaseResponseTimeMs,
        finalDetailGetStatus: finalEscrowGet.status,
      },
      observedOperationIds: [...observedOperations],
      p2pResponses,
      p2pMutations,
      requestFailures,
      pageErrors,
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshots).map(([k, v]) => [k, path.basename(v)]),
    ),
    sourceHashes,
    limitations: [
      'All responses and state changes came from the local service worker/MSW; no real backend call or persistence was tested.',
      'The two-second pending window is injected by the local preview handler and is not backend latency.',
      'Pending means client request-in-flight only. OpenAPI declares the eventual create receipt (201 created), mark-paid (200 paid) and release (200 released); it does not define a pending server result for these transitions.',
      'The escrow release flow uses supporting challenge/verify operations outside the p2p.pending matrix operation set; matrix observed operations remain the four linked operations.',
      'Only four of 42 linked P2P operations were observed; UI acceptance, backend authorization, replay semantics and staging remain unverified.',
    ],
  };
  const options = (await prettier.resolveConfig(reportPath)) ?? {};
  await fs.writeFile(
    reportPath,
    await prettier.format(`${JSON.stringify(report, null, 2)}\n`, { ...options, parser: 'json' }),
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}

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
const routes = {
  ad: '/w/p2p/ad/ad001',
  markPaid: '/w/p2p/escrow/p2p001',
  release: '/w/p2p/escrow/p2p002',
};
const screenshots = Object.fromEntries(
  ['create', 'mark-paid', 'release'].map((name) => [
    name,
    path.join(directory, `preview-p2p-duplicate-${name}-${date}${artifactSuffix}.png`),
  ]),
);
const reportPath = path.join(
  directory,
  `p2p-duplicate-browser-check-${date}${artifactSuffix}.json`,
);
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
const hash = async (p) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, p)))
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
const p2pResponses = [];
const p2pMutations = [];
const failures = [];
const apiRequests = [];
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
    failures.push({
      method: request.method(),
      path: url.pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
});
page.on('pageerror', (error) => pageErrors.push(error.message));
const waitResponse = (predicate) =>
  page.waitForResponse((response) => predicate(response, new URL(response.url())));
const navigate = async (route) => {
  await page.evaluate((pathname) => {
    window.history.pushState({}, '', pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
};
async function applyScenario() {
  if (!(await page.getByLabel('Miền API').count()))
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('duplicate');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.duplicate').waitFor();
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
async function settleOneRequest(pathname) {
  await page.waitForTimeout(500);
  assert.equal(
    p2pMutations.filter((item) => item.path === pathname).length,
    1,
    `Expected a single request for ${pathname}.`,
  );
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

  const adPromise = waitResponse(
    (res, url) => url.pathname === '/api/p2p/ads/ad001' && res.request().method() === 'GET',
  );
  await navigate(routes.ad);
  const adResponse = await adPromise;
  const ad = await adResponse.json();
  await page.getByLabel('Fiat amount').fill('500000');
  await page.getByRole('button', { name: 'Xem xác nhận đơn P2P' }).click();
  const createPath = '/api/p2p/orders';
  const createPromise = waitResponse(
    (res, url) => url.pathname === createPath && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirm P2P order' }).click();
  const createResponse = await createPromise;
  const createBody = await createResponse.json();
  const createKey = createResponse.request().headers()['idempotency-key'] ?? '';
  const createRoute = new URL(page.url()).pathname;
  const createMessage =
    'Yêu cầu tạo đơn P2P bị trùng hoặc xung đột (HTTP 409). Hãy kiểm tra danh sách đơn trước khi gửi yêu cầu mới.';
  await page.getByText(createMessage, { exact: true }).waitFor();
  assert.equal(createResponse.status(), 409);
  assert.equal(createResponse.fromServiceWorker(), true);
  assert.ok(createKey);
  assert.equal(createRoute, routes.ad);
  await settleOneRequest(createPath);
  await capture('create');

  const markOrderPath = '/api/p2p/orders/p2p001';
  const markGetPromise = waitResponse(
    (res, url) => url.pathname === markOrderPath && res.request().method() === 'GET',
  );
  await navigate(routes.markPaid);
  const markGet = await markGetPromise;
  const pendingOrder = await markGet.json();
  await page.getByRole('button', { name: 'Mark order paid' }).waitFor();
  assert.equal(markGet.status(), 200);
  assert.equal(pendingOrder.status, 'pending_payment');
  const markPath = `${markOrderPath}/mark-paid`;
  const markPromise = waitResponse(
    (res, url) => url.pathname === markPath && res.request().method() === 'POST',
  );
  const refreshedMarkGetPromise = waitResponse(
    (res, url) => url.pathname === markOrderPath && res.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Mark order paid' }).click();
  const markResponse = await markPromise;
  const markBody = await markResponse.json();
  const markKey = markResponse.request().headers()['idempotency-key'] ?? '';
  const markResponseTimeMs = p2pResponses.findLast(
    (item) => item.method === 'POST' && item.path === markPath,
  )?.responseTimeMs;
  const markMessage =
    'Đơn hàng không thể chuyển sang trạng thái đã thanh toán (HTTP 409). Hãy kiểm tra trạng thái mới nhất trước khi thử lại.';
  await page.getByText(markMessage, { exact: true }).waitFor();
  const refreshedMarkGet = await refreshedMarkGetPromise;
  const refreshedPendingOrder = await refreshedMarkGet.json();
  assert.equal(markResponse.status(), 409);
  assert.equal(markResponse.fromServiceWorker(), true);
  assert.equal(markBody.code, 'P2P_ORDER_CONFLICT');
  assert.ok(markKey);
  assert.equal(refreshedMarkGet.status(), 200);
  assert.equal(refreshedPendingOrder.status, 'pending_payment');
  assert.equal(new URL(page.url()).pathname, routes.markPaid);
  await settleOneRequest(markPath);
  await capture('mark-paid');

  const releaseOrderPath = '/api/p2p/orders/p2p002';
  const releaseGetPromise = waitResponse(
    (res, url) => url.pathname === releaseOrderPath && res.request().method() === 'GET',
  );
  await navigate(routes.release);
  const paidGet = await releaseGetPromise;
  const paidOrder = await paidGet.json();
  await page.getByRole('button', { name: 'Start escrow release' }).waitFor();
  assert.equal(paidGet.status(), 200);
  assert.equal(paidOrder.status, 'paid');
  const challengePath = `${releaseOrderPath}/release/challenge`;
  const challengePromise = waitResponse(
    (res, url) => url.pathname === challengePath && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Start escrow release' }).click();
  const challengeResponse = await challengePromise;
  const challenge = await challengeResponse.json();
  assert.equal(challengeResponse.status(), 201);
  await page.getByLabel('Release verification code').fill('000000');
  const verifyPromise = waitResponse(
    (res, url) => url.pathname.endsWith('/verify') && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Verify release code' }).click();
  const verifyResponse = await verifyPromise;
  const verification = await verifyResponse.json();
  assert.equal(verifyResponse.status(), 200);
  assert.ok(verification.verificationToken);
  const releasePath = `${releaseOrderPath}/release`;
  const releasePromise = waitResponse(
    (res, url) => url.pathname === releasePath && res.request().method() === 'POST',
  );
  const refreshedPaidGetPromise = waitResponse(
    (res, url) => url.pathname === releaseOrderPath && res.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Confirm escrow release' }).click();
  const releaseResponse = await releasePromise;
  const releaseBody = await releaseResponse.json();
  const releaseKey = releaseResponse.request().headers()['idempotency-key'] ?? '';
  const releaseResponseTimeMs = p2pResponses.findLast(
    (item) => item.method === 'POST' && item.path === releasePath,
  )?.responseTimeMs;
  const releaseMessage =
    'Đơn hàng không thể chuyển sang trạng thái đã release (HTTP 409). Hãy kiểm tra trạng thái mới nhất trước khi thử lại.';
  await page.getByText(releaseMessage, { exact: true }).waitFor();
  const refreshedPaidGet = await refreshedPaidGetPromise;
  const stillPaidOrder = await refreshedPaidGet.json();
  assert.equal(releaseResponse.status(), 409);
  assert.equal(releaseResponse.fromServiceWorker(), true);
  assert.equal(releaseBody.code, 'P2P_ORDER_CONFLICT');
  assert.ok(releaseKey);
  assert.equal(refreshedPaidGet.status(), 200);
  assert.equal(stillPaidOrder.status, 'paid');
  assert.equal(new URL(page.url()).pathname, routes.release);
  await settleOneRequest(releasePath);
  await capture('release');

  assert.ok(createBody.code === 'P2P_ORDER_CONFLICT');
  assert.equal(ad.id, 'ad001');
  assert.equal(adResponse.status(), 200);
  assert.equal(adResponse.fromServiceWorker(), true);
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(failures, []);
  assert.deepEqual(pageErrors, []);
  assert.ok(p2pResponses.every((item) => item.fromServiceWorker));
  assert.equal(p2pMutations.filter((item) => item.path === createPath).length, 1);
  assert.equal(p2pMutations.filter((item) => item.path === markPath).length, 1);
  assert.equal(p2pMutations.filter((item) => item.path === releasePath).length, 1);

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'p2p.duplicate',
      status: 'passed',
      persona: 'developer (preview only)',
      route: routes.release,
      additionalRoutes: [routes.ad, routes.markPaid],
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
      allP2PResponsesFromServiceWorker: p2pResponses.every((item) => item.fromServiceWorker),
      localConflictFixturesOnly: true,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      p2pResponseCount: p2pResponses.length,
      p2pMutationCount: p2pMutations.length,
      createConflictResponseMs: p2pResponses.findLast(
        (item) => item.method === 'POST' && item.path === createPath,
      )?.responseTimeMs,
      markPaidConflictResponseMs: markResponseTimeMs,
      releaseConflictResponseMs: releaseResponseTimeMs,
      totalApiRequestCount: apiRequests.length,
      observationWindowAfterEachConflictMs: 500,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      ad: { status: adResponse.status(), id: ad.id },
      create: {
        status: createResponse.status(),
        code: createBody.code,
        idempotencyKeyPresent: Boolean(createKey),
        requestCount: 1,
        conflictGuidanceVisible: true,
        route: createRoute,
        responseTimeMs: p2pResponses.findLast(
          (item) => item.method === 'POST' && item.path === createPath,
        )?.responseTimeMs,
      },
      markPaid: {
        initialOrderStatus: pendingOrder.status,
        status: markResponse.status(),
        code: markBody.code,
        idempotencyKeyPresent: Boolean(markKey),
        requestCount: 1,
        refreshedOrderStatus: refreshedPendingOrder.status,
        conflictGuidanceVisible: true,
        route: routes.markPaid,
        responseTimeMs: markResponseTimeMs,
      },
      release: {
        initialOrderStatus: paidOrder.status,
        challengeStatus: challengeResponse.status(),
        verificationStatus: verifyResponse.status(),
        status: releaseResponse.status(),
        code: releaseBody.code,
        idempotencyKeyPresent: Boolean(releaseKey),
        requestCount: 1,
        refreshedOrderStatus: stillPaidOrder.status,
        conflictGuidanceVisible: true,
        route: routes.release,
        responseTimeMs: releaseResponseTimeMs,
      },
      p2pResponses,
      p2pMutations,
      requestFailures: failures,
      pageErrors,
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshots).map(([key, value]) => [key, path.basename(value)]),
    ),
    sourceHashes,
    limitations: [
      'All conflict responses came from local MSW; this does not prove backend conflict or idempotency enforcement.',
      'The UI preserved each route, displayed guidance, refreshed the known order after mark-paid/release conflicts, and sent each conflict mutation once during a 500 ms observation window.',
      'A required Idempotency-Key being sent does not prove deduplication, same-key replay, persistence or safe unknown-outcome recovery.',
      'Four of 42 linked P2P operations were observed; challenge/verify were supporting local operations.',
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

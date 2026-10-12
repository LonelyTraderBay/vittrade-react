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
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname),
  'Only a loopback preview is allowed.',
);
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
const screenshotPath = path.join(
  evidenceDirectory,
  `preview-p2p-unauthorized-login-${date}${artifactSuffix}.png`,
);
const reportPath = path.join(
  evidenceDirectory,
  `p2p-unauthorized-browser-check-${date}${artifactSuffix}.json`,
);
const sourceFiles = [
  'contracts/openapi/p2p.yaml',
  'contracts/openapi/auth.yaml',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/p2p/api/p2p-api.ts',
  'src/features/p2p/model/p2p-order-queries.ts',
  'src/features/p2p/pages/P2POrdersContractPage.tsx',
  'src/features/p2p/routes.ts',
  'src/shared/api/http-client.ts',
  'docs/architecture/production-readiness/evidence/A06/run-p2p-unauthorized-browser-check.mjs',
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
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const externalApiOrigins = new Set();
const pageErrors = [];
const p2pResponses = [];
const authRefreshResponses = [];
const p2pRequestFailures = [];
const p2pMutations = [];
const apiRequests = [];
const responseTasks = [];

page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.protocol.startsWith('http') && url.origin !== originUrl) {
    if (request.headers().accept?.includes('application/json') || url.pathname.includes('/api/')) {
      externalApiOrigins.add(url.origin);
    }
  }
  if (url.pathname.startsWith('/api/'))
    apiRequests.push({ method: request.method(), path: url.pathname });
  if (url.pathname.startsWith('/api/p2p/') && request.method() !== 'GET') {
    p2pMutations.push({ method: request.method(), path: url.pathname });
  }
});
page.on('response', (response) => {
  const task = (async () => {
    const url = new URL(response.url());
    const item = {
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    };
    if (url.pathname === '/api/p2p/orders') p2pResponses.push(item);
    if (url.pathname === '/api/auth/refresh') {
      item.body = await response.json();
      authRefreshResponses.push(item);
    }
  })();
  responseTasks.push(task);
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

async function applyP2PUnauthorizedScenario() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.unauthorized').waitFor();
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
  await applyP2PUnauthorizedScenario();
  await signInDeveloperThroughPreview();

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by its local service worker.',
  );

  const orderListStartedAt = Date.now();
  await navigateWithinSpa('/w/p2p/order-room');
  await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
  const loginRedirectMs = Date.now() - orderListStartedAt;
  const loginPath = new URL(page.url()).pathname;
  const staleOrderVisible =
    (await page.getByText('#VT-P2P-20240223-001', { exact: true }).count()) > 0;
  const orderListErrorVisible =
    (await page.getByText('Unable to load P2P orders', { exact: true }).count()) > 0;
  await Promise.all(responseTasks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  assert.equal(loginPath, '/auth/login');
  assert.equal(p2pResponses.length, 1);
  assert.equal(p2pResponses[0].method, 'GET');
  assert.equal(p2pResponses[0].status, 401);
  assert.equal(p2pResponses[0].fromServiceWorker, true);
  assert.equal(authRefreshResponses.length, 1);
  assert.equal(authRefreshResponses[0].method, 'POST');
  assert.equal(authRefreshResponses[0].status, 200);
  assert.equal(authRefreshResponses[0].body, null);
  assert.equal(authRefreshResponses[0].fromServiceWorker, true);
  assert.equal(staleOrderVisible, false);
  assert.equal(orderListErrorVisible, false);
  assert.deepEqual(p2pMutations, []);
  assert.deepEqual(p2pRequestFailures, []);
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
      id: 'p2p.unauthorized',
      status: 'passed',
      persona: 'developer (preview only)',
      protectedRoute: '/w/p2p/order-room',
      resultRoute: loginPath,
      operationIds: ['listP2POrders'],
      expectedDomainOperationCount: 42,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: p2pResponses
        .concat(authRefreshResponses)
        .every((item) => item.fromServiceWorker),
      realBackendRequestSent: false,
      externalApiOrigins: [...externalApiOrigins],
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      loginRedirectMs,
      p2pResponseCount: p2pResponses.length,
      authRefreshResponseCount: authRefreshResponses.length,
      totalApiRequestCount: apiRequests.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      listP2POrders: p2pResponses,
      authRefresh: authRefreshResponses,
      loginRedirect: { route: loginPath, staleOrderVisible, orderListErrorVisible },
      p2pMutations,
      p2pRequestFailures,
      pageErrors,
    },
    screenshot: path.basename(screenshotPath),
    sourceHashes,
    limitations: [
      'GET /p2p/orders declares 401 in the P2P OpenAPI contract. The local service worker returns the contract-defined 200/null response for POST /auth/refresh; this is preview behavior and does not verify backend session revocation.',
      'Local Chromium/MSW evidence does not verify backend authorization, session revocation, persistence, staging or user acceptance.',
      'Only listP2POrders was observed, one of 42 linked P2P operations; coverage remains representative.',
      'The /w/p2p/my-orders route alias is not included in this fresh run.',
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

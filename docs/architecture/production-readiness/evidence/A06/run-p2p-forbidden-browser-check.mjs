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
  `preview-p2p-forbidden-escrow-${date}${artifactSuffix}.png`,
);
const reportPath = path.join(
  evidenceDirectory,
  `p2p-forbidden-browser-check-${date}${artifactSuffix}.json`,
);
const sourceFiles = [
  'contracts/openapi/p2p.yaml',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/p2p/api/p2p-api.ts',
  'src/features/p2p/model/p2p-queries.ts',
  'src/features/p2p/pages/P2PEscrowDetailPage.tsx',
  'src/features/p2p/routes.ts',
  'docs/architecture/production-readiness/evidence/A06/run-p2p-forbidden-browser-check.mjs',
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
const p2pRequestFailures = [];
const p2pMutations = [];
const apiRequests = [];

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

async function applyP2PForbiddenScenario() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.forbidden').waitFor();
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
  await applyP2PForbiddenScenario();
  await signInDeveloperThroughPreview();

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by its local service worker.',
  );

  const startedRouteAt = Date.now();
  const orderResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/p2p/orders/p2p002' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/p2p/escrow/p2p002');
  const orderResponse = await orderResponsePromise;
  await page.getByRole('button', { name: 'Start escrow release', exact: true }).waitFor();

  const challengeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/p2p/orders/p2p002/release/challenge' &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Start escrow release', exact: true }).click();
  const challengeResponse = await challengeResponsePromise;
  await page
    .getByText('Không có quyền tạo thử thách xác thực release escrow.', { exact: true })
    .waitFor();
  const route = new URL(page.url()).pathname;
  const previewPanelToggle = page.getByRole('button', { name: 'Thu gọn' });
  if ((await previewPanelToggle.count()) > 0) await previewPanelToggle.click();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const verifyRequests = p2pResponses.filter((item) => item.path.includes('/verify'));
  const releaseRequests = p2pResponses.filter((item) => item.path.endsWith('/release'));
  assert.equal(orderResponse.status(), 200);
  assert.equal(orderResponse.fromServiceWorker(), true);
  assert.equal(challengeResponse.status(), 403);
  assert.equal(challengeResponse.fromServiceWorker(), true);
  assert.equal(route, '/w/p2p/escrow/p2p002');
  assert.equal(p2pResponses.length, 2);
  assert.equal(p2pMutations.length, 1);
  assert.equal(p2pMutations[0].path, '/api/p2p/orders/p2p002/release/challenge');
  assert.deepEqual(verifyRequests, []);
  assert.deepEqual(releaseRequests, []);
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
      id: 'p2p.forbidden',
      status: 'passed',
      persona: 'developer (preview only)',
      route,
      operationIds: ['getP2POrder', 'createP2PReleaseChallenge'],
      expectedDomainOperationCount: 42,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allP2PResponsesFromServiceWorker: p2pResponses.every((item) => item.fromServiceWorker),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      orderAndChallengeFlowMs: Date.now() - startedRouteAt,
      p2pResponseCount: p2pResponses.length,
      p2pMutationCount: p2pMutations.length,
      verifyRequestCount: verifyRequests.length,
      releaseRequestCount: releaseRequests.length,
      totalApiRequestCount: apiRequests.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      getP2POrder: {
        method: orderResponse.request().method(),
        path: new URL(orderResponse.url()).pathname,
        status: orderResponse.status(),
        fromServiceWorker: orderResponse.fromServiceWorker(),
      },
      createP2PReleaseChallenge: {
        method: challengeResponse.request().method(),
        path: new URL(challengeResponse.url()).pathname,
        status: challengeResponse.status(),
        fromServiceWorker: challengeResponse.fromServiceWorker(),
        permissionDeniedMessageVisible: true,
      },
      verifyRequests,
      releaseRequests,
      route,
      p2pResponses,
      p2pMutations,
      p2pRequestFailures,
      pageErrors,
    },
    screenshot: path.basename(screenshotPath),
    sourceHashes,
    limitations: [
      'The OpenAPI contract declares 403 for createP2PReleaseChallenge. The response and least-privilege boundary are still exercised through local MSW only, not backend authorization.',
      'Only getP2POrder and createP2PReleaseChallenge were observed, two of 42 linked P2P operations; coverage remains representative.',
      'No challenge verification or escrow release was sent. This does not establish user acceptance or the /w/p2p/my-orders alias.',
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

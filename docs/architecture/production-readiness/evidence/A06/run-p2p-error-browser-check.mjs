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
const evidenceRunSuffix = process.env.EVIDENCE_RUN_SUFFIX?.trim() ?? '';
assert.match(
  evidenceRunSuffix,
  /^[a-z0-9][a-z0-9-]{0,39}$/i,
  'EVIDENCE_RUN_SUFFIX must be a short filename-safe label.',
);
const artifactDate = evidenceRunSuffix ? `${date}-${evidenceRunSuffix}` : date;
const beforeRetryScreenshot = path.join(
  evidenceDirectory,
  `preview-p2p-error-before-retry-${artifactDate}.png`,
);
const afterRetryScreenshot = path.join(
  evidenceDirectory,
  `preview-p2p-error-after-retry-${artifactDate}.png`,
);
const reportPath = path.join(evidenceDirectory, `p2p-error-browser-check-${artifactDate}.json`);
const sourceFiles = [
  'contracts/openapi/p2p.yaml',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/p2p/api/p2p-api.ts',
  'src/features/p2p/model/p2p-order-queries.ts',
  'src/features/p2p/pages/P2POrdersContractPage.tsx',
  'src/features/p2p/routes.ts',
  'docs/architecture/production-readiness/evidence/A06/run-p2p-error-browser-check.mjs',
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
page.setDefaultTimeout(20_000);

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

async function applyP2PErrorScenario() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.error').waitFor();
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

async function waitForRequestFailureCount(count) {
  const deadline = Date.now() + 15_000;
  while (p2pRequestFailures.length < count && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(p2pRequestFailures.length, count, `Expected ${count} failed P2P requests.`);
}

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await applyP2PErrorScenario();
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
  await page.getByText('Unable to load P2P orders', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
  const initialErrorVisibleMs = Date.now() - orderListStartedAt;
  await waitForRequestFailureCount(6);
  const initialFailureCount = p2pRequestFailures.length;
  const previewPanelToggle = page.getByRole('button', { name: 'Thu gọn' });
  if ((await previewPanelToggle.count()) > 0) await previewPanelToggle.click();
  await page.screenshot({ path: beforeRetryScreenshot, fullPage: true });

  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await waitForRequestFailureCount(initialFailureCount + 6);
  await page.getByText('Unable to load P2P orders', { exact: true }).waitFor();
  const retryCompletedMs = Date.now() - orderListStartedAt;
  await page.screenshot({ path: afterRetryScreenshot, fullPage: true });
  const route = new URL(page.url()).pathname;
  const emptyMessageVisible =
    (await page.getByText('No P2P orders yet.', { exact: true }).count()) > 0;
  const successCountVisible =
    (await page.getByText(/orders · contract-backed/, { exact: false }).count()) > 0;

  assert.equal(route, '/w/p2p/order-room');
  assert.equal(initialFailureCount, 6);
  assert.equal(p2pResponses.length, 0, 'The P2P error scenario must not invent an HTTP status.');
  assert.equal(p2pRequestFailures.length, initialFailureCount + 6);
  assert.ok(p2pRequestFailures.every((item) => item.path === '/api/p2p/orders'));
  assert.ok(p2pRequestFailures.every((item) => item.method === 'GET'));
  assert.ok(p2pRequestFailures.every((item) => Boolean(item.error)));
  assert.equal(emptyMessageVisible, false);
  assert.equal(successCountVisible, false);
  assert.deepEqual(p2pMutations, []);
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
      id: 'p2p.error',
      status: 'passed',
      persona: 'developer (preview only)',
      route,
      operationIds: ['listP2POrders'],
      expectedDomainOperationCount: 42,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      transportFailureNoHttpResponse: p2pResponses.length === 0,
      p2pMutations,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      initialErrorVisibleMs,
      initialP2pRequestFailureCount: initialFailureCount,
      retryP2pRequestFailureCount: p2pRequestFailures.length - initialFailureCount,
      retryCompletedMs,
      totalP2pRequestFailureCount: p2pRequestFailures.length,
      totalApiRequestCount: apiRequests.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      errorState: {
        titleVisible: true,
        retryVisibleBeforeRetry: true,
        retryVisibleAfterRetry: true,
        emptyMessageVisible,
        successCountVisible,
        route,
      },
      p2pResponses,
      p2pMutations,
      p2pRequestFailures,
      pageErrors,
    },
    screenshots: [path.basename(beforeRetryScreenshot), path.basename(afterRetryScreenshot)],
    sourceHashes,
    limitations: [
      'The P2P GET /p2p/orders contract declares no 5xx; this scenario uses a local statusless transport failure for that read and leaves mutation handlers unchanged.',
      'Local Chromium/MSW evidence does not verify backend persistence, authorization enforcement, staging or user acceptance.',
      'Only listP2POrders was observed, one of 42 linked P2P operations; coverage remains representative.',
      'The separate /w/p2p/my-orders route alias is not included in this fresh run.',
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

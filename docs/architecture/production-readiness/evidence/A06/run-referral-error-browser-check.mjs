import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Loopback preview only.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const runId = Date.now();
const expectedAttemptsPerCycle = Number(process.env.REFERRAL_ERROR_EXPECTED_ATTEMPTS ?? 3);
assert.ok(Number.isInteger(expectedAttemptsPerCycle) && expectedAttemptsPerCycle > 0);
const errorScreenshotPath = path.join(directory, `preview-referral-error-${date}-${runId}.png`);
const retryScreenshotPath = path.join(
  directory,
  `preview-referral-error-after-retry-${date}-${runId}.png`,
);
const reportPath = path.join(directory, `referral-error-browser-check-${date}-${runId}.json`);
const sourceFiles = [
  'contracts/openapi/referral.yaml',
  'src/app/routes.ts',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/dev/mocks/referral-fixtures.ts',
  'src/features/referral/api/referral-api.ts',
  'src/features/referral/model/referral-queries.ts',
  'src/features/referral/model/referral-types.ts',
  'src/features/referral/pages/ReferralContractPage.tsx',
  'src/features/referral/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/api-error.ts',
  'src/shared/api/query-client.ts',
  'src/shared/ui/ErrorState.tsx',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-referral-error-browser-check.mjs',
];
const sha256 = async (file) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, file)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await sha256(file)])),
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
const apiResponses = [];
const apiFailures = [];
const externalApiOrigins = new Set();
const requestStartedAt = new WeakMap();
const referralPath = '/api/referral/overview';
const isReferralOperation = (method, pathname) =>
  pathname.endsWith(referralPath) && ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
  if (url.origin !== originUrl) externalApiOrigins.add(url.origin);
  apiRequests.push({ method: request.method(), path: url.pathname, url: request.url() });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiResponses.push({
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    elapsedMs: Date.now() - (requestStartedAt.get(response.request()) ?? Date.now()),
  });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiFailures.push({
    method: request.method(),
    path: url.pathname,
    error: request.failure()?.errorText ?? 'unknown',
  });
});
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.addInitScript(() => {
  const originalFetch = window.fetch.bind(window);
  Object.defineProperty(window, '__referralTransportAttempts', {
    configurable: true,
    value: [],
  });
  window.fetch = async (input, init) => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const request = input instanceof Request ? input : null;
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const url = new URL(requestUrl, window.location.href);
    if (
      url.origin === window.location.origin &&
      url.pathname === '/api/referral/overview' &&
      method === 'GET'
    ) {
      window.__referralTransportAttempts.push({
        method,
        path: url.pathname,
        errorText: 'Failed to fetch',
        source: 'runner-scoped pre-network fetch rejection',
      });
      throw new TypeError('Failed to fetch');
    }
    return originalFetch(input, init);
  };
});

const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('referral');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.error').waitFor();

  if (!(await page.getByLabel('Tài khoản xem trước').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();

  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'The local preview service worker must control the page.',
  );

  apiRequests.length = 0;
  apiResponses.length = 0;
  apiFailures.length = 0;
  externalApiOrigins.clear();
  pageErrors.length = 0;
  await page.evaluate(() => {
    window.__referralTransportAttempts.length = 0;
  });

  const scenarioStartedAt = Date.now();
  await navigate('/w/referral');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const retryButton = page.getByRole('button', { name: 'Thử lại' });
  await retryButton.waitFor({ state: 'visible' });
  assert.equal(new URL(page.url()).pathname, '/w/referral');
  const initialTransportAttempts = await page.evaluate(() => [
    ...window.__referralTransportAttempts,
  ]);
  assert.equal(initialTransportAttempts.length, expectedAttemptsPerCycle);
  assert.equal(
    (await page.getByText('Invite friends and earn commission', { exact: true }).count()) === 0,
    true,
  );
  await page.screenshot({ path: errorScreenshotPath, fullPage: true });

  const countBeforeManualRetry = initialTransportAttempts.length;
  const manualRetryStartedAt = Date.now();
  await retryButton.click();
  await page.waitForFunction(
    (targetCount) => window.__referralTransportAttempts.length >= targetCount,
    countBeforeManualRetry + expectedAttemptsPerCycle,
  );
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  await retryButton.waitFor({ state: 'visible' });
  assert.equal(new URL(page.url()).pathname, '/w/referral');
  assert.equal(
    (await page.getByText('Invite friends and earn commission', { exact: true }).count()) === 0,
    true,
  );
  await page.screenshot({ path: retryScreenshotPath, fullPage: true });

  const transportAttempts = await page.evaluate(() => [...window.__referralTransportAttempts]);
  const retryTransportAttempts = transportAttempts.slice(initialTransportAttempts.length);
  const targetRequests = apiRequests.filter((request) =>
    isReferralOperation(request.method, request.path),
  );
  const targetResponses = apiResponses.filter((item) =>
    isReferralOperation(item.method, item.path),
  );
  const targetFailures = apiFailures.filter((item) => isReferralOperation(item.method, item.path));
  assert.equal(transportAttempts.length, expectedAttemptsPerCycle * 2);
  assert.equal(retryTransportAttempts.length, expectedAttemptsPerCycle);
  assert.equal(
    targetRequests.length,
    0,
    'Synthetic transport failure must happen before network dispatch.',
  );
  assert.equal(targetResponses.length, 0, 'A transport failure must not create an HTTP response.');
  assert.equal(targetFailures.length, 0);
  assert.equal(
    transportAttempts.every((item) => item.method === 'GET'),
    true,
  );
  assert.equal(new URL(page.url()).pathname, '/w/referral');
  assert.equal(apiRequests.filter((request) => request.method !== 'GET').length, 0);
  assert.equal(pageErrors.length, 0);
  assert.equal(externalApiOrigins.size, 0);

  const retryPolicyObservation = {
    sourcePolicy: {
      httpClientMaxRetriesForIdempotentGet: 2,
      appQueryDefaultRetriesAfterFailure: 1,
      expectedFetchAttemptsPerQueryExecution: expectedAttemptsPerCycle,
    },
    observedFetchAttemptsPerExecution: {
      initialFailure: initialTransportAttempts.length,
      afterOneManualRetry: retryTransportAttempts.length,
    },
    observedCountsMatchExpected:
      initialTransportAttempts.length === expectedAttemptsPerCycle &&
      retryTransportAttempts.length === expectedAttemptsPerCycle,
    interpretation:
      expectedAttemptsPerCycle === 6
        ? 'Diagnostic baseline: each query execution performs three HTTP-client fetch attempts and React Query retries once, producing six attempts per failed execution.'
        : 'After assigning the query retry budget to the HTTP client, each execution performs three fetch attempts; a user-triggered Retry begins one new three-attempt execution.',
  };

  const sidecar = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'referral.error',
      status: 'passed',
      persona: 'developer (preview only)',
      operationIds: ['getReferralOverview'],
      observedOperationIds: ['getReferralOverview'],
      expectedDomainOperationCount: 1,
      coverage: 'full_browser_observed_one_of_one_operations',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      referralFailureInjection: 'window.fetch rejects before network dispatch',
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins].sort(),
    },
    authorizationLimitations: {
      persona: 'developer',
      referralReadScopeEnforcedByMsw: false,
      backendAuthorizationVerified: false,
    },
    retryPolicyObservation,
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      scenarioFlowMs: Date.now() - scenarioStartedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      apiRequestFailureCount: apiFailures.length,
      initialTransportFailureCount: initialTransportAttempts.length,
      manualRetryTransportFailureCount: retryTransportAttempts.length,
      referralOverviewFetchAttemptCount: transportAttempts.length,
      referralOverviewRequestCount: transportAttempts.length,
      referralOverviewResponseCount: targetResponses.length,
      referralOverviewResponseStatuses: targetResponses.map((item) => item.status),
      referralWriteCount: transportAttempts.filter((request) => request.method !== 'GET').length,
      externalApiOriginCount: externalApiOrigins.size,
      pageErrorCount: pageErrors.length,
      friendCount: 0,
      manualRetryDurationMs: Date.now() - manualRetryStartedAt,
    },
    assertions: {
      route: '/w/referral',
      referralTransportFailuresBeforeNetwork: true,
      referralHttpResponseCount: 0,
      initialAttemptsMatchExpected: initialTransportAttempts.length === expectedAttemptsPerCycle,
      manualRetryAttemptsMatchExpected: retryTransportAttempts.length === expectedAttemptsPerCycle,
      visibleErrorState: true,
      visibleRetryAction: true,
      routePreservedAfterError: true,
      successDataAbsentAfterRetry: true,
      errorStateRemainsVisibleAfterManualRetry: true,
      noReferralWrites: true,
      pageErrors: pageErrors,
    },
    screenshots: {
      errorState: path.basename(errorScreenshotPath),
      afterManualRetry: path.basename(retryScreenshotPath),
    },
    sourceHashes,
    limitations: [
      'Referral OpenAPI declares 200 and 401 but no 5xx; this runner injects TypeError before network dispatch and records fetch attempts without inventing an HTTP response.',
      'The attempt count is local configuration evidence, not a real backend outage or a production load recommendation.',
      'The manual Retry keeps the preview in error state; successful recovery is covered separately by referral.success and was not tested in this error scenario.',
      'MSW does not enforce referral read authorization; this does not verify server permissions, persistence, user acceptance, or real invite-link behavior.',
      'Only the read operation getReferralOverview ran; the displayed invite URL was not opened or copied.',
    ],
  };
  await fs.writeFile(reportPath, `${JSON.stringify(sidecar, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        report: path.relative(root, reportPath),
        screenshots: [errorScreenshotPath, retryScreenshotPath].map((file) =>
          path.relative(root, file),
        ),
        checkedAt,
        measurements: sidecar.measurements,
        sourceHashCount: Object.keys(sourceHashes).length,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await browser.close();
}

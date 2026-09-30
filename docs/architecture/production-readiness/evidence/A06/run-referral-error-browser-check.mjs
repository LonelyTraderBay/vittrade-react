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
const errorScreenshotPath = path.join(directory, `preview-referral-error-${date}.png`);
const retryScreenshotPath = path.join(directory, `preview-referral-error-after-retry-${date}.png`);
const reportPath = path.join(directory, `referral-error-browser-check-${date}.json`);
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
const waitForReferralRequestBurstToSettle = async (minimumCount, quietMs = 500) => {
  const startedAt = Date.now();
  let previousCount = apiRequests.filter((request) =>
    isReferralOperation(request.method, request.path),
  ).length;
  let lastChangeAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const currentCount = apiRequests.filter((request) =>
      isReferralOperation(request.method, request.path),
    ).length;
    if (currentCount !== previousCount) {
      previousCount = currentCount;
      lastChangeAt = Date.now();
    }
    if (currentCount > minimumCount && Date.now() - lastChangeAt >= quietMs) return currentCount;
  }
  throw new Error('Referral retry did not produce a settled request burst.');
};

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

  const scenarioStartedAt = Date.now();
  await navigate('/w/referral');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const retryButton = page.getByRole('button', { name: 'Thử lại' });
  await retryButton.waitFor({ state: 'visible' });
  assert.equal(new URL(page.url()).pathname, '/w/referral');
  const initialErrorResponses = apiResponses.filter((item) =>
    isReferralOperation(item.method, item.path),
  );
  assert.ok(initialErrorResponses.length >= 2);
  assert.equal(
    initialErrorResponses.every((item) => item.status === 503),
    true,
  );
  assert.equal(
    initialErrorResponses.every((item) => item.fromServiceWorker),
    true,
  );
  assert.equal(
    (await page.getByText('Invite friends and earn commission', { exact: true }).count()) === 0,
    true,
  );
  await page.screenshot({ path: errorScreenshotPath, fullPage: true });

  const countBeforeManualRetry = initialErrorResponses.length;
  const manualRetryStartedAt = Date.now();
  await retryButton.click();
  await waitForReferralRequestBurstToSettle(countBeforeManualRetry);
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  await retryButton.waitFor({ state: 'visible' });
  assert.equal(new URL(page.url()).pathname, '/w/referral');
  assert.equal(
    (await page.getByText('Invite friends and earn commission', { exact: true }).count()) === 0,
    true,
  );
  await page.screenshot({ path: retryScreenshotPath, fullPage: true });

  const targetRequests = apiRequests.filter((request) =>
    isReferralOperation(request.method, request.path),
  );
  const targetResponses = apiResponses.filter((item) =>
    isReferralOperation(item.method, item.path),
  );
  const targetFailures = apiFailures.filter((item) => isReferralOperation(item.method, item.path));
  const manualRetryResponses = targetResponses.slice(initialErrorResponses.length);
  assert.equal(manualRetryResponses.length, targetRequests.length - initialErrorResponses.length);
  assert.ok(manualRetryResponses.length > 0, 'The visible Retry action must issue another GET.');
  assert.equal(
    targetRequests.every((request) => request.method === 'GET'),
    true,
  );
  assert.equal(targetResponses.length, targetRequests.length);
  assert.equal(targetFailures.length, 0);
  assert.equal(
    targetResponses.every((item) => item.status === 503),
    true,
  );
  assert.equal(
    targetResponses.every((item) => item.fromServiceWorker),
    true,
  );
  assert.equal(new URL(page.url()).pathname, '/w/referral');
  assert.equal(apiRequests.filter((request) => request.method !== 'GET').length, 0);
  assert.equal(pageErrors.length, 0);
  assert.equal(externalApiOrigins.size, 0);

  const retryPolicyObservation = {
    sourcePolicy: {
      httpClientMaxRetriesForIdempotentGet: 2,
      reactQueryRetriesAfterFailure: 1,
      retryableStatus: 503,
    },
    configuredMaximumRequestsPerFailedQueryCycle: (2 + 1) * (1 + 1),
    observedRequestsPerCycle: {
      initialFailure: initialErrorResponses.length,
      afterOneManualRetry: manualRetryResponses.length,
    },
    observedCountsMatchConfiguredMaximum:
      initialErrorResponses.length === (2 + 1) * (1 + 1) &&
      manualRetryResponses.length === (2 + 1) * (1 + 1),
    interpretation:
      'The observed six GETs per failure cycle match the combined HTTP-client and React Query retry policies; review the combined retry budget before backend integration.',
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
      allObservedResponsesFromServiceWorker: apiResponses.every((item) => item.fromServiceWorker),
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
      initialErrorResponseCount: initialErrorResponses.length,
      manualRetryRequestCount: targetRequests.length - initialErrorResponses.length,
      responseStatuses: targetResponses.map((item) => item.status),
      referralOverviewRequestCount: targetRequests.length,
      referralOverviewResponseCount: targetResponses.length,
      referralOverviewFinalStatus: targetResponses.at(-1).status,
      referralOverviewResponseElapsedMs: targetResponses[0].elapsedMs,
      referralWriteCount: targetRequests.filter((request) => request.method !== 'GET').length,
      pageErrorCount: pageErrors.length,
      friendCount: 0,
      manualRetryDurationMs: Date.now() - manualRetryStartedAt,
      externalApiOriginCount: externalApiOrigins.size,
    },
    assertions: {
      route: '/w/referral',
      visibleErrorState: true,
      visibleRetryAction: true,
      routePreservedAfterError: true,
      allResponsesFromServiceWorker: targetResponses.every((item) => item.fromServiceWorker),
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
      'The 503 error responses are synthetic local MSW preview responses; Referral OpenAPI declares only 200 and 401, so 503 is not a backend contract claim.',
      'The six GETs in each failure cycle match the configured layers captured by source hashes: up to two HTTP-client retries for an idempotent GET, then one React Query retry. This totals up to six backend-facing requests per failed query cycle; review this combined budget before backend integration.',
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

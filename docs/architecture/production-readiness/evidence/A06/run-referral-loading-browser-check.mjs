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
const loadingScreenshotPath = path.join(directory, `preview-referral-loading-pending-${date}.png`);
const resultScreenshotPath = path.join(directory, `preview-referral-loading-resolved-${date}.png`);
const reportPath = path.join(directory, `referral-loading-browser-check-${date}.json`);
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
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-referral-loading-browser-check.mjs',
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
let referralResponseObservedAt;
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
  if (url.pathname.endsWith(referralPath)) referralResponseObservedAt ??= Date.now();
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.loading').waitFor();

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
  assert.equal(serviceWorkerControlled, true, 'The local preview service worker must control the page.');

  apiRequests.length = 0;
  apiResponses.length = 0;
  apiFailures.length = 0;
  externalApiOrigins.clear();
  pageErrors.length = 0;
  referralResponseObservedAt = undefined;

  const requestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return request.method() === 'GET' && url.pathname.endsWith(referralPath);
  });
  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return response.request().method() === 'GET' && url.pathname.endsWith(referralPath);
  });
  const scenarioStartedAt = Date.now();
  await navigate('/w/referral');
  const referralRequest = await requestPromise;
  const requestObservedAt = requestStartedAt.get(referralRequest);
  assert.ok(requestObservedAt, 'The Referral overview GET must be observed before loading UI.');
  await page.getByText('Đang tải dữ liệu Referral API…', { exact: true }).waitFor({
    state: 'visible',
  });
  const loadingObservedAt = Date.now();
  const noEmptyStateWhileLoading =
    (await page.getByText('Chưa có người được giới thiệu. Hãy chia sẻ mã để bắt đầu.', {
      exact: true,
    }).count()) === 0;
  assert.equal(noEmptyStateWhileLoading, true);
  await page.screenshot({ path: loadingScreenshotPath, fullPage: true });
  await page.waitForTimeout(250);
  assert.equal(
    referralResponseObservedAt,
    undefined,
    'The UI must remain in loading state before the delayed response arrives.',
  );
  const response = await responsePromise;
  const responseObservedAt = referralResponseObservedAt;
  assert.ok(responseObservedAt);
  assert.equal(response.status(), 200);
  assert.equal(response.fromServiceWorker(), true);
  const overview = await response.json();
  assert.ok(overview.referralCode);
  assert.ok(overview.currentTier?.name);
  assert.ok(overview.campaign?.title);
  assert.ok(Array.isArray(overview.friends));

  const referralLink = `https://vittrade.app/ref/${overview.referralCode}`;
  await page.getByText('Invite friends and earn commission', { exact: true }).waitFor({
    state: 'visible',
  });
  await page.getByText(overview.campaign.title, { exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Invite friends and earn commission', { exact: true }).waitFor({
    state: 'visible',
  });
  await page.getByText(overview.campaign.bonusLabel, { exact: true }).waitFor({ state: 'visible' });
  await page.getByText(referralLink, { exact: true }).waitFor({ state: 'visible' });
  await page.getByText(`$${overview.stats.totalCommission.toFixed(2)}`, { exact: true }).waitFor({
    state: 'visible',
  });
  if (overview.friends.length > 0) {
    await page.getByText(overview.friends[0].name, { exact: true }).waitFor({ state: 'visible' });
  }
  await page.screenshot({ path: resultScreenshotPath, fullPage: true });

  const targetRequests = apiRequests.filter((request) =>
    isReferralOperation(request.method, request.path),
  );
  const targetResponses = apiResponses.filter((item) =>
    isReferralOperation(item.method, item.path),
  );
  const targetFailures = apiFailures.filter((item) =>
    isReferralOperation(item.method, item.path),
  );
  assert.equal(targetRequests.length, 1, 'Referral success should issue one overview GET.');
  assert.equal(targetRequests[0].method, 'GET');
  assert.equal(targetResponses.length, 1);
  assert.equal(targetFailures.length, 0);
  assert.equal(targetResponses[0].status, 200);
  assert.equal(targetResponses[0].fromServiceWorker, true);
  assert.equal(apiRequests.filter((request) => request.method !== 'GET').length, 0);
  assert.equal(pageErrors.length, 0);
  assert.equal(externalApiOrigins.size, 0);

  const sidecar = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'referral.loading',
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
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      scenarioFlowMs: Date.now() - scenarioStartedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      apiRequestFailureCount: apiFailures.length,
      loadingVisibleMsBeforeResponse: responseObservedAt - loadingObservedAt,
      responseObservedAfterRequestMs: responseObservedAt - requestObservedAt,
      referralOverviewRequestCount: targetRequests.length,
      referralOverviewResponseCount: targetResponses.length,
      referralOverviewStatus: targetResponses[0].status,
      referralOverviewResponseElapsedMs: targetResponses[0].elapsedMs,
      referralWriteCount: targetRequests.filter((request) => request.method !== 'GET').length,
      pageErrorCount: pageErrors.length,
      friendCount: overview.friends.length,
      externalApiOriginCount: externalApiOrigins.size,
    },
    assertions: {
      route: '/w/referral',
      visibleLoadingStateBeforeResponse: true,
      noEmptyStateWhileLoading,
      pendingScreenshot: path.basename(loadingScreenshotPath),
      responseFromServiceWorker: targetResponses[0].fromServiceWorker,
      renderedReferralCode: overview.referralCode,
      renderedCurrentTier: overview.currentTier.name,
      renderedCampaign: overview.campaign.title,
      renderedCommission: `$${overview.stats.totalCommission.toFixed(2)}`,
      renderedFirstFriend: overview.friends[0]?.name ?? null,
      inviteLink: referralLink,
      noReferralWrites: true,
      pageErrors: pageErrors,
    },
    screenshots: {
      pending: path.basename(loadingScreenshotPath),
      overview: path.basename(resultScreenshotPath),
    },
    sourceHashes,
    limitations: [
      'The overview response and all timing measurements come from local service-worker-controlled MSW fixtures, not a backend or staging environment.',
      'MSW does not enforce referral read authorization; this does not verify server permissions, persistence, user acceptance, or real invite-link behavior.',
      'Only the declared read operation getReferralOverview ran; the displayed invite URL was not opened or copied.',
    ],
  };
  await fs.writeFile(reportPath, `${JSON.stringify(sidecar, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({
      report: path.relative(root, reportPath),
      screenshots: [loadingScreenshotPath, resultScreenshotPath].map((file) =>
        path.relative(root, file),
      ),
      checkedAt,
      measurements: sidecar.measurements,
      sourceHashCount: Object.keys(sourceHashes).length,
    }, null, 2)}\n`,
  );
} finally {
  await browser.close();
}

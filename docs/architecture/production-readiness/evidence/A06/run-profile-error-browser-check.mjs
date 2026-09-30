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
const operationIds = ['getProfile', 'listTrustedDevices', 'listProfileActivity', 'listSubAccounts'];
const screenshots = {
  profile: path.join(directory, 'preview-profile-error-profile-' + date + '.png'),
  devices: path.join(directory, 'preview-profile-error-devices-' + date + '.png'),
  activity: path.join(directory, 'preview-profile-error-activity-' + date + '.png'),
  subAccounts: path.join(directory, 'preview-profile-error-subaccounts-' + date + '.png'),
};
const reportPath = path.join(directory, 'profile-error-browser-check-' + date + '.json');
const sourceFiles = [
  'contracts/openapi/profile.yaml',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/profile/api/profile-api.ts',
  'src/features/profile/model/profile-queries.ts',
  'src/features/profile/model/profile-types.ts',
  'src/features/profile/pages/ActivityLogContractPage.tsx',
  'src/features/profile/pages/DeviceManagementContractPage.tsx',
  'src/features/profile/pages/EditProfileContractPage.tsx',
  'src/features/profile/pages/ProfileContractPage.tsx',
  'src/features/profile/pages/SubAccountContractPage.tsx',
  'src/features/profile/routes.ts',
  'src/shared/api/api-error.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/shared/ui/ErrorState.tsx',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-profile-error-browser-check.mjs',
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

const operationFor = (method, pathname) => {
  if (method !== 'GET') return undefined;
  if (pathname.endsWith('/api/profile')) return 'getProfile';
  if (pathname.endsWith('/api/profile/devices')) return 'listTrustedDevices';
  if (pathname.endsWith('/api/profile/activity')) return 'listProfileActivity';
  if (pathname.endsWith('/api/profile/sub-accounts')) return 'listSubAccounts';
  return undefined;
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(30_000);

const startedAt = Date.now();
const externalApiOrigins = new Set();
const apiRequests = [];
const apiResponses = [];
const requestStartedAt = new WeakMap();
const profileRequestFailures = [];
const profileWrites = [];
const pageErrors = [];
const responseWaiters = [];

const responseCount = (operationId) =>
  apiResponses.filter((response) => response.operationId === operationId).length;
const waitForResponseCount = (operationId, targetCount) => {
  if (responseCount(operationId) >= targetCount) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for ' + operationId)),
      30_000,
    );
    responseWaiters.push({ operationId, targetCount, resolve, reject, timer });
  });
};

page.on('request', (request) => {
  requestStartedAt.set(request, Date.now());
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    url.pathname.startsWith('/api/')
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  const operationId = operationFor(request.method(), url.pathname) ?? null;
  apiRequests.push({ method: request.method(), path: url.pathname, operationId });
  if (url.pathname.startsWith('/api/profile/') && request.method() !== 'GET') {
    profileWrites.push({ method: request.method(), path: url.pathname });
  }
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiResponses.push({
    method: response.request().method(),
    path: url.pathname,
    operationId: operationFor(response.request().method(), url.pathname) ?? null,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    responseTimeMs: Date.now() - (requestStartedAt.get(response.request()) ?? Date.now()),
  });
  for (let index = responseWaiters.length - 1; index >= 0; index -= 1) {
    const waiter = responseWaiters[index];
    if (responseCount(waiter.operationId) < waiter.targetCount) continue;
    clearTimeout(waiter.timer);
    responseWaiters.splice(index, 1);
    waiter.resolve();
  }
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/profile')) {
    profileRequestFailures.push({ method: request.method(), path: url.pathname });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};

try {
  await page.goto(originUrl + '/w/auth/login', { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.error').waitFor();

  if (!(await page.getByLabel('Tài khoản xem trước').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(serviceWorkerControlled, true, 'Local service worker must control the page.');

  const routes = [
    {
      route: '/w/profile',
      operationId: 'getProfile',
      screenshot: screenshots.profile,
      successText: 'Nguyễn Văn A',
    },
    {
      route: '/w/profile/devices',
      operationId: 'listTrustedDevices',
      screenshot: screenshots.devices,
      successText: 'Chrome Desktop',
    },
    {
      route: '/w/profile/activity',
      operationId: 'listProfileActivity',
      screenshot: screenshots.activity,
      successText: 'Đăng nhập thành công',
    },
    {
      route: '/w/profile/sub-accounts',
      operationId: 'listSubAccounts',
      screenshot: screenshots.subAccounts,
      successText: 'Bot Trading #1',
    },
  ];
  const readResults = [];
  for (const item of routes) {
    const requestStartCount = apiRequests.filter(
      (request) => request.operationId === item.operationId,
    ).length;
    const initialTarget = responseCount(item.operationId) + 6;
    await navigate(item.route);
    await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Thử lại' }).waitFor({ state: 'visible' });
    await waitForResponseCount(item.operationId, initialTarget);
    const initialResponses = apiResponses.filter(
      (response) => response.operationId === item.operationId,
    );
    assert.equal(initialResponses.length, initialTarget);
    assert.ok(initialResponses.slice(-6).every((response) => response.status === 503));
    assert.ok(initialResponses.slice(-6).every((response) => response.fromServiceWorker));
    assert.equal(await page.getByText(item.successText, { exact: true }).count(), 0);
    const routeBeforeRetry = new URL(page.url()).pathname;
    await page.screenshot({ path: item.screenshot, fullPage: true });

    await page.getByRole('button', { name: 'Thử lại' }).click();
    const finalTarget = initialTarget + 6;
    await waitForResponseCount(item.operationId, finalTarget);
    await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Thử lại' }).waitFor({ state: 'visible' });
    assert.equal(new URL(page.url()).pathname, routeBeforeRetry);
    assert.equal(
      await page.getByText(item.successText, { exact: true }).count(),
      0,
      'Success fixture must not be shown after the synthetic failure.',
    );
    const operationResponses = apiResponses.filter(
      (response) => response.operationId === item.operationId,
    );
    assert.equal(operationResponses.length, 12);
    assert.ok(operationResponses.every((response) => response.status === 503));
    assert.ok(operationResponses.every((response) => response.fromServiceWorker));
    const operationRequests = apiRequests.filter(
      (request) => request.operationId === item.operationId,
    );
    assert.equal(operationRequests.length - requestStartCount, 12);
    readResults.push({
      route: item.route,
      operationId: item.operationId,
      initialRequestCount: 6,
      initialStatusCounts: { 503: 6 },
      retryRequestCount: 6,
      retryStatusCounts: { 503: 6 },
      allResponsesFromServiceWorker: true,
      errorStateVisibleAfterRetry: true,
      successFixtureHidden: true,
      routePreservedAfterRetry: routeBeforeRetry,
      meanResponseTimeMs: Math.round(
        operationResponses.reduce((sum, response) => sum + response.responseTimeMs, 0) /
          operationResponses.length,
      ),
      screenshot: path.basename(item.screenshot),
    });
  }

  const operationCounts = Object.fromEntries(
    operationIds.map((operationId) => [
      operationId,
      apiRequests.filter((request) => request.operationId === operationId).length,
    ]),
  );
  assert.deepEqual(
    operationIds.filter((operationId) => operationCounts[operationId] !== 12),
    [],
  );
  assert.deepEqual(profileWrites, [], 'Error-path verification must not send Profile mutations.');
  assert.deepEqual(externalApiOrigins, new Set());
  assert.deepEqual(profileRequestFailures, []);
  assert.deepEqual(pageErrors, []);
  assert.ok(apiResponses.length > 0);
  assert.ok(apiResponses.every((response) => response.fromServiceWorker));

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'profile.error',
      status: 'passed',
      persona: 'developer (preview only)',
      route: routes.map((item) => item.route).join(', '),
      operationIds,
      observedOperationIds: operationIds,
      expectedDomainOperationCount: 7,
      coverage: 'representative_browser_observed_four_read_operations',
      injectedResponse: {
        status: 503,
        code: 'PREVIEW_SERVER_ERROR',
        declaredByProfileOpenApi: false,
      },
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      observedNetworkApiResponseCount: apiResponses.length,
      localMockMutationCount: 0,
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins],
    },
    authorizationLimitations: {
      persona: 'developer',
      mockSourcePermissions: ['profile:read', 'profile:write', 'profile:security:write'],
      mswEnforcesProfileReadPermission: false,
      backendAuthorizationVerified: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      operationCounts,
      readResults,
      profileWriteCount: profileWrites.length,
      profileRequestFailureCount: profileRequestFailures.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      apiRequests,
      apiResponses,
      profileRequestFailures,
      profileWrites,
      pageErrors,
      externalApiOrigins: [...externalApiOrigins],
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshots).map(([key, value]) => [key, path.basename(value)]),
    ),
    sourceHashes,
    limitations: [
      'The local Preview Controls inject HTTP 503 PREVIEW_SERVER_ERROR for Profile reads; the Profile OpenAPI declares 401 but does not declare 503.',
      'This verifies a synthetic UI failure and retry path only, not a contract-supported server status or a real backend outage.',
      'The HTTP client retries idempotent GET requests; observed request counts are local configuration evidence, not a production retry recommendation.',
      'Only four Profile GET operations are covered; updateProfile, setDeviceTrust and revokeDevice mutations were not sent.',
      'MSW does not enforce Profile permission scopes; backend authorization, persistence, staging and user acceptance are not verified.',
    ],
  };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({ reportPath, scenario: report.scenario, measurements: report.measurements }),
  );
} finally {
  for (const waiter of responseWaiters) {
    clearTimeout(waiter.timer);
    waiter.reject(new Error('Browser closed before response count was reached.'));
  }
  await browser.close();
}

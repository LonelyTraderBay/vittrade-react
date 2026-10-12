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
const runId = `${date}-${Date.now()}`;
const readOperationIds = [
  'getProfile',
  'listTrustedDevices',
  'listProfileActivity',
  'listSubAccounts',
];
const screenshots = {
  edit: path.join(directory, 'preview-profile-loading-edit-' + runId + '.png'),
  devices: path.join(directory, 'preview-profile-loading-devices-' + runId + '.png'),
  activity: path.join(directory, 'preview-profile-loading-activity-' + runId + '.png'),
  subAccounts: path.join(directory, 'preview-profile-loading-subaccounts-' + runId + '.png'),
};
const reportPath = path.join(directory, 'profile-loading-browser-check-' + runId + '.json');
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
  'src/features/profile/pages/SubAccountContractPage.tsx',
  'src/features/profile/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-profile-loading-browser-check.mjs',
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
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const externalApiOrigins = new Set();
const apiRequests = [];
const apiResponses = [];
const requestStartedAt = new WeakMap();
const profileRequestFailures = [];
const profileWrites = [];
const pageErrors = [];

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
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/profile')) {
    profileRequestFailures.push({ method: request.method(), path: url.pathname });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const waitForOperation = (operationId) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return operationFor(response.request().method(), url.pathname) === operationId;
  });
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.loading').waitFor();

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

  const pages = [
    {
      route: '/w/profile/edit',
      operationId: 'getProfile',
      loadingText: 'Đang tải profile…',
      loadedText: 'Họ và tên',
      emptyText: null,
      screenshot: screenshots.edit,
    },
    {
      route: '/w/profile/devices',
      operationId: 'listTrustedDevices',
      loadingText: 'Đang tải thiết bị…',
      loadedText: 'Chrome Desktop',
      emptyText: 'Chưa có thiết bị nào được ghi nhận.',
      screenshot: screenshots.devices,
    },
    {
      route: '/w/profile/activity',
      operationId: 'listProfileActivity',
      loadingText: 'Đang tải activity…',
      loadedText: 'Đăng nhập thành công',
      emptyText: 'Chưa có hoạt động tài khoản nào.',
      screenshot: screenshots.activity,
    },
    {
      route: '/w/profile/sub-accounts',
      operationId: 'listSubAccounts',
      loadingText: 'Đang tải tài khoản phụ…',
      loadedText: 'Bot Trading #1',
      emptyText: 'Chưa có tài khoản phụ nào.',
      screenshot: screenshots.subAccounts,
    },
  ];
  const loadingObservations = [];
  for (const item of pages) {
    const responsePromise = waitForOperation(item.operationId);
    await navigate(item.route);
    await page.getByText(item.loadingText, { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(250);
    if (item.emptyText) {
      assert.equal(
        await page.getByText(item.emptyText, { exact: true }).count(),
        0,
        item.operationId + ' must not show a false empty state while its read is pending.',
      );
    }
    assert.equal(
      apiResponses.some((response) => response.operationId === item.operationId),
      false,
      item.operationId + ' must still be in flight while its loading state is visible.',
    );
    await page.screenshot({ path: item.screenshot, fullPage: true });

    const response = await responsePromise;
    const responseRecord = apiResponses.findLast(
      (candidate) => candidate.operationId === item.operationId,
    );
    assert.ok(responseRecord, item.operationId + ' response should be recorded.');
    assert.equal(response.status(), 200);
    assert.equal(response.fromServiceWorker(), true);
    assert.ok(
      responseRecord.responseTimeMs >= 1800,
      item.operationId + ' delay should be visible.',
    );
    const body = await response.json();
    if (item.operationId === 'getProfile') {
      assert.equal(body.id, 'usr001');
      await page.getByLabel('Họ và tên').waitFor({ state: 'visible' });
      assert.equal(await page.getByLabel('Họ và tên').inputValue(), body.fullName);
    } else {
      assert.ok(Array.isArray(body.items) && body.items.length > 0);
      await page.getByText(item.loadedText, { exact: true }).first().waitFor({ state: 'visible' });
      assert.equal(await page.getByText(item.emptyText, { exact: true }).count(), 0);
    }
    assert.equal(await page.getByText(item.loadingText, { exact: true }).count(), 0);
    loadingObservations.push({
      route: item.route,
      operationId: item.operationId,
      loadingText: item.loadingText,
      loadingObservedWhileRequestInFlight: true,
      noFalseEmptyStateWhilePending: item.emptyText ? true : null,
      status: response.status(),
      responseTimeMs: responseRecord.responseTimeMs,
      resolvedItemCount: item.operationId === 'getProfile' ? 1 : body.items.length,
      noFalseEmptyStateAfterResolution: true,
      screenshot: path.basename(item.screenshot),
    });
  }

  const operationCounts = Object.fromEntries(
    readOperationIds.map((operationId) => [
      operationId,
      apiRequests.filter((request) => request.operationId === operationId).length,
    ]),
  );
  assert.deepEqual(
    readOperationIds.filter((operationId) => operationCounts[operationId] !== 1),
    [],
    'Each applicable Profile read must be requested exactly once.',
  );
  assert.deepEqual(profileWrites, [], 'Loading verification must not send Profile mutations.');
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
      id: 'profile.loading',
      status: 'passed',
      persona: 'developer (preview only)',
      route: pages.map((item) => item.route).join(', '),
      operationIds: readOperationIds,
      observedOperationIds: readOperationIds,
      expectedDomainOperationCount: readOperationIds.length,
      coverage: 'full_applicable_read_operations_browser_observed',
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
      loadingObservations,
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
      'The two-second loading delay is supplied by the local MSW preview handler; it is not a backend latency measurement.',
      'Only the four contract-applicable Profile GET operations are covered; mutation pending states are not part of this initial-page loading scenario.',
      'Profile collection and object responses are local fixtures; no backend request or mutation was sent.',
      'MSW does not enforce Profile permission scopes, so this run does not establish backend authorization.',
      'This browser run does not verify persistence, staging, production, or user acceptance.',
    ],
  };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({ reportPath, scenario: report.scenario, measurements: report.measurements }),
  );
} finally {
  await browser.close();
}

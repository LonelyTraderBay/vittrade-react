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
const screenshots = {
  edit: path.join(directory, `preview-profile-success-edit-${date}.png`),
  devices: path.join(directory, `preview-profile-success-devices-${date}.png`),
  activity: path.join(directory, `preview-profile-success-activity-${date}.png`),
  subAccounts: path.join(directory, `preview-profile-success-sub-accounts-${date}.png`),
};
const reportPath = path.join(directory, `profile-success-browser-check-${date}.json`);
const sourceFiles = [
  'contracts/openapi/profile.yaml',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/dev/mocks/trading-fixtures.ts',
  'src/features/profile/api/profile-api.ts',
  'src/features/profile/model/profile-queries.ts',
  'src/features/profile/model/profile-types.ts',
  'src/features/profile/pages/ActivityLogContractPage.tsx',
  'src/features/profile/pages/DeviceManagementContractPage.tsx',
  'src/features/profile/pages/EditProfileContractPage.tsx',
  'src/features/profile/pages/SubAccountContractPage.tsx',
  'src/features/profile/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-profile-success-browser-check.mjs',
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
  if (method === 'GET' && pathname.endsWith('/api/profile')) return 'getProfile';
  if (method === 'PATCH' && pathname.endsWith('/api/profile')) return 'updateProfile';
  if (method === 'GET' && pathname.endsWith('/api/profile/devices')) return 'listTrustedDevices';
  if (method === 'POST' && /\/api\/profile\/devices\/[^/]+\/revoke$/.test(pathname)) {
    return 'revokeDevice';
  }
  if (method === 'PATCH' && /\/api\/profile\/devices\/[^/]+\/trust$/.test(pathname)) {
    return 'setDeviceTrust';
  }
  if (method === 'GET' && pathname.endsWith('/api/profile/activity')) return 'listProfileActivity';
  if (method === 'GET' && pathname.endsWith('/api/profile/sub-accounts')) return 'listSubAccounts';
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
const requestIds = new WeakMap();
const respondedRequestIds = new Set();
let nextRequestId = 1;
const requestStartedAt = new WeakMap();
const profileRequestFailures = [];
const profileRequestCancellationsAfterResponse = [];
const pageErrors = [];

page.on('request', (request) => {
  const requestId = nextRequestId++;
  requestIds.set(request, requestId);
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
  apiRequests.push({
    requestId,
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname) ?? null,
    idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
  });
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const requestId = requestIds.get(response.request());
  if (requestId !== undefined) respondedRequestIds.add(requestId);
  apiResponses.push({
    requestId,
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
    const requestEvent = {
      requestId: requestIds.get(request) ?? null,
      method: request.method(),
      path: url.pathname,
      failure: request.failure()?.errorText ?? null,
      hadResponse: respondedRequestIds.has(requestIds.get(request)),
    };
    if (requestEvent.failure === 'net::ERR_ABORTED' && requestEvent.hadResponse) {
      profileRequestCancellationsAfterResponse.push(requestEvent);
    } else {
      profileRequestFailures.push(requestEvent);
    }
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
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.success').waitFor();

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
  assert.equal(
    serviceWorkerControlled,
    true,
    'The local preview service worker must control the page.',
  );

  const profileResponsePromise = waitForOperation('getProfile');
  await navigate('/w/profile/edit');
  const profileResponse = await profileResponsePromise;
  assert.equal(profileResponse.status(), 200);
  assert.equal(profileResponse.fromServiceWorker(), true);
  const profile = await profileResponse.json();
  await page.getByLabel('Họ và tên').waitFor({ state: 'visible' });
  await page.screenshot({ path: screenshots.edit, fullPage: true });

  const updatedName = `${profile.fullName} Preview QA`;
  await page.getByLabel('Họ và tên').fill(updatedName);
  const updateResponsePromise = waitForOperation('updateProfile');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  const updateResponse = await updateResponsePromise;
  assert.equal(updateResponse.status(), 200);
  assert.equal(updateResponse.fromServiceWorker(), true);
  assert.equal(updateResponse.request().headers()['idempotency-key']?.length >= 8, true);
  const updatedProfile = await updateResponse.json();
  assert.equal(updatedProfile.fullName, updatedName);
  await page.waitForURL('**/w/home');

  const devicesResponsePromise = waitForOperation('listTrustedDevices');
  await navigate('/w/profile/devices');
  const devicesResponse = await devicesResponsePromise;
  assert.equal(devicesResponse.status(), 200);
  assert.equal(devicesResponse.fromServiceWorker(), true);
  const initialDevices = (await devicesResponse.json()).items;
  const trustDevice = initialDevices.find((device) => !device.isCurrent && !device.isTrusted);
  const revokeDevice = initialDevices.find((device) => !device.isCurrent && device.isTrusted);
  assert.ok(trustDevice, 'The isolated preview should include a non-current untrusted device.');
  assert.ok(revokeDevice, 'The isolated preview should include a non-current trusted device.');

  const trustCard = page.getByRole('heading', { name: trustDevice.name }).locator('xpath=../../..');
  const trustButton = trustCard.getByRole('button', { name: 'Tin cậy' });
  assert.equal(
    await trustButton.count(),
    1,
    'The trusted-device action must be scoped to its card.',
  );
  assert.equal(await trustButton.isEnabled(), true);
  const trustResponsePromise = waitForOperation('setDeviceTrust');
  const trustRefreshPromise = waitForOperation('listTrustedDevices');
  await trustButton.click();
  const trustResponse = await trustResponsePromise;
  assert.equal(trustResponse.status(), 200);
  assert.equal(trustResponse.fromServiceWorker(), true);
  assert.equal(trustResponse.request().headers()['idempotency-key']?.length >= 8, true);
  assert.equal((await trustResponse.json()).item.isTrusted, true);
  await trustRefreshPromise;
  await trustCard.getByRole('button', { name: 'Bỏ tin cậy' }).waitFor({ state: 'visible' });

  const revokeCard = page
    .getByRole('heading', { name: revokeDevice.name })
    .locator('xpath=../../..');
  const revokeButton = revokeCard.getByRole('button', { name: 'Thu hồi' });
  assert.equal(await revokeButton.count(), 1, 'The revoke action must be scoped to its card.');
  assert.equal(await revokeButton.isEnabled(), true);
  const revokeResponsePromise = waitForOperation('revokeDevice');
  const revokeRefreshPromise = waitForOperation('listTrustedDevices');
  await revokeButton.click();
  const revokeResponse = await revokeResponsePromise;
  assert.equal(revokeResponse.status(), 204);
  assert.equal(revokeResponse.fromServiceWorker(), true);
  assert.equal(revokeResponse.request().headers()['idempotency-key']?.length >= 8, true);
  await revokeRefreshPromise;
  assert.equal(await page.getByRole('heading', { name: revokeDevice.name }).count(), 0);
  await page.screenshot({ path: screenshots.devices, fullPage: true });

  const activityResponsePromise = waitForOperation('listProfileActivity');
  await navigate('/w/profile/activity');
  const activityResponse = await activityResponsePromise;
  assert.equal(activityResponse.status(), 200);
  assert.equal(activityResponse.fromServiceWorker(), true);
  const activityItems = (await activityResponse.json()).items;
  assert.ok(activityItems.length > 0);
  await page
    .getByText(activityItems[0].description, { exact: true })
    .first()
    .waitFor({ state: 'visible' });
  await page.screenshot({ path: screenshots.activity, fullPage: true });

  const subAccountsResponsePromise = waitForOperation('listSubAccounts');
  await navigate('/w/profile/sub-accounts');
  const subAccountsResponse = await subAccountsResponsePromise;
  assert.equal(subAccountsResponse.status(), 200);
  assert.equal(subAccountsResponse.fromServiceWorker(), true);
  const subAccounts = (await subAccountsResponse.json()).items;
  assert.ok(subAccounts.length > 0);
  await page.getByRole('heading', { name: subAccounts[0].name }).waitFor({ state: 'visible' });
  await page.screenshot({ path: screenshots.subAccounts, fullPage: true });

  const observedOperationIds = [
    'getProfile',
    'updateProfile',
    'listTrustedDevices',
    'revokeDevice',
    'setDeviceTrust',
    'listProfileActivity',
    'listSubAccounts',
  ];
  const operationCounts = Object.fromEntries(
    observedOperationIds.map((operationId) => [
      operationId,
      apiRequests.filter((request) => request.operationId === operationId).length,
    ]),
  );
  assert.deepEqual(
    observedOperationIds.filter((operationId) => operationCounts[operationId] === 0),
    [],
    'Every Profile success operation must have a browser request.',
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(profileRequestFailures, []);
  assert.deepEqual(pageErrors, []);
  assert.ok(apiResponses.every((response) => response.fromServiceWorker));

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'profile.success',
      status: 'passed',
      persona: 'developer (preview only)',
      operationIds: observedOperationIds,
      observedOperationIds,
      expectedDomainOperationCount: observedOperationIds.length,
      coverage: 'full_scenario_operations_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      observedNetworkApiResponseCount: apiResponses.length,
      localMockMutationCount: 3,
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins],
      postResponseAbortEventCount: profileRequestCancellationsAfterResponse.length,
    },
    authorizationLimitations: {
      persona: 'developer',
      mockSourcePermissions: ['profile:read', 'profile:write', 'profile:security:write'],
      profileReadPermissionPresent: true,
      mswEnforcesProfileReadPermission: false,
      backendAuthorizationVerified: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      operationCounts,
      profileUpdateStatus: updateResponse.status(),
      trustUpdateStatus: trustResponse.status(),
      revokeStatus: revokeResponse.status(),
      activityItemCount: activityItems.length,
      subAccountCount: subAccounts.length,
      idempotencyKeysPresent: {
        updateProfile: true,
        setDeviceTrust: true,
        revokeDevice: true,
      },
      externalApiOriginCount: externalApiOrigins.size,
      profileRequestFailureCount: profileRequestFailures.length,
      postResponseAbortEvents: profileRequestCancellationsAfterResponse,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      profile: { status: profileResponse.status(), fullNameVisible: Boolean(profile.fullName) },
      profileUpdate: { status: updateResponse.status(), updatedName, idempotencyKeyPresent: true },
      devices: {
        initialCount: initialDevices.length,
        trustDeviceId: trustDevice.id,
        trustUpdated: true,
        revokedDeviceId: revokeDevice.id,
        revokedDeviceAbsentAfterRefetch: true,
      },
      activity: { status: activityResponse.status(), itemCount: activityItems.length },
      subAccounts: { status: subAccountsResponse.status(), itemCount: subAccounts.length },
      apiRequests,
      apiResponses,
      externalApiOrigins: [...externalApiOrigins],
      profileRequestFailures,
      profileRequestCancellationsAfterResponse,
      pageErrors,
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshots).map(([key, file]) => [key, path.basename(file)]),
    ),
    sourceHashes,
    limitations: [
      'All three write operations updated only in-memory preview fixtures through the local service worker; no backend mutation was sent.',
      'The Developer preview persona declares the Profile permissions required by the OpenAPI operations; current MSW handlers do not enforce those permissions, so this run does not prove backend authorization.',
      'Chromium emitted net::ERR_ABORTED for the revoke request after the same request had already received a 204 MSW response; this is recorded separately from failed requests.',
      'This browser run does not verify persistence, staging, production, or user acceptance.',
    ],
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Profile success browser evidence written: ${reportPath}`);
  console.log(
    JSON.stringify({
      checkedAt,
      totalFlowMs: report.measurements.totalFlowMs,
      apiRequestCount: report.measurements.apiRequestCount,
      operationCounts,
      localMockMutationCount: report.fixtureBoundary.localMockMutationCount,
      profileReadPermissionPresent: report.authorizationLimitations.profileReadPermissionPresent,
      externalApiOrigins: report.fixtureBoundary.externalApiOrigins,
      realBackendMutationSent: report.fixtureBoundary.realBackendMutationSent,
      screenshots: report.screenshots,
    }),
  );
} finally {
  await context.close();
  await browser.close();
}

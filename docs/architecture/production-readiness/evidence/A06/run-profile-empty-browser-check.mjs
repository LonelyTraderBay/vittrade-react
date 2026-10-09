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
const screenshots = {
  devices: path.join(directory, `preview-profile-empty-devices-${runId}.png`),
  activity: path.join(directory, `preview-profile-empty-activity-${runId}.png`),
  subAccounts: path.join(directory, `preview-profile-empty-subaccounts-${runId}.png`),
};
const reportPath = path.join(directory, `profile-empty-browser-check-${runId}.json`);
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
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-profile-empty-browser-check.mjs',
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
  apiRequests.push({
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname) ?? null,
  });
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
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.empty').waitFor();

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

  const emptyPages = [
    {
      route: '/w/profile/devices',
      operationId: 'listTrustedDevices',
      emptyText: 'Chưa có thiết bị nào được ghi nhận.',
      screenshot: screenshots.devices,
    },
    {
      route: '/w/profile/activity',
      operationId: 'listProfileActivity',
      emptyText: 'Chưa có hoạt động tài khoản nào.',
      screenshot: screenshots.activity,
    },
    {
      route: '/w/profile/sub-accounts',
      operationId: 'listSubAccounts',
      emptyText: 'Chưa có tài khoản phụ nào.',
      screenshot: screenshots.subAccounts,
    },
  ];
  const emptyResults = [];
  for (const item of emptyPages) {
    const responsePromise = waitForOperation(item.operationId);
    await navigate(item.route);
    const response = await responsePromise;
    assert.equal(response.status(), 200);
    assert.equal(response.fromServiceWorker(), true);
    assert.deepEqual((await response.json()).items, []);
    await page
      .getByRole('status')
      .getByText(item.emptyText, { exact: true })
      .waitFor({ state: 'visible' });
    await page.screenshot({ path: item.screenshot, fullPage: true });
    emptyResults.push({ operationId: item.operationId, status: response.status(), itemCount: 0 });
  }

  const profileResponsePromise = waitForOperation('getProfile');
  await navigate('/w/profile/edit');
  const profileResponse = await profileResponsePromise;
  assert.equal(profileResponse.status(), 200);
  assert.equal(profileResponse.fromServiceWorker(), true);
  const profile = await profileResponse.json();
  assert.equal(profile.id, 'usr001');
  await page.getByLabel('Họ và tên').waitFor({ state: 'visible' });
  assert.equal(await page.getByLabel('Họ và tên').inputValue(), profile.fullName);

  const observedOperationIds = ['listTrustedDevices', 'listProfileActivity', 'listSubAccounts'];
  const operationCounts = Object.fromEntries(
    [...observedOperationIds, 'getProfile'].map((operationId) => [
      operationId,
      apiRequests.filter((request) => request.operationId === operationId).length,
    ]),
  );
  assert.deepEqual(
    observedOperationIds.filter((operationId) => operationCounts[operationId] !== 1),
    [],
    'Each linked empty-list operation must be requested exactly once.',
  );
  assert.equal(operationCounts.getProfile, 1, 'The required Profile object must stay readable.');
  assert.deepEqual(externalApiOrigins, new Set());
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
      id: 'profile.empty',
      status: 'passed',
      persona: 'developer (preview only)',
      route: '/w/profile/devices, /w/profile/activity, /w/profile/sub-accounts',
      operationIds: observedOperationIds,
      observedOperationIds,
      expectedDomainOperationCount: observedOperationIds.length,
      coverage: 'full_scenario_operations_browser_observed',
    },
    supportingOperationIds: ['getProfile'],
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
      emptyResults,
      profileRootObjectPreserved: true,
      profileRootName: profile.fullName,
      profileRequestFailureCount: profileRequestFailures.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      apiRequests,
      apiResponses,
      profileRequestFailures,
      pageErrors,
      externalApiOrigins: [...externalApiOrigins],
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshots).map(([key, file]) => [key, path.basename(file)]),
    ),
    sourceHashes,
    limitations: [
      'Profile collection responses were empty local MSW fixtures; no backend request or mutation was sent.',
      'The required Profile object still returned its normal 200 fixture; empty collection responses do not imply a missing profile or failed authorization.',
      'MSW does not enforce Profile permission scopes, so this run does not establish backend authorization.',
      'This browser run does not verify persistence, staging, production, or user acceptance.',
    ],
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Profile empty browser evidence written: ${reportPath}`);
  console.log(
    JSON.stringify({
      checkedAt,
      totalFlowMs: report.measurements.totalFlowMs,
      apiRequestCount: report.measurements.apiRequestCount,
      operationCounts,
      emptyResults,
      localMockMutationCount: report.fixtureBoundary.localMockMutationCount,
      externalApiOrigins: report.fixtureBoundary.externalApiOrigins,
      profileRootObjectPreserved: report.measurements.profileRootObjectPreserved,
      realBackendRequestSent: report.fixtureBoundary.realBackendRequestSent,
      screenshots: report.screenshots,
    }),
  );
} finally {
  await context.close();
  await browser.close();
}

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Loopback preview only.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const suffix = process.env.EVIDENCE_RUN_SUFFIX || 'contract-scoped';
assert.match(suffix, /^[a-z0-9-]+$/i, 'Evidence run suffix must be alphanumeric or hyphenated.');
const screenshotPaths = {
  profile: path.join(directory, `preview-profile-unauthorized-profile-${date}-${suffix}.png`),
  devices: path.join(directory, `preview-profile-unauthorized-devices-${date}-${suffix}.png`),
  activity: path.join(directory, `preview-profile-unauthorized-activity-${date}-${suffix}.png`),
  subAccounts: path.join(
    directory,
    `preview-profile-unauthorized-subaccounts-${date}-${suffix}.png`,
  ),
};
const reportPath = path.join(
  directory,
  `profile-unauthorized-browser-check-${date}-${suffix}.json`,
);

const sourceFiles = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/profile.yaml',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/profile/api/profile-api.ts',
  'src/features/profile/model/profile-queries.ts',
  'src/features/profile/pages/ActivityLogContractPage.tsx',
  'src/features/profile/pages/DeviceManagementContractPage.tsx',
  'src/features/profile/pages/EditProfileContractPage.tsx',
  'src/features/profile/pages/ProfileContractPage.tsx',
  'src/features/profile/pages/SubAccountContractPage.tsx',
  'src/features/profile/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-profile-unauthorized-browser-check.mjs',
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

const operationFor = (request) => {
  const method = request.method();
  const pathname = new URL(request.url()).pathname;
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
page.setDefaultTimeout(20_000);

const startedAt = Date.now();
const externalApiOrigins = new Set();
const apiRequests = [];
const apiResponses = [];
const profileResponses = [];
const profileWriteRequests = [];
const profileRequestFailures = [];
const apiRequestFailures = [];
const pendingApiRequests = new Set();
const pageErrors = [];

await page.addInitScript(() => {
  const originalFetch = window.fetch.bind(window);
  const refreshFixtures = [];
  Object.defineProperty(window, '__vittradeAuthRefreshContractFixtures', {
    configurable: false,
    value: refreshFixtures,
  });
  window.fetch = async (input, init) => {
    const inputUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(inputUrl, window.location.href);
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    if (url.pathname !== '/api/auth/refresh' || method !== 'POST') {
      return originalFetch(input, init);
    }
    refreshFixtures.push({
      method,
      path: url.pathname,
      status: 200,
      body: null,
      source: 'runner-local contract fixture; request not sent to service worker or backend',
    });
    return new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

page.on('request', (request) => {
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
    operationId: operationFor(request),
  });
  pendingApiRequests.add(request);
  if (url.pathname.startsWith('/api/profile/') || url.pathname === '/api/profile') {
    if (request.method() !== 'GET')
      profileWriteRequests.push({ method: request.method(), path: url.pathname });
  }
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const item = {
    method: response.request().method(),
    path: url.pathname,
    operationId: operationFor(response.request()) ?? null,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  };
  pendingApiRequests.delete(response.request());
  apiResponses.push(item);
  if (url.pathname.startsWith('/api/profile/') || url.pathname === '/api/profile') {
    profileResponses.push(item);
  }
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/')) {
    pendingApiRequests.delete(request);
    apiRequestFailures.push({
      method: request.method(),
      path: url.pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
  }
  if (url.pathname.startsWith('/api/profile')) {
    profileRequestFailures.push({
      path: url.pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function navigate(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

async function waitForApiIdle(timeoutMs = 3_000) {
  const deadline = Date.now() + timeoutMs;
  while (pendingApiRequests.size > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return pendingApiRequests.size;
}

async function openPreviewControlsIfNeeded(label) {
  if ((await page.getByLabel(label).count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
}

async function applyProfileScenario(state, scenarioId) {
  await openPreviewControlsIfNeeded('Miền API');
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption(state);
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText(scenarioId).waitFor();
}

async function signInDeveloperThroughPreview() {
  await openPreviewControlsIfNeeded('Tài khoản xem trước');
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  await page.waitForTimeout(250);
  await waitForApiIdle();
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
  await page.waitForTimeout(250);
  await waitForApiIdle();
}

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await signInDeveloperThroughPreview();
  await applyProfileScenario('success', 'profile.success');
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(serviceWorkerControlled, true, 'The local service worker must control the page.');

  const steps = [
    {
      route: '/w/profile',
      operationId: 'getProfile',
      successLocator: page.getByText('Nguyễn Văn A', { exact: true }),
      screenshotPath: screenshotPaths.profile,
    },
    {
      route: '/w/profile/devices',
      operationId: 'listTrustedDevices',
      successLocator: page.getByText('Chrome Desktop', { exact: true }),
      screenshotPath: screenshotPaths.devices,
    },
    {
      route: '/w/profile/activity',
      operationId: 'listProfileActivity',
      successLocator: page.getByText('Đăng nhập thành công', { exact: true }).first(),
      screenshotPath: screenshotPaths.activity,
    },
    {
      route: '/w/profile/sub-accounts',
      operationId: 'listSubAccounts',
      successLocator: page.getByText('Bot Trading #1', { exact: true }),
      screenshotPath: screenshotPaths.subAccounts,
    },
  ];
  const successFixtures = [];
  for (const step of steps) {
    await navigate(step.route);
    await step.successLocator.waitFor({ state: 'visible' });
    successFixtures.push({ route: step.route, operationId: step.operationId, visible: true });
  }

  await navigate('/w/home');
  await applyProfileScenario('unauthorized', 'profile.unauthorized');
  const collapseUnauthorized = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapseUnauthorized.count()) await collapseUnauthorized.click();
  const responseStart = profileResponses.length;
  const requestStart = apiRequests.filter((request) =>
    request.path.startsWith('/api/profile'),
  ).length;
  const refreshFixtureStart = await page.evaluate(
    () => window.__vittradeAuthRefreshContractFixtures?.length ?? 0,
  );

  const unauthorizedReads = [];
  for (const [index, step] of steps.entries()) {
    const readResponseStart = profileResponses.length;
    const refreshCountBefore = await page.evaluate(
      () => window.__vittradeAuthRefreshContractFixtures?.length ?? 0,
    );
    await navigate(step.route);
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    await page.getByTestId('auth-email').waitFor();
    await waitForApiIdle();
    const observedResponses = profileResponses.slice(readResponseStart);
    const refreshFixtures = await page.evaluate(
      () => window.__vittradeAuthRefreshContractFixtures?.slice() ?? [],
    );
    const refreshForRead = refreshFixtures.slice(refreshCountBefore);
    const staleSuccessContentVisible = await step.successLocator.isVisible().catch(() => false);
    assert.equal(
      observedResponses.length,
      1,
      `${step.operationId} must have one Profile response.`,
    );
    assert.equal(observedResponses[0].method, 'GET');
    assert.equal(observedResponses[0].operationId, step.operationId);
    assert.equal(observedResponses[0].status, 401);
    assert.equal(observedResponses[0].fromServiceWorker, true);
    assert.equal(
      refreshForRead.length,
      1,
      'Each Profile 401 must use one refresh contract fixture.',
    );
    assert.equal(refreshForRead[0].status, 200);
    assert.equal(refreshForRead[0].body, null);
    assert.equal(staleSuccessContentVisible, false);
    await page.screenshot({ path: step.screenshotPath, fullPage: true });

    unauthorizedReads.push({
      route: step.route,
      operationId: step.operationId,
      readRequestCount: 1,
      readResponseCount: 1,
      readStatus: observedResponses[0].status,
      readFromServiceWorker: observedResponses[0].fromServiceWorker,
      refreshContractFixtureCount: refreshForRead.length,
      refreshStatus: refreshForRead[0].status,
      refreshBody: refreshForRead[0].body,
      redirectedToLogin: true,
      staleSuccessContentVisible,
      screenshot: path.basename(step.screenshotPath),
    });
    if (index < steps.length - 1) await signInDeveloperThroughPreview();
  }

  const refreshContractFixtures = await page.evaluate(
    () => window.__vittradeAuthRefreshContractFixtures?.slice() ?? [],
  );
  const unauthorizedProfileResponses = profileResponses.slice(responseStart);
  const unauthorizedProfileRequests = apiRequests
    .filter((request) => request.path.startsWith('/api/profile'))
    .slice(requestStart);
  const pendingApiRequestCount = await waitForApiIdle();
  const observedOperationIds = [
    ...new Set(unauthorizedProfileResponses.map((item) => item.operationId)),
  ]
    .filter(Boolean)
    .sort();
  const pageApiResponsesFromServiceWorker = apiResponses.every((item) => item.fromServiceWorker);
  assert.deepEqual(observedOperationIds, steps.map((step) => step.operationId).sort());
  assert.equal(unauthorizedProfileRequests.length, 4);
  assert.equal(unauthorizedProfileResponses.length, 4);
  assert.equal(
    unauthorizedProfileResponses.every((item) => item.status === 401),
    true,
  );
  assert.equal(refreshContractFixtures.length - refreshFixtureStart, 4);
  assert.deepEqual(profileWriteRequests, [], 'Unauthorized scenario must not send Profile writes.');
  assert.deepEqual(profileRequestFailures, []);
  assert.deepEqual(pageErrors, []);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageApiResponsesFromServiceWorker, true);
  assert.equal(
    pendingApiRequestCount,
    0,
    'All observed API requests must settle before reporting.',
  );

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'profile.unauthorized',
      status: 'passed',
      persona: 'developer (preview only)',
      operationIds: [
        'getProfile',
        'updateProfile',
        'listTrustedDevices',
        'revokeDevice',
        'setDeviceTrust',
        'listProfileActivity',
        'listSubAccounts',
      ],
      observedOperationIds,
      expectedDomainOperationCount: 7,
      coverage: 'representative_browser_observed_four_of_seven_operations',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedNetworkResponsesFromServiceWorker: pageApiResponsesFromServiceWorker,
      allObservedResponsesFromServiceWorker: pageApiResponsesFromServiceWorker,
      profileReadResponsesFromServiceWorker: unauthorizedProfileResponses.every(
        (item) => item.fromServiceWorker,
      ),
      runnerInterceptedAuthRefreshResponsesAreNotNetworkResponses: true,
      authRefreshContractFixtures: refreshContractFixtures.slice(refreshFixtureStart),
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
      apiRequestFailureCount: apiRequestFailures.length,
      pendingApiRequestCount,
      profileUnauthorizedRequestCount: unauthorizedProfileRequests.length,
      profileUnauthorizedResponseCount: unauthorizedProfileResponses.length,
      profile401ResponseCount: unauthorizedProfileResponses.filter((item) => item.status === 401)
        .length,
      authRefreshContractFixtureCount: refreshContractFixtures.length - refreshFixtureStart,
      unauthorizedRedirectCount: unauthorizedReads.filter((item) => item.redirectedToLogin).length,
      profileWriteCount: profileWriteRequests.length,
      profileRequestFailureCount: profileRequestFailures.length,
      pageErrorCount: pageErrors.length,
      successFixturePreconditions: successFixtures.length,
    },
    assertions: {
      successfulProfileFixturesLoadedFirst: successFixtures,
      unauthorizedReads,
      apiResponses,
      unauthorizedProfileRequests,
      unauthorizedProfileResponses,
      apiRequests,
      apiRequestFailures,
      profileWriteRequests,
      profileRequestFailures,
      pageErrors,
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([key, screenshotPath]) => [
        key,
        path.basename(screenshotPath),
      ]),
    ),
    sourceHashes,
    limitations: [
      'Profile OpenAPI declares HTTP 401 for each of the four observed GET operations; the three Profile mutations were not sent, so coverage is representative 4/7.',
      'Auth OpenAPI declares refreshSession as 200 with AuthSession or null and does not declare HTTP 401. The runner intercepts each refresh fetch before service-worker/backend dispatch and returns the declared 200/null fixture.',
      'Local MSW returns the declared Profile GET 401 responses, but does not enforce profile:read; browser redirection does not certify server-side authorization.',
      'This Chromium preview check does not verify backend session handling, persistence, staging or user acceptance.',
    ],
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  const formatted = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
    ...prettierOptions,
    parser: 'json',
  });
  await fs.writeFile(reportPath, formatted);
  process.stdout.write(formatted);
} finally {
  await browser.close();
}

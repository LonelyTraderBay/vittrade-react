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
  success: path.join(directory, `preview-referral-unauthorized-success-${date}-${suffix}.png`),
  login: path.join(directory, `preview-referral-unauthorized-login-${date}-${suffix}.png`),
};
const reportPath = path.join(
  directory,
  `referral-unauthorized-browser-check-${date}-${suffix}.json`,
);
const sourceFiles = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/referral.yaml',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/routes.ts',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/dev/mocks/referral-fixtures.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/routes.ts',
  'src/features/referral/api/referral-api.ts',
  'src/features/referral/model/referral-queries.ts',
  'src/features/referral/pages/ReferralContractPage.tsx',
  'src/features/referral/routes.ts',
  'src/shared/api/api-error.ts',
  'src/shared/api/client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-referral-unauthorized-browser-check.mjs',
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
const refreshPath = '/api/auth/refresh';
const referralPath = '/api/referral/overview';
const pageErrors = [];

await page.addInitScript((pathName) => {
  const originalFetch = window.fetch.bind(window);
  const fixtures = [];
  Object.defineProperty(window, '__vittradeAuthRefreshContractFixtures', {
    configurable: false,
    value: fixtures,
  });
  window.fetch = async (input, init) => {
    const inputUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(inputUrl, window.location.href);
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    if (url.pathname !== pathName || method !== 'POST') return originalFetch(input, init);
    const fixture = {
      method,
      path: url.pathname,
      status: 200,
      body: null,
      source: 'runner-local contract fixture; request not sent to service worker or backend',
    };
    fixtures.push(fixture);
    return new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}, refreshPath);

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
page.on('pageerror', (error) => pageErrors.push(error.message));

const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};
const openPreviewControlsIfNeeded = async (label) => {
  if ((await page.getByLabel(label).count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
};
const waitForApiIdle = async (timeoutMs = 5_000) => {
  const deadline = Date.now() + timeoutMs;
  while (apiRequests.length > apiResponses.length + apiFailures.length && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return apiRequests.length - apiResponses.length - apiFailures.length;
};

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('referral');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.success').waitFor();

  await openPreviewControlsIfNeeded('Tài khoản xem trước');
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();

  await navigate('/w/referral');
  const successLocator = page.getByText('Invite friends and earn commission', { exact: true });
  await successLocator.waitFor({ state: 'visible' });
  const successResponse = apiResponses.find(
    (item) => item.path === referralPath && item.status === 200,
  );
  assert.ok(successResponse, 'The local success precondition must load before the 401 check.');
  await page.screenshot({ path: screenshotPaths.success, fullPage: true });

  await navigate('/w/home');
  await openPreviewControlsIfNeeded('Miền API');
  await page.getByLabel('Miền API').selectOption('referral');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.unauthorized').waitFor();
  const collapseUnauthorized = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapseUnauthorized.count()) await collapseUnauthorized.click();
  await waitForApiIdle();

  apiRequests.length = 0;
  apiResponses.length = 0;
  apiFailures.length = 0;
  externalApiOrigins.clear();
  pageErrors.length = 0;
  const refreshFixtureStart = await page.evaluate(
    () => window.__vittradeAuthRefreshContractFixtures?.length ?? 0,
  );
  const scenarioStartedAt = Date.now();

  await navigate('/w/referral');
  await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
  await page.getByTestId('auth-email').waitFor({ state: 'visible' });
  const pendingApiRequestCount = await waitForApiIdle();
  const refreshFixtures = await page.evaluate(
    () => window.__vittradeAuthRefreshContractFixtures?.slice() ?? [],
  );
  const scenarioRefreshFixtures = refreshFixtures.slice(refreshFixtureStart);
  const referralRequests = apiRequests.filter(
    (item) => item.path === referralPath && item.method === 'GET',
  );
  const referralResponses = apiResponses.filter((item) => item.path === referralPath);
  const staleSuccessContentVisible = await successLocator.isVisible().catch(() => false);
  const loginFormVisible = await page.getByTestId('auth-email').isVisible();

  assert.ok(referralRequests.length >= 1, 'The protected overview GET must be observed.');
  assert.equal(referralResponses.length, referralRequests.length);
  assert.equal(
    referralResponses.every((item) => item.status === 401),
    true,
  );
  assert.equal(
    referralResponses.every((item) => item.fromServiceWorker),
    true,
  );
  assert.equal(scenarioRefreshFixtures.length, referralResponses.length);
  assert.equal(
    scenarioRefreshFixtures.every(
      (item) =>
        item.method === 'POST' &&
        item.path === refreshPath &&
        item.status === 200 &&
        item.body === null,
    ),
    true,
  );
  assert.equal(new URL(page.url()).pathname, '/auth/login');
  assert.equal(loginFormVisible, true);
  assert.equal(staleSuccessContentVisible, false);
  assert.equal(pendingApiRequestCount, 0);
  assert.equal(apiFailures.length, 0);
  assert.equal(
    apiRequests.some((item) => item.method !== 'GET'),
    false,
  );
  assert.equal(pageErrors.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  await page.screenshot({ path: screenshotPaths.login, fullPage: true });

  const sidecar = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'referral.unauthorized',
      status: 'passed',
      persona: 'developer (preview only)',
      operationIds: ['getReferralOverview'],
      observedOperationIds: ['getReferralOverview'],
      expectedDomainOperationCount: 1,
      coverage: 'full_browser_observed_one_of_one_operations',
    },
    contractEvidence: {
      referral: {
        operationId: 'getReferralOverview',
        method: 'GET',
        path: '/referral/overview',
        responses: [200, 401],
        openApiSha256: sourceHashes['contracts/openapi/referral.yaml'],
      },
      authRefresh: {
        operationId: 'refreshSession',
        method: 'POST',
        path: '/auth/refresh',
        responses: [200],
        successBody: 'AuthSession|null',
        openApiSha256: sourceHashes['contracts/openapi/auth.yaml'],
      },
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: apiResponses.every((item) => item.fromServiceWorker),
      allObservedNetworkResponsesFromServiceWorker: apiResponses.every(
        (item) => item.fromServiceWorker,
      ),
      runnerInterceptedAuthRefreshResponsesAreNotNetworkResponses: true,
      authRefreshContractFixtures: scenarioRefreshFixtures,
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
      pendingApiRequestCount,
      referralUnauthorizedRequestCount: referralRequests.length,
      referralUnauthorizedResponseCount: referralResponses.length,
      referral401ResponseCount: referralResponses.filter((item) => item.status === 401).length,
      referralResponseElapsedMs: referralResponses.map((item) => item.elapsedMs),
      authRefreshContractFixtureCount: scenarioRefreshFixtures.length,
      redirectedToLogin: new URL(page.url()).pathname === '/auth/login',
      loginFormVisible,
      staleSuccessContentVisible,
      referralWriteCount: apiRequests.filter(
        (item) => item.path.startsWith('/api/referral') && item.method !== 'GET',
      ).length,
      pageErrorCount: pageErrors.length,
      externalApiOriginCount: externalApiOrigins.size,
    },
    assertions: {
      route: '/w/referral',
      successFixtureLoadedBeforeUnauthorized: true,
      referral401ResponsesFromServiceWorker: referralResponses.every(
        (item) => item.status === 401 && item.fromServiceWorker,
      ),
      refreshUsedOnlyContractScoped200NullFixture: scenarioRefreshFixtures.every(
        (item) => item.status === 200 && item.body === null,
      ),
      redirectedToLogin: new URL(page.url()).pathname === '/auth/login',
      loginFormVisible,
      staleSuccessContentVisible,
      noReferralWrites: true,
      pageErrors,
    },
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([key, file]) => [key, path.basename(file)]),
    ),
    sourceHashes,
    limitations: [
      'The Referral GET 401 is declared in Referral OpenAPI and returned by local MSW; this does not verify server authorization.',
      'Auth OpenAPI declares refreshSession as 200 with AuthSession or null and does not declare 401. The runner intercepts refresh fetch locally and returns the declared 200/null fixture before service-worker or backend dispatch.',
      'MSW does not enforce referral:read; this browser flow does not verify real session handling, persistence, staging or user acceptance.',
      'Only the read operation getReferralOverview ran; no referral mutation or external link was invoked.',
    ],
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  const formatted = await prettier.format(`${JSON.stringify(sidecar, null, 2)}\n`, {
    ...prettierOptions,
    filepath: reportPath,
  });
  await fs.writeFile(reportPath, formatted);
  process.stdout.write(
    `${JSON.stringify(
      {
        report: path.relative(root, reportPath),
        screenshots: Object.values(screenshotPaths).map((file) => path.relative(root, file)),
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

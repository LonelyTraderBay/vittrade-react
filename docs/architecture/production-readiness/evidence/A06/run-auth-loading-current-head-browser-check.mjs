import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';
import { parse } from 'yaml';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportPath = path.join(
  evidenceDirectory,
  `auth-loading-current-head-browser-check-${runId}.json`,
);
const loadingScreenshotName = `preview-auth-loading-current-head-${runId}.png`;
const loginScreenshotName = `preview-auth-loading-login-current-head-${runId}.png`;
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'docs/architecture/production-readiness/evidence/A06/run-auth-loading-current-head-browser-check.mjs',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/contexts/AuthContext.tsx',
  'src/app/components/layout/WebCommandBar.tsx',
  'src/app/components/layout/WebSidebar.tsx',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
];
const sha256 = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, relativePath)))
    .digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

const contract = parse(await fs.readFile(path.join(root, 'contracts/openapi/auth.yaml'), 'utf8'));
const operations = Object.values(contract.paths).flatMap((item) => Object.values(item));
const sessionOperation = operations.find((operation) => operation.operationId === 'getSession');
const authOperationIds = operations
  .filter((operation) => typeof operation.operationId === 'string')
  .map((operation) => operation.operationId);
assert.ok(Object.hasOwn(sessionOperation?.responses ?? {}, '401'));

const requests = [];
const responses = [];
const requestTimes = new WeakMap();
const responseTimes = new WeakMap();
const externalApiOrigins = new Set();
const pageErrors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestTimes.set(request, Date.now());
  requests.push({ method: request.method(), path: url.pathname });
  if (url.origin !== origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  responseTimes.set(response, Date.now());
  responses.push({
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  const startedAt = Date.now();
  const bootstrapResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  void bootstrapResponsePromise.catch(() => undefined);
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const bootstrapResponse = await bootstrapResponsePromise;
  assert.equal(bootstrapResponse.status(), 401);
  assert.equal(bootstrapResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('auth');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const scenarioVisible = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.loading', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const scenarioRequestStart = requests.length;
  const scenarioResponseStart = responses.length;
  let scenarioResponseSeen = false;
  const requestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/auth/session' && request.method() === 'GET',
  );
  void requestPromise.catch(() => undefined);
  const responsePromise = page.waitForResponse((response) => {
    const matches =
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET';
    if (matches) scenarioResponseSeen = true;
    return matches;
  });
  void responsePromise.catch(() => undefined);
  await page.goto(`${origin}/w/trade/positions`, { waitUntil: 'domcontentloaded' });
  const scenarioRequest = await requestPromise;
  const loadingStatus = page.getByRole('status', { name: 'Đang kiểm tra phiên đăng nhập' });
  await loadingStatus.waitFor({ state: 'visible' });
  const loadingVisibleBeforeResponse = await loadingStatus.isVisible();
  const loginFormVisibleWhileLoading = await page
    .getByTestId('auth-submit')
    .isVisible()
    .catch(() => false);
  const protectedContentVisibleWhileLoading = await page
    .getByRole('heading', { name: 'Vị thế đang mở', exact: true })
    .isVisible()
    .catch(() => false);
  const staticIdentityVisibleWhileLoading =
    (await page
      .getByText('VitTrader Pro', { exact: true })
      .isVisible()
      .catch(() => false)) ||
    (await page
      .getByText('VIP 3', { exact: true })
      .isVisible()
      .catch(() => false)) ||
    (await page
      .getByText('VitTrader', { exact: true })
      .isVisible()
      .catch(() => false));
  await page.screenshot({
    path: path.join(evidenceDirectory, loadingScreenshotName),
    fullPage: true,
  });
  const responsePendingAtScreenshot = !scenarioResponseSeen;

  const scenarioResponse = await responsePromise;
  const requestObservedAt = requestTimes.get(scenarioRequest);
  const responseObservedAt = responseTimes.get(scenarioResponse);
  const responseDelayMs =
    typeof requestObservedAt === 'number' && typeof responseObservedAt === 'number'
      ? responseObservedAt - requestObservedAt
      : null;
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
  const finalRoute = new URL(page.url()).pathname;
  const loginFormVisibleAfterResponse = await page.getByTestId('auth-submit').isVisible();
  const loginErrorVisible =
    (await page.getByText('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.').count()) >
    0;
  await page.screenshot({
    path: path.join(evidenceDirectory, loginScreenshotName),
    fullPage: true,
  });

  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const writeRequests = scenarioRequests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  const financialRequests = scenarioRequests.filter((request) =>
    /^\/api\/(?:trading|wallet|p2p|dca|earn|predictions)\//.test(request.path),
  );
  assert.equal(scenarioVisible, true);
  assert.equal(loadingVisibleBeforeResponse, true);
  assert.equal(responsePendingAtScreenshot, true);
  assert.equal(loginFormVisibleWhileLoading, false);
  assert.equal(protectedContentVisibleWhileLoading, false);
  assert.equal(staticIdentityVisibleWhileLoading, false);
  assert.equal(scenarioResponse.status(), 401);
  assert.equal(scenarioResponse.fromServiceWorker(), true);
  assert.ok(
    responseDelayMs >= 1_800,
    `Expected delayed loading response; observed ${responseDelayMs} ms.`,
  );
  assert.match(finalRoute, /\/(?:w\/)?auth\/login$/);
  assert.equal(loginFormVisibleAfterResponse, true);
  assert.equal(loginErrorVisible, false);
  assert.equal(
    scenarioRequests.length,
    1,
    'Auth session loading should issue one GET in this route flow.',
  );
  assert.equal(writeRequests.length, 0);
  assert.equal(financialRequests.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);

  const sourceHashes = {};
  for (const relativePath of sourcePaths) sourceHashes[relativePath] = await sha256(relativePath);
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'auth.loading',
      domain: 'auth',
      state: 'loading',
      status: 'passed',
      persona: 'guest (no authenticated session)',
      role: 'unauthenticated',
      permissions: [],
      operationIds: authOperationIds,
      observedOperationIds: ['getSession'],
      operationRequestCounts: { getSession: scenarioRequests.length },
      requests: scenarioRequests,
      responses: scenarioResponses,
      initialSessionResponse: {
        status: bootstrapResponse.status(),
        fromServiceWorker: bootstrapResponse.fromServiceWorker(),
      },
      delayedSessionResponse: {
        status: scenarioResponse.status(),
        fromServiceWorker: scenarioResponse.fromServiceWorker(),
        delayMs: responseDelayMs,
      },
      loadingVisibleBeforeResponse,
      responsePendingAtScreenshot,
      loginFormVisibleWhileLoading,
      protectedContentVisibleWhileLoading,
      staticIdentityVisibleWhileLoading,
      loginFormVisibleAfterResponse,
      loginErrorVisible,
      protectedRoute: '/w/trade/positions',
      finalRoute,
      redirectedToLogin: /\/(?:w\/)?auth\/login$/.test(finalRoute),
      writeRequestCount: writeRequests.length,
      financialApiRequestCount: financialRequests.length,
      elapsedMs: Date.now() - startedAt,
      externalApiOrigins: [...externalApiOrigins],
      pageErrors,
      screenshots: [loadingScreenshotName, loginScreenshotName],
      note: 'The local auth.loading fixture delays getSession before the contract-supported 401 response. The protected-route pending view was visible before response; no login form, protected content or static identity appeared during pending. Backend/session cookie behavior, production and user acceptance are unverified.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: await page.evaluate(() =>
        Boolean(navigator.serviceWorker.controller),
      ),
      allObservedResponsesFromServiceWorker: [...responses].every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: requests.length,
      apiResponseCount: responses.length,
      sessionRequestCount: scenarioRequests.length,
      sessionResponseCount: scenarioResponses.length,
      responseDelayMs,
      writeRequestCount: writeRequests.length,
      financialApiRequestCount: financialRequests.length,
      externalApiOriginCount: externalApiOrigins.size,
      pageErrors,
    },
    contract: {
      operationId: 'getSession',
      declaredResponses: Object.keys(sessionOperation.responses),
      observedStatus: scenarioResponse.status(),
    },
    sourceHashes,
    limitations:
      'This run used local Vite development and MSW. It does not establish backend session persistence, cookie behavior, staging, production or user acceptance.',
  };
  await fs.writeFile(reportPath, await serializeJson(report, reportPath));
  process.stdout.write(
    `${JSON.stringify({ reportPath, scenario: report.scenario, measurements: report.measurements, sourceHashes }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(
    `Auth loading browser check failed: ${error instanceof Error ? error.stack : String(error)}\n`,
  );
  throw error;
} finally {
  await context.close();
  await browser.close();
}

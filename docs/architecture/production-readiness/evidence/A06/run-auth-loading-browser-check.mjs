import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/auth-loading-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-auth-loading-browser-check.mjs';
const screenshotNames = [
  'preview-auth-loading-protected-route-2026-09-29.png',
  'preview-auth-loading-login-final-2026-09-29.png',
];
const baselineScreenshotName =
  'preview-auth-loading-protected-route-before-identity-fix-2026-09-29.png';
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'src/app/components/layout/ProtectedRoute.tsx',
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
  'src/shared/session/AuthContext.tsx',
];
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';

function readFile(relativePath) {
  return fsSync.readFileSync(path.join(ROOT, relativePath));
}

function sha256(relativePath) {
  return crypto.createHash('sha256').update(readFile(relativePath)).digest('hex');
}

async function serializeJson(value, destination) {
  return prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });
}

function operationFor(operationMap, method, pathname) {
  return operationMap.operations.find(
    (operation) => operation.method === method && pathname.endsWith(operation.path),
  )?.operationId;
}

const masterPath = path.join(ROOT, masterReportRelativePath);
const reportPath = path.join(ROOT, reportRelativePath);
const master = JSON.parse(await fs.readFile(masterPath, 'utf8'));
for (const [relativePath, expectedHash] of Object.entries(master.sourceHashes ?? {})) {
  if (relativePath === runnerRelativePath) continue;
  assert.equal(
    sha256(relativePath),
    expectedHash,
    `Existing runtime evidence is stale at ${relativePath}; refresh the full preview runner first.`,
  );
}

const tracking = JSON.parse(
  await fs.readFile(
    path.join(ROOT, 'docs/architecture/production-readiness/TRACKING.json'),
    'utf8',
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(
  sourceHead,
  tracking.baseline.sourceHead,
  'Auth evidence must match the A06 baseline HEAD.',
);
const operationMap = JSON.parse(await fs.readFile(path.join(ROOT, operationMapPath), 'utf8'));
const authOperationIds = operationMap.operations
  .filter((operation) => operation.domain === 'auth')
  .map((operation) => operation.operationId);
const requests = [];
const responses = [];
const requestTimes = new WeakMap();
const responseTimes = new WeakMap();
const externalApiOrigins = new Set();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const observedAtMs = Date.now();
  requestTimes.set(request, observedAtMs);
  requests.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    observedAtMs,
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const observedAtMs = Date.now();
  responseTimes.set(response, observedAtMs);
  responses.push({
    operationId: operationFor(operationMap, response.request().method(), url.pathname) ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    observedAtMs,
  });
});

const startedAt = Date.now();
const failures = [];
let initialSessionResponse = null;
let scenarioSessionResponse = null;
let responseDelayMs = null;
let loadingVisibleBeforeResponse = false;
let loginFormVisibleWhileLoading = false;
let loginFormVisibleAfterResponse = false;
let loginErrorVisible = false;
let scenarioSelected = false;
let protectedContentVisibleWhileLoading = null;
let staticIdentityVisibleWhileLoading = null;
let finalRoute = null;
let screenshotResults = [];
let scenarioRequestStart = 0;
let scenarioResponseStart = 0;

try {
  const initialSessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  initialSessionResponse = await initialSessionPromise;
  assert.equal(initialSessionResponse.status(), 401);
  assert.equal(initialSessionResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('auth');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.loading', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  scenarioRequestStart = requests.length;
  scenarioResponseStart = responses.length;
  const requestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/auth/session' && request.method() === 'GET',
  );
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/trade/positions`, { waitUntil: 'domcontentloaded' });
  const scenarioRequest = await requestPromise;
  const loadingStatus = page.getByRole('status', { name: 'Đang kiểm tra phiên đăng nhập' });
  await loadingStatus.waitFor({ state: 'visible' });
  loadingVisibleBeforeResponse = await loadingStatus.isVisible();
  loginFormVisibleWhileLoading = await page
    .getByTestId('auth-submit')
    .isVisible()
    .catch(() => false);
  protectedContentVisibleWhileLoading = await page
    .getByRole('heading', { name: 'Vị thế đang mở', exact: true })
    .isVisible()
    .catch(() => false);
  staticIdentityVisibleWhileLoading =
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
  const loadingScreenshotPath = path.join(evidenceDirectory, screenshotNames[0]);
  await page.screenshot({ path: loadingScreenshotPath, fullPage: true });
  screenshotResults.push(screenshotNames[0]);

  scenarioSessionResponse = await responsePromise;
  const requestObservedAt = requestTimes.get(scenarioRequest);
  const responseObservedAt = responseTimes.get(scenarioSessionResponse);
  responseDelayMs =
    typeof requestObservedAt === 'number' && typeof responseObservedAt === 'number'
      ? responseObservedAt - requestObservedAt
      : null;
  await page.waitForURL(/\/(?:w\/)?auth\/login$/, { timeout: 10_000 });
  await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
  finalRoute = new URL(page.url()).pathname;
  loginFormVisibleAfterResponse = await page.getByTestId('auth-submit').isVisible();
  loginErrorVisible = await page
    .getByText('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.')
    .isVisible()
    .catch(() => false);
  const finalScreenshotPath = path.join(evidenceDirectory, screenshotNames[1]);
  await page.screenshot({ path: finalScreenshotPath, fullPage: true });
  screenshotResults.push(screenshotNames[1]);

  assert.equal(scenarioSelected, true, 'The preview panel should show auth.loading as active.');
  assert.equal(
    loadingVisibleBeforeResponse,
    true,
    'ProtectedRoute should show its loading status while getSession is pending.',
  );
  assert.equal(
    loginFormVisibleWhileLoading,
    false,
    'The login form must not flash before the session check finishes.',
  );
  assert.equal(
    protectedContentVisibleWhileLoading,
    false,
    'Protected trade content must not render while the session check is pending.',
  );
  assert.equal(
    staticIdentityVisibleWhileLoading,
    false,
    'The shell must not show a hard-coded account identity while the session is pending.',
  );
  assert.equal(
    scenarioSessionResponse.status(),
    401,
    'The delayed unauthenticated session should follow the contract handler.',
  );
  assert.equal(
    scenarioSessionResponse.fromServiceWorker(),
    true,
    'The response should be provided by local MSW.',
  );
  assert.ok(
    responseDelayMs >= 1_800,
    `Expected the configured loading delay; observed ${responseDelayMs} ms.`,
  );
  assert.match(
    finalRoute,
    /\/(?:w\/)?auth\/login$/,
    'A 401 session check should finish at the login route.',
  );
  assert.equal(
    loginFormVisibleAfterResponse,
    true,
    'The login form should appear after the session check resolves.',
  );
  assert.equal(
    loginErrorVisible,
    false,
    'A session bootstrap response should not be shown as a login submission error.',
  );
  assert.equal(externalApiOrigins.size, 0, 'No API request should leave the local preview origin.');
  assert.deepEqual(
    requests
      .slice(scenarioRequestStart)
      .filter((request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method)),
    [],
    'The loading check must not send API writes.',
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  if (screenshotResults.length === 0) {
    const diagnosticPath = path.join(evidenceDirectory, screenshotNames[0]);
    await page.screenshot({ path: diagnosticPath, fullPage: true }).catch(() => {});
    if (fsSync.existsSync(diagnosticPath)) screenshotResults.push(screenshotNames[0]);
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;

  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const apiWrites = scenarioRequests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  const responseForSession = scenarioResponses.find(
    (response) => response.operationId === 'getSession',
  );
  const scenario = {
    id: 'auth.loading',
    domain: 'auth',
    state: 'loading',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'guest (no authenticated session)',
    role: 'unauthenticated',
    permissions: [],
    route: '/w/trade/positions',
    finalRoute,
    operationIds: authOperationIds,
    observedOperationIds: responseForSession ? ['getSession'] : [],
    operationRequestCounts: {
      getSession: scenarioRequests.filter((request) => request.operationId === 'getSession').length,
    },
    requests: scenarioRequests.map(({ operationId, method, path: requestPath, observedAtMs }) => ({
      operationId,
      method,
      path: requestPath,
      observedAtMs,
    })),
    responses: scenarioResponses.map(
      ({ operationId, method, path: requestPath, status, fromServiceWorker, observedAtMs }) => ({
        operationId,
        method,
        path: requestPath,
        status,
        fromServiceWorker,
        observedAtMs,
      }),
    ),
    initialSessionResponse: initialSessionResponse
      ? {
          status: initialSessionResponse.status(),
          fromServiceWorker: initialSessionResponse.fromServiceWorker(),
        }
      : null,
    sessionResponse: responseForSession
      ? {
          status: responseForSession.status,
          fromServiceWorker: responseForSession.fromServiceWorker,
        }
      : null,
    loadingVisibleBeforeResponse,
    responseDelayMs,
    loginFormVisibleWhileLoading,
    protectedContentVisibleWhileLoading,
    staticIdentityVisibleWhileLoading,
    loginFormVisibleAfterResponse,
    loginErrorVisible,
    activeScenarioVisible: scenarioSelected,
    finalRoute,
    externalApiOrigins: [...externalApiOrigins],
    writeRequestCount: apiWrites.length,
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotResults,
    baselineScreenshot: baselineScreenshotName,
    failures,
    note: 'Chromium observed the Auth session loading state on protected /w/trade/positions while local MSW delayed GET /auth/session for two seconds, then returned the contract-declared 401 for the guest. The route guard prevented the login form and protected trade content from flashing; the web shell now uses the resolved Auth user and shows a neutral session-check label rather than fixture identity while pending. The pre-fix screenshot is retained for comparison. This is local UI/MSW evidence only; it does not certify backend session behavior, authorization, staging, production or user acceptance.',
  };

  const hashPaths = new Set([
    ...Object.keys(master.sourceHashes ?? {}),
    ...sourcePaths,
    operationMapPath,
    runnerRelativePath,
  ]);
  const sourceHashes = Object.fromEntries(
    [...hashPaths].sort().map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      [...sourcePaths, operationMapPath, runnerRelativePath]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));

  master.sourceHashes = sourceHashes;
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'auth.loading');
  master.scenarios.push(scenario);
  master.authLoadingEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Added by the focused Auth session-loading browser check; checkedAt remains the timestamp of the full preview-suite run.',
  };
  master.screenshots = [
    ...new Set([...(master.screenshots ?? []), baselineScreenshotName, ...screenshotResults]),
  ];
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

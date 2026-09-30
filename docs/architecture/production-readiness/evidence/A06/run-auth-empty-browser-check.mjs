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
  'docs/architecture/production-readiness/evidence/A06/auth-empty-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-auth-empty-browser-check.mjs';
const screenshotName = 'preview-auth-empty-session-2026-09-29.png';
const screenshotPath = path.join(evidenceDirectory, screenshotName);
const reportPath = path.join(ROOT, reportRelativePath);
const masterReportPath = path.join(ROOT, masterReportRelativePath);
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const sourcePaths = [
  'contracts/openapi/auth.yaml',
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
  'src/shared/session/AuthContext.tsx',
];

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

const master = JSON.parse(await fs.readFile(masterReportPath, 'utf8'));
for (const [relativePath, expectedHash] of Object.entries(master.sourceHashes ?? {})) {
  if (relativePath === runnerRelativePath) continue;
  assert.equal(
    sha256(relativePath),
    expectedHash,
    `Existing browser evidence is stale at ${relativePath}; refresh the full preview runner first.`,
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
  'The evidence must match the A06 baseline HEAD.',
);
const operationMap = JSON.parse(await fs.readFile(path.join(ROOT, operationMapPath), 'utf8'));
const authOperationIds = operationMap.operations
  .filter((operation) => operation.domain === 'auth')
  .map((operation) => operation.operationId);
const requests = [];
const responses = [];
const externalApiOrigins = new Set();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requests.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    startedAtMs: Date.now(),
  });
  if (url.origin !== origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  responses.push({
    operationId: operationFor(operationMap, response.request().method(), url.pathname) ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});

const startedAt = Date.now();
let initialSessionResponse;
let firstEmptySessionResponse;
let protectedRouteSessionResponse;
let firstEmptyPayload;
let finalRoute;
let loginFormVisible = false;
let loginErrorVisible = false;
let activeScenarioVisible = false;
let protectedRouteRedirectedToLogin = false;

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
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const firstEmptySessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  await page.evaluate(() => window.location.reload());
  await page.waitForURL('**/w/auth/login');
  firstEmptySessionResponse = await firstEmptySessionPromise;
  firstEmptyPayload = await firstEmptySessionResponse.json();
  assert.equal(firstEmptySessionResponse.fromServiceWorker(), true);
  assert.equal(firstEmptyPayload, null);
  await page.getByTestId('auth-email').waitFor();
  loginFormVisible = await page.getByTestId('auth-submit').isVisible();
  loginErrorVisible = await page
    .getByText('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.')
    .isVisible()
    .catch(() => false);
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  activeScenarioVisible = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.empty', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const protectedRouteSessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  await page.goto(`${origin}/w/trade/positions`, { waitUntil: 'domcontentloaded' });
  protectedRouteSessionResponse = await protectedRouteSessionPromise;
  assert.equal(await protectedRouteSessionResponse.json(), null);
  assert.equal(protectedRouteSessionResponse.fromServiceWorker(), true);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByTestId('auth-submit').waitFor();
  finalRoute = new URL(page.url()).pathname;
  protectedRouteRedirectedToLogin = /\/(?:w\/)?auth\/login$/.test(finalRoute);
  loginFormVisible = loginFormVisible && (await page.getByTestId('auth-submit').isVisible());
  await page.screenshot({ path: screenshotPath, fullPage: true });

  assert.equal(loginFormVisible, true, 'A null session should keep the login form ready.');
  assert.equal(
    loginErrorVisible,
    false,
    'A contract-valid null session should not render login error.',
  );
  assert.equal(
    activeScenarioVisible,
    true,
    'The UI should retain the selected auth.empty preview state.',
  );
  assert.equal(
    protectedRouteRedirectedToLogin,
    true,
    'A null session must not enter a protected trading route.',
  );
  assert.equal(externalApiOrigins.size, 0);

  const apiWrites = requests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  assert.deepEqual(apiWrites, [], 'The empty-session scenario must not send mutations.');
  const emptySessionResponses = responses.filter(
    (response) => response.operationId === 'getSession' && response.status === 200,
  );
  assert.equal(
    emptySessionResponses.length,
    2,
    'Both login and protected-route checks should receive null.',
  );
  assert.equal(
    responses.filter((response) => response.operationId === 'getSession' && response.status === 401)
      .length,
    1,
  );

  const scenario = {
    id: 'auth.empty',
    domain: 'auth',
    state: 'empty',
    status: 'passed',
    observedAt: new Date().toISOString(),
    persona: 'guest (no authenticated session)',
    role: 'unauthenticated',
    permissions: [],
    route: '/w/auth/login',
    protectedRoute: '/w/trade/positions',
    finalRoute,
    operationIds: authOperationIds,
    observedOperationIds: ['getSession'],
    operationRequestCounts: {
      getSession: requests.filter((request) => request.operationId === 'getSession').length,
    },
    requests,
    responses: responses.map(
      ({ operationId, method, path: requestPath, status, fromServiceWorker }) => ({
        operationId,
        method,
        path: requestPath,
        status,
        fromServiceWorker,
      }),
    ),
    initialSessionResponse: {
      status: initialSessionResponse.status(),
      fromServiceWorker: initialSessionResponse.fromServiceWorker(),
    },
    emptySessionResponse: {
      status: firstEmptySessionResponse.status(),
      body: firstEmptyPayload,
      fromServiceWorker: firstEmptySessionResponse.fromServiceWorker(),
    },
    loginFormVisible,
    loginErrorVisible,
    activeScenarioVisible,
    protectedRouteRedirectedToLogin,
    externalApiOrigins: [...externalApiOrigins],
    writeRequestCount: apiWrites.length,
    elapsedMs: Date.now() - startedAt,
    screenshots: [screenshotName],
    note: 'The Auth preview empty scenario uses the contract-permitted GET /auth/session 200 with JSON null. The login form remains usable and the protected /w/trade/positions route redirects to an Auth login route. /w/home is public in routeConfig and is intentionally not used as the protected-route assertion. The initial 401 is only the pre-scenario unauthenticated bootstrap; only getSession is counted as observed for auth.empty (1/14 linked Auth operations). All requests are local MSW and read-only. This does not prove backend session/cookie behavior, staging, or production.',
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
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'auth.empty');
  master.scenarios.push(scenario);
  master.authEmptyEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Added by the reproducible Auth null-session browser check; checkedAt continues to identify the full-run timestamp above.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), screenshotName])];
  await fs.writeFile(masterReportPath, await serializeJson(master, masterReportPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
} finally {
  await browser.close();
}

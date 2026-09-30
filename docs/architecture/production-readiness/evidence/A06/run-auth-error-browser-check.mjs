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
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/auth-error-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-auth-error-browser-check.mjs';
const screenshots = [
  'preview-auth-error-login-recoverable-2026-09-29.png',
  'preview-auth-error-login-retry-2026-09-29.png',
];
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/contexts/AppContext.tsx',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
];
const reportPath = path.join(ROOT, reportRelativePath);
const masterPath = path.join(ROOT, masterReportRelativePath);
const reportDirectory = path.dirname(reportPath);

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

const master = JSON.parse(await fs.readFile(masterPath, 'utf8'));
for (const [relativePath, expectedHash] of Object.entries(master.sourceHashes ?? {})) {
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
const operationMap = JSON.parse(
  await fs.readFile(path.join(ROOT, operationMapRelativePath), 'utf8'),
);
const authOperationIds = operationMap.operations
  .filter((operation) => operation.domain === 'auth')
  .map((operation) => operation.operationId);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const requestFailures = [];
const externalApiOrigins = new Set();
const scenarioStartedAt = Date.now();
let scenarioRequestStart = 0;
let scenarioResponseStart = 0;
let scenarioSelected = false;
let errorVisibleAfterInitialFailure = false;
let retryEnabledAfterInitialFailure = false;
let errorVisibleAfterRetry = false;
let retryEnabledAfterRetry = false;
let finalRoute = null;
const failures = [];

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requests.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    observedAtMs: Date.now(),
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
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
    observedAtMs: Date.now(),
  });
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestFailures.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown transport failure',
    observedAtMs: Date.now(),
  });
});

try {
  const bootstrapSessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const bootstrapSessionResponse = await bootstrapSessionPromise;
  assert.equal(bootstrapSessionResponse.status(), 401, 'Guest bootstrap should use contract 401.');
  assert.equal(bootstrapSessionResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('auth');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.error', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  scenarioRequestStart = requests.length;
  scenarioResponseStart = responses.length;

  const firstLoginRequest = page.waitForRequest(
    (request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === '/api/auth/login',
  );
  const firstLoginFailure = page.waitForEvent(
    'requestfailed',
    (request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === '/api/auth/login',
  );
  await page.getByTestId('auth-submit').click();
  await firstLoginRequest;
  await firstLoginFailure;
  const alert = page.getByRole('alert');
  await alert.waitFor({ state: 'visible' });
  errorVisibleAfterInitialFailure = await alert.isVisible();
  retryEnabledAfterInitialFailure = await page.getByTestId('auth-submit').isEnabled();
  await page.screenshot({ path: path.join(reportDirectory, screenshots[0]), fullPage: true });

  const retryLoginRequest = page.waitForRequest(
    (request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === '/api/auth/login',
  );
  const retryLoginFailure = page.waitForEvent(
    'requestfailed',
    (request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === '/api/auth/login',
  );
  await page.getByTestId('auth-submit').click();
  await retryLoginRequest;
  await retryLoginFailure;
  await alert.waitFor({ state: 'visible' });
  errorVisibleAfterRetry = await alert.isVisible();
  retryEnabledAfterRetry = await page.getByTestId('auth-submit').isEnabled();
  await page.screenshot({ path: path.join(reportDirectory, screenshots[1]), fullPage: true });
  finalRoute = new URL(page.url()).pathname;

  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.filter(
    (failure) => failure.method === 'POST' && failure.path.endsWith('/auth/login'),
  );
  const unexpectedWrites = scenarioRequests.filter(
    (request) =>
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      !(request.method === 'POST' && request.path.endsWith('/auth/login')),
  );
  assert.equal(scenarioSelected, true, 'Preview controls should show auth.error as active.');
  assert.equal(errorVisibleAfterInitialFailure, true, 'A failed login must show a visible error.');
  assert.equal(retryEnabledAfterInitialFailure, true, 'The login action must be retryable.');
  assert.equal(
    errorVisibleAfterRetry,
    true,
    'The retry should surface the same recoverable error.',
  );
  assert.equal(retryEnabledAfterRetry, true, 'The next login retry must remain available.');
  assert.equal(
    finalRoute,
    '/w/auth/login',
    'A transport failure must not navigate as if login succeeded.',
  );
  assert.equal(scenarioRequests.filter((request) => request.operationId === 'login').length, 2);
  assert.equal(
    scenarioFailures.length,
    2,
    'Both attempted logins should fail at the transport boundary.',
  );
  assert.equal(
    scenarioResponses.filter((response) => response.operationId === 'login').length,
    0,
    'Auth OpenAPI has no 5xx response; this local transport failure must not invent an HTTP status.',
  );
  assert.deepEqual(unexpectedWrites, [], 'No other Auth or product mutation should be sent.');
  assert.equal(externalApiOrigins.size, 0, 'No API request should leave the local preview origin.');
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  const diagnosticPath = path.join(reportDirectory, screenshots[0]);
  if (!fsSync.existsSync(diagnosticPath)) {
    await page.screenshot({ path: diagnosticPath, fullPage: true }).catch(() => {});
    if (fsSync.existsSync(diagnosticPath)) screenshots.push(screenshots[0]);
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.filter(
    (failure) => failure.method === 'POST' && failure.path.endsWith('/auth/login'),
  );
  const observedOperationIds = [
    ...new Set(scenarioRequests.map((request) => request.operationId).filter(Boolean)),
  ];
  const scenario = {
    id: 'auth.error',
    domain: 'auth',
    state: 'error',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'guest (no authenticated session)',
    role: 'unauthenticated',
    permissions: [],
    route: '/w/auth/login',
    finalRoute,
    operationIds: authOperationIds,
    observedOperationIds,
    operationRequestCounts: {
      login: scenarioRequests.filter((request) => request.operationId === 'login').length,
      getSession: scenarioRequests.filter((request) => request.operationId === 'getSession').length,
    },
    requests: scenarioRequests,
    responses: scenarioResponses,
    requestFailures: scenarioFailures,
    bootstrapSessionResponse: {
      status: 401,
      fromServiceWorker: true,
    },
    errorVisibleAfterInitialFailure,
    retryEnabledAfterInitialFailure,
    errorVisibleAfterRetry,
    retryEnabledAfterRetry,
    noSuccessfulLoginNavigation: finalRoute === '/w/auth/login',
    externalApiOrigins: [...externalApiOrigins],
    unexpectedWriteCount: scenarioRequests.filter(
      (request) =>
        !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
        !(request.method === 'POST' && request.path.endsWith('/auth/login')),
    ).length,
    elapsedMs: Date.now() - scenarioStartedAt,
    screenshots: [
      ...new Set(screenshots.filter((name) => fsSync.existsSync(path.join(reportDirectory, name)))),
    ],
    failures,
    note: 'The Auth OpenAPI contract declares no 5xx responses. The local preview injects a statusless transport failure only for POST /auth/login; guest session bootstrap continues through its contract-declared 401 handler. The login form stays visible, announces a neutral recoverable error, and permits retry without a successful navigation. This is local browser/MSW evidence only.',
  };

  const hashPaths = new Set([
    ...Object.keys(master.sourceHashes ?? {}),
    ...sourcePaths,
    operationMapRelativePath,
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
      [...sourcePaths, operationMapRelativePath, runnerRelativePath]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));

  master.sourceHashes = sourceHashes;
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'auth.error');
  master.scenarios.push(scenario);
  master.authErrorEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Added by the focused Auth login error/retry browser check; checkedAt remains the full preview-suite timestamp.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...scenario.screenshots])];
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

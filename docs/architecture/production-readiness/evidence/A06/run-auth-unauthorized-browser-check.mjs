import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/auth-unauthorized-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-auth-unauthorized-browser-check.mjs';
const screenshotName = 'preview-auth-unauthorized-session-2026-09-29.png';
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/shared/session/AuthContext.tsx',
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json',
  runnerRelativePath,
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

const masterPath = path.join(ROOT, masterReportRelativePath);
const reportPath = path.join(ROOT, reportRelativePath);
const master = JSON.parse(await fs.readFile(masterPath, 'utf8'));
for (const [relativePath, expectedHash] of Object.entries(master.sourceHashes ?? {})) {
  if (relativePath === runnerRelativePath) continue;
  assert.equal(
    sha256(relativePath),
    expectedHash,
    `Refresh preview evidence after ${relativePath} changes.`,
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
  await fs.readFile(
    path.join(
      ROOT,
      'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json',
    ),
    'utf8',
  ),
);
const authOperationIds = operationMap.operations
  .filter((operation) => operation.domain === 'auth')
  .map((operation) => operation.operationId);
const operationFor = (method, pathname) =>
  operationMap.operations.find(
    (operation) => operation.method === method && pathname.endsWith(operation.path),
  )?.operationId;

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
    operationId: operationFor(request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  responses.push({
    operationId: operationFor(response.request().method(), url.pathname) ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});

const startedAt = Date.now();
const failures = [];
let initialSessionResponse = null;
let sessionResponse = null;
let scenarioSelected = false;
let finalRoute = null;
let loginFormVisible = false;
let protectedContentVisible = null;
let screenshotSaved = false;
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.unauthorized', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  scenarioRequestStart = requests.length;
  scenarioResponseStart = responses.length;
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/trade/positions`, { waitUntil: 'domcontentloaded' });
  sessionResponse = await sessionPromise;
  await page.waitForURL(/\/(?:w\/)?auth\/login$/, { timeout: 10_000 });
  await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
  finalRoute = new URL(page.url()).pathname;
  loginFormVisible = await page.getByTestId('auth-submit').isVisible();
  protectedContentVisible = await page
    .getByRole('heading', { name: 'Vị thế đang mở', exact: true })
    .isVisible()
    .catch(() => false);
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });
  screenshotSaved = true;

  assert.equal(scenarioSelected, true, 'Preview controls should show auth.unauthorized.');
  assert.equal(sessionResponse.status(), 401, 'The session endpoint explicitly declares 401.');
  assert.equal(
    sessionResponse.fromServiceWorker(),
    true,
    'The local MSW worker should supply the response.',
  );
  assert.match(finalRoute, /\/(?:w\/)?auth\/login$/, 'The guest should end on an Auth route.');
  assert.equal(
    loginFormVisible,
    true,
    'The login form should be available after the 401 redirect.',
  );
  assert.equal(
    protectedContentVisible,
    false,
    'Protected content must not render after session 401.',
  );
  assert.equal(externalApiOrigins.size, 0, 'No API request should leave the local preview origin.');
  assert.deepEqual(
    requests
      .slice(scenarioRequestStart)
      .filter((request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method)),
    [],
    'The unauthorized session check must not send API writes.',
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  if (!screenshotSaved) {
    await page
      .screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true })
      .catch(() => {});
    screenshotSaved = fsSync.existsSync(path.join(evidenceDirectory, screenshotName));
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses
    .slice(scenarioResponseStart)
    .filter((response) => response.operationId === 'getSession');
  const sessionResponseRecord = scenarioResponses.at(-1);
  const scenario = {
    id: 'auth.unauthorized',
    domain: 'auth',
    state: 'unauthorized',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'guest (no authenticated session)',
    role: 'unauthenticated',
    permissions: [],
    route: '/w/trade/positions',
    finalRoute,
    operationIds: authOperationIds,
    observedOperationIds: sessionResponseRecord ? ['getSession'] : [],
    operationRequestCounts: {
      getSession: scenarioRequests.filter((request) => request.operationId === 'getSession').length,
    },
    requests: scenarioRequests,
    responses: scenarioResponses,
    initialSessionResponse: initialSessionResponse
      ? {
          status: initialSessionResponse.status(),
          fromServiceWorker: initialSessionResponse.fromServiceWorker(),
        }
      : null,
    sessionResponse: sessionResponseRecord
      ? {
          status: sessionResponseRecord.status,
          fromServiceWorker: sessionResponseRecord.fromServiceWorker,
        }
      : null,
    scenarioSelected,
    loginFormVisible,
    protectedContentVisible,
    externalApiOrigins: [...externalApiOrigins],
    unexpectedWriteCount: scenarioRequests.filter(
      (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
    ).length,
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotSaved ? [screenshotName] : [],
    failures,
    note: 'Only GET /auth/session is exercised for this browser assertion because it explicitly declares 401 in Auth OpenAPI. The other Auth operations in the matrix are not inferred from this result; operations without a declared 401/403 remain unverified. This is local UI/MSW evidence only.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths])]
      .sort()
      .map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      sourcePaths.sort().map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));
  master.sourceHashes = sourceHashes;
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'auth.unauthorized');
  master.scenarios.push(scenario);
  master.authUnauthorizedEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Focused local browser check of the contract-declared getSession 401 path; the other linked Auth operations remain unverified.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), screenshotName])];
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

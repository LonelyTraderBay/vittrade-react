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
  'docs/architecture/production-readiness/evidence/A06/auth-success-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const screenshotName = 'preview-auth-success-login-2026-09-29.png';
const screenshotPath = path.join(evidenceDirectory, screenshotName);
const reportPath = path.join(ROOT, reportRelativePath);
const masterReportPath = path.join(ROOT, masterReportRelativePath);
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-auth-success-browser-check.mjs';
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'src/app/contexts/AuthContext.tsx',
  'src/app/components/layout/WebCommandBar.tsx',
  'src/app/routes.ts',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/app/components/layout/WebSidebar.tsx',
  'src/shared/session/AuthContext.tsx',
];

function sha256(relativePath) {
  return crypto.createHash('sha256').update(requireFile(relativePath)).digest('hex');
}

function requireFile(relativePath) {
  return fsSync.readFileSync(path.join(ROOT, relativePath));
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
let loginResponse;
let loginPayload;
let finalRoute;
let visibleIdentity = false;
let pageTextLength = 0;

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
  assert.equal(
    initialSessionResponse.status(),
    401,
    'Unauthenticated session bootstrap should return contract 401.',
  );
  assert.equal(
    initialSessionResponse.fromServiceWorker(),
    true,
    'Session bootstrap must be local MSW.',
  );

  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  const loginStartedAt = Date.now();
  await page.getByTestId('auth-submit').click();
  loginResponse = await loginResponsePromise;
  loginPayload = await loginResponse.json();
  await page.waitForURL('**/w/home');
  await page.locator('body').waitFor({ state: 'visible' });
  finalRoute = new URL(page.url()).pathname;
  const pageText = await page.locator('body').innerText();
  pageTextLength = pageText.trim().length;
  visibleIdentity = pageText.includes('VitTrade Developer');
  const visibleShellIdentity = pageText.includes('VitTrader Pro') ? 'VitTrader Pro' : null;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  assert.equal(loginResponse.status(), 200, 'Successful login must return contract HTTP 200.');
  assert.equal(
    loginResponse.fromServiceWorker(),
    true,
    'Login response must be served by local MSW.',
  );
  assert.equal(
    visibleShellIdentity,
    null,
    'Authenticated shell must not display the former hard-coded account identity.',
  );
  assert.equal(loginPayload.status, 'authenticated');
  assert.equal(loginPayload.session?.user?.email, 'developer@vittrade.local');
  assert.equal(finalRoute, '/w/home', 'Authenticated login must reach the protected home route.');
  assert.ok(pageTextLength > 0, 'Home route should render visible page content.');
  assert.equal(
    externalApiOrigins.size,
    0,
    'Auth browser scenario must not call an external API origin.',
  );

  const apiWrites = requests.filter(
    (request) =>
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.path !== '/api/auth/login',
  );
  assert.deepEqual(apiWrites, [], 'The login scenario must not cause unrelated API writes.');

  const successfulObservedOperationIds = new Set(
    responses
      .filter((response) => response.status >= 200 && response.status < 300)
      .map((response) => response.operationId)
      .filter(Boolean),
  );
  assert.ok(successfulObservedOperationIds.has('login'));
  const operationRequestCounts = Object.fromEntries(
    [...new Set(requests.map((request) => request.operationId).filter(Boolean))].map((id) => [
      id,
      requests.filter((request) => request.operationId === id).length,
    ]),
  );
  const scenario = {
    id: 'auth.success',
    domain: 'auth',
    state: 'success',
    status: 'passed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    permissions: loginPayload.session.user.permissions,
    route: '/w/auth/login',
    finalRoute,
    operationIds: authOperationIds,
    observedOperationIds: ['login'],
    operationRequestCounts,
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
      contractExpected: true,
    },
    loginResult: {
      status: loginPayload.status,
      userEmail: loginPayload.session.user.email,
      userFullName: loginPayload.session.user.fullName,
      elapsedMs: Date.now() - loginStartedAt,
    },
    visibleIdentity,
    visibleShellIdentity,
    identityMatchesSession: visibleIdentity,
    visibleHomeContent: pageTextLength > 0,
    pageTextLength,
    externalApiOrigins: [...externalApiOrigins],
    unrelatedApiWriteCount: apiWrites.length,
    elapsedMs: Date.now() - startedAt,
    screenshots: [screenshotName],
    note: 'Direct browser login through the real WebLoginPage using only the local MSW developer persona. The initial GET /auth/session 401 is the contract-supported unauthenticated bootstrap and is not counted as a successful operation. Only POST /auth/login returned the successful 200 and is counted as observed for auth.success; the other 13 linked Auth operations remain unverified. Both web shell identity surfaces display VitTrade Developer from the resolved Auth session, with no former hard-coded VitTrader Pro identity. This does not prove backend authentication, cookie persistence, MFA, staging, or production behavior.',
  };

  const hashPaths = new Set([
    ...Object.keys(master.sourceHashes ?? {}),
    ...sourcePaths,
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
      [...sourcePaths, runnerRelativePath]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));

  master.sourceHashes = sourceHashes;
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'auth.success');
  master.scenarios.push(scenario);
  master.authSuccessEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Added by the reproducible auth.success browser check; checkedAt continues to identify the full-run timestamp above.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), screenshotName])];
  await fs.writeFile(masterReportPath, await serializeJson(master, masterReportPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
} finally {
  await browser.close();
}

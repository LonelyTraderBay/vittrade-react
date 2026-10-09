import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/dca-unauthorized-current-head-browser-check-${runId}.json`;
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-dca-unauthorized-current-head-browser-check.mjs';
const screenshotName = `preview-dca-unauthorized-current-head-${runId}.png`;
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/dca.yaml',
  'contracts/openapi/auth.yaml',
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/features/dca/api/dca-api.ts',
  'src/features/dca/model/dca-queries.ts',
  'src/features/dca/pages/DCAMainPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
];

const readFile = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(readFile(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

const reportPath = path.join(root, reportRelativePath);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const operationMap = JSON.parse(
  await fs.readFile(path.join(root, operationMapRelativePath), 'utf8'),
);
const dcaOperationIds = operationMap.operations
  .filter((operation) => operation.domain === 'dca')
  .map((operation) => operation.operationId);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();
const externalResourceOrigins = new Set();
const externalRequests = [];
const pageErrors = [];
const requestStartedAt = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let dcaSnapshotResponse = null;
let scenarioSelected = false;
let loginFormVisible = false;
let protectedContentVisible = null;
let finalRoute = null;
const failures = [];

page.on('request', (request) => {
  const url = new URL(request.url());
  const resourceType = request.resourceType();
  if (url.origin !== new URL(origin).origin) {
    externalRequests.push({
      origin: url.origin,
      path: url.pathname,
      method: request.method(),
      resourceType,
    });
    if (['image', 'font', 'stylesheet'].includes(resourceType))
      externalAssetOrigins.add(url.origin);
    else if (url.pathname.startsWith('/api/')) externalApiOrigins.add(url.origin);
    else externalResourceOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
  const operation = operationMap.operations.find(
    (item) => item.method === request.method() && url.pathname.endsWith(item.path),
  );
  requests.push({
    operationId: operation?.operationId ?? null,
    method: request.method(),
    path: url.pathname,
    resourceType,
  });
});

page.on('pageerror', (error) => pageErrors.push(error.message));

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const operation = operationMap.operations.find(
    (item) => item.method === response.request().method() && url.pathname.endsWith(item.path),
  );
  const started = requestStartedAt.get(response.request());
  const observed = {
    operationId: operation?.operationId ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(started === undefined ? {} : { elapsedMs: Date.now() - started }),
  };
  responses.push(observed);
});

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

  await page.getByTestId('auth-email').fill('dca@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('auth-submit').click();
  loginResponse = await loginPromise;
  const loginPayload = await loginResponse.json();
  await page.waitForURL('**/w/home');
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  assert.deepEqual(loginPayload.session?.user?.permissions, ['dca:read', 'dca:write']);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('dca');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('dca.unauthorized', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  const snapshotPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/dca/snapshot' &&
      response.request().method() === 'GET',
  );
  await page.getByLabel('Kịch bản màn hình').selectOption('dca');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  dcaSnapshotResponse = await snapshotPromise;
  assert.equal(dcaSnapshotResponse.status(), 401);
  assert.equal(dcaSnapshotResponse.fromServiceWorker(), true);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/, { timeout: 10_000 });
  await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
  finalRoute = new URL(page.url()).pathname;
  loginFormVisible = await page.getByTestId('auth-submit').isVisible();
  protectedContentVisible = await page
    .getByRole('heading', { name: 'Mua tự động (DCA)', exact: true })
    .isVisible()
    .catch(() => false);
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });
  assert.match(finalRoute, /\/(?:w\/)?auth\/login$/);
  assert.equal(loginFormVisible, true);
  assert.equal(protectedContentVisible, false);
  assert.equal(
    requests.some(
      (request) =>
        ['POST', 'PATCH', 'DELETE'].includes(request.method) && request.path.includes('/api/dca/'),
    ),
    false,
  );
  assert.equal(externalApiOrigins.size, 0);
  assert.deepEqual(pageErrors, []);
  assert.equal(
    responses.every((response) => response.fromServiceWorker),
    true,
  );
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  if (!fsSync.existsSync(path.join(evidenceDirectory, screenshotName))) {
    await page
      .screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true })
      .catch(() => {});
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenario = {
    id: 'dca.unauthorized',
    domain: 'dca',
    state: 'unauthorized',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'dca (local MSW fixture)',
    role: 'user',
    permissions: ['dca:read', 'dca:write'],
    route: '/w/dca',
    finalRoute,
    operationIds: dcaOperationIds,
    observedOperationIds: dcaSnapshotResponse?.status() === 401 ? ['getDCASnapshot'] : [],
    operationRequestCounts: Object.fromEntries(
      dcaOperationIds.map((id) => [
        id,
        requests.filter((request) => request.operationId === id).length,
      ]),
    ),
    requests,
    responses,
    initialSessionResponse: initialSessionResponse
      ? {
          status: initialSessionResponse.status(),
          fromServiceWorker: initialSessionResponse.fromServiceWorker(),
        }
      : null,
    loginResponse: loginResponse
      ? { status: loginResponse.status(), fromServiceWorker: loginResponse.fromServiceWorker() }
      : null,
    dcaSnapshotResponse: dcaSnapshotResponse
      ? {
          status: dcaSnapshotResponse.status(),
          fromServiceWorker: dcaSnapshotResponse.fromServiceWorker(),
        }
      : null,
    scenarioSelected,
    loginFormVisible,
    protectedContentVisible,
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    externalResourceOrigins: [...externalResourceOrigins],
    externalRequests,
    pageErrors,
    elapsedMs: Date.now() - startedAt,
    screenshots: fsSync.existsSync(path.join(evidenceDirectory, screenshotName))
      ? [screenshotName]
      : [],
    failures,
    knownContractLimitations: [
      'Only GET /dca/snapshot is used here; PATCH and DELETE do not declare 401.',
      'The shared local auth refresh handler returns 401 although the Auth OpenAPI refresh operation declares only 200/null; do not treat that refresh response as DCA contract evidence.',
      'At /w/dca, the shell heading still reads Dashboard and the sidebar highlights Trang chủ; resolve the active-navigation mapping before UI acceptance.',
    ],
    note: 'Only GET /dca/snapshot, which declares 401, is the DCA operation tested here. Redirect behavior is local MSW evidence; any Auth refresh response must be evaluated separately against contracts/openapi/auth.yaml. No backend permission enforcement, staging or production authorization is certified.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...sourcePaths, runnerRelativePath])]
      .sort()
      .map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  const sidecar = {
    schemaVersion: 1,
    checkedAt,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: responses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
    },
    sourceHashes: Object.fromEntries(
      [...new Set([...sourcePaths, runnerRelativePath])]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

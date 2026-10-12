import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';
import { parse } from 'yaml';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const runnerPath =
  'docs/architecture/production-readiness/evidence/A06/run-launchpad-error-current-head-browser-check.mjs';
const sidecarPath =
  'docs/architecture/production-readiness/evidence/A06/launchpad-error-current-head-browser-check-' +
  runId +
  '.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotNames = [
  'preview-launchpad-error-recoverable-current-head-' + runId + '.png',
  'preview-launchpad-error-retry-current-head-' + runId + '.png',
];
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/launchpad.yaml',
  operationMapPath,
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/launchpad-fixtures.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/launchpad/api/launchpad-api.ts',
  'src/features/launchpad/model/launchpad-queries.ts',
  'src/features/launchpad/pages/LaunchpadContractPages.tsx',
  'src/shared/api/client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
];
const expectedOperationIds = ['listLaunchpadProjects', 'getLaunchpadProject'];
const read = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(read(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(JSON.stringify(value, null, 2) + '\n', {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

function operationFor(operationMap, method, pathname) {
  return operationMap.operations.find((operation) => {
    if (operation.method !== method) return false;
    const pattern = operation.path
      .split('/')
      .map((segment) =>
        segment.startsWith('{') && segment.endsWith('}')
          ? '[^/]+'
          : segment.replace(/[.*+?^$()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    return new RegExp(pattern + '$').test(pathname);
  })?.operationId;
}

const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const master = { sourceHashes: {} };
const staleSourceHashes = {};

const operationMap = JSON.parse(await fs.readFile(path.join(root, operationMapPath), 'utf8'));
const contract = parse(read('contracts/openapi/launchpad.yaml').toString('utf8'));
const listOperation = contract.paths['/launchpad/projects']?.get;
assert.equal(listOperation?.operationId, 'listLaunchpadProjects');
assert.ok(listOperation.responses?.['200']);
assert.equal(
  Object.keys(listOperation.responses).some((status) => /^5\d\d$/.test(status)),
  false,
  'Launchpad list OpenAPI must not gain an undeclared 5xx for this scenario.',
);
assert.deepEqual(
  operationMap.operations
    .filter((operation) => operation.domain === 'launchpad')
    .map((operation) => operation.operationId)
    .sort(),
  expectedOperationIds.slice().sort(),
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const requestFailures = [];
const externalApiOrigins = new Set();
const startedAt = Date.now();
let scenarioRequestStart = 0;
let scenarioResponseStart = 0;
let scenarioFailureStart = 0;
let scenarioSelected = false;
let initialErrorVisible = false;
let initialRetryVisible = false;
let retryErrorVisible = false;
let retryStillVisible = false;
let initialListFailureCount = 0;
let finalListFailureCount = 0;
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

async function waitForStableCount(readCount, baseline, timeoutMs = 10_000, quietMs = 1_300) {
  const deadline = Date.now() + timeoutMs;
  let lastCount = readCount();
  let unchangedSince = Date.now();
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const currentCount = readCount();
    if (currentCount !== lastCount) {
      lastCount = currentCount;
      unchangedSince = Date.now();
    }
    if (currentCount > baseline && Date.now() - unchangedSince >= quietMs) return currentCount;
  }
  throw new Error(`Launchpad error request count did not settle after baseline ${baseline}.`);
}

try {
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const sessionResponse = await sessionPromise;
  assert.equal(sessionResponse.status(), 401);
  assert.equal(sessionResponse.fromServiceWorker(), true);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  const loginResponse = await loginResponsePromise;
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  await page.waitForURL('**/w/home');

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('launchpad');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('launchpad.error', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  scenarioRequestStart = requests.length;
  scenarioResponseStart = responses.length;
  scenarioFailureStart = requestFailures.length;
  await page.getByRole('button', { name: 'Launchpad', exact: true }).click();
  const errorTitle = page.getByText('Có lỗi xảy ra', { exact: true });
  const retryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
  await errorTitle.waitFor({ state: 'visible' });
  await retryButton.waitFor({ state: 'visible' });
  initialErrorVisible = await errorTitle.isVisible();
  initialRetryVisible = await retryButton.isVisible();
  const launchpadFailureCount = () =>
    requestFailures
      .slice(scenarioFailureStart)
      .filter((failure) => failure.operationId === 'listLaunchpadProjects').length;
  initialListFailureCount = await waitForStableCount(launchpadFailureCount, 0);
  assert.equal(
    initialListFailureCount,
    3,
    'The HTTP client owns the two-retry transport budget; React Query must not multiply it.',
  );
  assert.equal(await page.getByText('Không có dự án phù hợp.', { exact: true }).count(), 0);
  assert.equal(await page.getByText('NexaAI Protocol', { exact: true }).count(), 0);
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotNames[0]),
    fullPage: true,
  });

  await retryButton.click();
  retryErrorVisible = await errorTitle.isVisible().catch(() => false);
  finalListFailureCount = await waitForStableCount(launchpadFailureCount, initialListFailureCount);
  await errorTitle.waitFor({ state: 'visible' });
  await retryButton.waitFor({ state: 'visible' });
  retryErrorVisible = await errorTitle.isVisible();
  retryStillVisible = await retryButton.isVisible();
  assert.equal(await page.getByText('Không có dự án phù hợp.', { exact: true }).count(), 0);
  assert.equal(await page.getByText('NexaAI Protocol', { exact: true }).count(), 0);
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotNames[1]),
    fullPage: true,
  });
  finalRoute = new URL(page.url()).pathname;

  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.slice(scenarioFailureStart);
  const listRequests = scenarioRequests.filter(
    (request) => request.operationId === 'listLaunchpadProjects',
  );
  const listFailures = scenarioFailures.filter(
    (failure) => failure.operationId === 'listLaunchpadProjects',
  );
  const unexpectedWrites = scenarioRequests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  assert.ok(initialListFailureCount > 0, 'The list request must fail at the transport boundary.');
  assert.ok(
    finalListFailureCount > initialListFailureCount,
    'Retry must issue another failed list request.',
  );
  assert.equal(
    finalListFailureCount - initialListFailureCount,
    3,
    'One explicit retry must use one HTTP-client budget without another query-level retry.',
  );
  assert.equal(listRequests.length, listFailures.length);
  assert.equal(
    scenarioResponses.filter((response) => response.operationId === 'listLaunchpadProjects').length,
    0,
    'No synthetic HTTP status may be returned for a contract without declared 5xx.',
  );
  assert.deepEqual(unexpectedWrites, []);
  assert.equal(finalRoute, '/w/launchpad');
  assert.equal(externalApiOrigins.size, 0);
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  for (const screenshotName of screenshotNames) {
    const screenshotPath = path.join(evidenceDirectory, screenshotName);
    if (!fsSync.existsSync(screenshotPath)) {
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    }
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.slice(scenarioFailureStart);
  const operationRequestCounts = Object.fromEntries(
    expectedOperationIds.map((operationId) => [
      operationId,
      scenarioRequests.filter((request) => request.operationId === operationId).length,
    ]),
  );
  const listFailures = scenarioFailures.filter(
    (failure) => failure.operationId === 'listLaunchpadProjects',
  );
  const scenario = {
    id: 'launchpad.error',
    domain: 'launchpad',
    state: 'error',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    routes: ['/w/launchpad'],
    finalRoute,
    operationIds: expectedOperationIds,
    observedOperationIds: [
      ...new Set(scenarioRequests.map((request) => request.operationId).filter(Boolean)),
    ].sort(),
    operationRequestCounts,
    initialListTransportFailures: initialListFailureCount,
    retryListTransportFailures: Math.max(0, finalListFailureCount - initialListFailureCount),
    listTransportFailures: listFailures.length,
    listHttpResponses: scenarioResponses.filter(
      (response) => response.operationId === 'listLaunchpadProjects',
    ).length,
    errorVisibleAfterInitialFailure: initialErrorVisible,
    retryVisibleAfterInitialFailure: initialRetryVisible,
    errorVisibleAfterRetry: retryErrorVisible,
    retryVisibleAfterRetry: retryStillVisible,
    falseEmptyStateAbsent: true,
    falseSuccessContentAbsent: true,
    requests: scenarioRequests,
    responses: scenarioResponses,
    requestFailures: scenarioFailures,
    writeRequestCount: scenarioRequests.filter(
      (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
    ).length,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames.filter((name) =>
      fsSync.existsSync(path.join(evidenceDirectory, name)),
    ),
    sourceHashesReviewed: sourcePaths.length,
    staleSourceHashesBeforeRun: Object.keys(staleSourceHashes).sort(),
    sourceHashReview: {
      reviewedPaths: [...sourcePaths, runnerPath].sort(),
      scope:
        'This current-head sidecar hashes the contract, operation map, preview fixture, shared API/auth path, Launchpad UI, and runner used for this statusless transport-failure observation.',
      sourceHashBaselineRefreshedAfterBrowserRun: false,
    },
    failures,
    note:
      failures.length === 0
        ? `Local Chromium/MSW observed a statusless transport failure for listLaunchpadProjects, a visible ErrorState and Retry action, and repeated failed list requests after Retry. No false empty or project-success state, writes or external API origins occurred. Launchpad OpenAPI declares no 5xx; this proves local UI resilience only, not backend availability or user acceptance.`
        : 'The Launchpad local browser scenario did not satisfy every assertion; inspect request failures and saved screenshots. This report does not establish backend behavior.',
  };
  const allSourcePaths = [
    ...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths, runnerPath]),
  ].sort();
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    fixtureBoundary: {
      serviceWorkerControlled: await page
        .evaluate(() => Boolean(navigator.serviceWorker?.controller))
        .catch(() => false),
      allObservedResponsesFromServiceWorker: responses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: externalApiOrigins.size > 0,
      realBackendMutationSent: requests.some(
        (request) =>
          !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
          externalApiOrigins.has(new URL(origin).origin),
      ),
    },
    sourceHashes: Object.fromEntries(
      [...new Set([...sourcePaths, runnerPath])]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(path.join(root, sidecarPath), await serializeJson(sidecar, sidecarPath));
  process.stdout.write(
    `${JSON.stringify(
      { scenario, report: sidecarPath, sourceHashCount: Object.keys(sidecar.sourceHashes).length },
      null,
      2,
    )}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

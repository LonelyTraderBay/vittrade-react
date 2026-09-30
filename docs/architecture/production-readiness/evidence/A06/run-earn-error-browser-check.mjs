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
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-earn-error-browser-check.mjs';
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/earn-error-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotNames = [
  'preview-earn-error-snapshot-2026-09-29.png',
  'preview-earn-error-snapshot-retry-2026-09-29.png',
  'preview-earn-error-history-2026-09-29.png',
  'preview-earn-error-history-retry-2026-09-29.png',
];
const sourcePaths = [
  'contracts/openapi/earn.yaml',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/earn-fixtures.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/earn/api/earn-api.ts',
  'src/features/earn/components/EarnFeatureComponents.tsx',
  'src/features/earn/model/earn-queries.ts',
  'src/features/earn/model/earn-types.ts',
  'src/features/earn/pages/EarnPage.tsx',
  'src/features/earn/pages/EarnHistoryPage.tsx',
  'src/features/earn/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/ui/ErrorState.tsx',
];
const expectedOperationIds = [
  'getEarnSnapshot',
  'listEarnTransactions',
  'createEarnSubscription',
  'redeemEarnPosition',
];
const approvedStaleHashes = {
  'src/dev/mocks/preview-scenario-handler.test.ts':
    'ab07d1da5fcccf3488766e34082db5370f91ff410de93f36353b42e3026b7dc9',
  'src/dev/mocks/preview-scenario-handler.ts':
    '310abf70387ff528daf7f61b0d4103a3ed0449619549e1dcfefbfa39f0ca0f48',
};

const readFile = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(readFile(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

function operationFor(operationMap, method, pathname) {
  return operationMap.operations.find((operation) => {
    if (operation.method !== method) return false;
    const routePattern = operation.path
      .split('/')
      .map((segment) =>
        segment.startsWith('{') && segment.endsWith('}')
          ? '[^/]+'
          : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    return new RegExp(`${routePattern}$`).test(pathname);
  })?.operationId;
}

const masterPath = path.join(root, masterReportRelativePath);
const reportPath = path.join(root, reportRelativePath);
const master = JSON.parse(await fs.readFile(masterPath, 'utf8'));
const previousEarnError = (master.scenarios ?? []).find((scenario) => scenario.id === 'earn.error');
if (previousEarnError) {
  assert.equal(
    master.earnErrorEvidence?.report,
    reportRelativePath,
    'Existing earn.error evidence must point to this focused runner report before it is refreshed.',
  );
  const priorReport = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  assert.equal(priorReport.scenario?.id, 'earn.error');
}
const sourceHashDrift = Object.entries(master.sourceHashes ?? {})
  .filter(([relativePath]) => relativePath !== runnerRelativePath)
  .filter(([relativePath, expectedHash]) => sha256(relativePath) !== expectedHash)
  .map(([relativePath, expectedHash]) => ({ relativePath, expectedHash }));
const expectedSourceHashDrift = previousEarnError
  ? []
  : Object.entries(approvedStaleHashes).map(([relativePath, expectedHash]) => ({
      relativePath,
      expectedHash,
    }));
assert.deepEqual(
  sourceHashDrift,
  expectedSourceHashDrift,
  'Only the already-reviewed Earn error handler and its test may differ from the previous evidence baseline.',
);

const tracking = JSON.parse(
  await fs.readFile(
    path.join(root, 'docs/architecture/production-readiness/TRACKING.json'),
    'utf8',
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(
  sourceHead,
  tracking.baseline.sourceHead,
  'Earn evidence must match the A06 baseline.',
);
const operationMap = JSON.parse(
  await fs.readFile(path.join(root, operationMapRelativePath), 'utf8'),
);
const earnOperations = operationMap.operations.filter((operation) => operation.domain === 'earn');
assert.deepEqual(
  earnOperations.map((operation) => operation.operationId),
  expectedOperationIds,
  'Earn contract operation inventory has changed.',
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const requestFailures = [];
const externalApiOrigins = new Set();
const requestStartTimes = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let scenarioSelected = false;
let finalRoute = null;
const observations = {};
const failures = [];

function waitForFailureCount(operationId, minimumCount) {
  const countFailures = () =>
    requestFailures.filter((request) => request.operationId === operationId).length;
  if (countFailures() >= minimumCount) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      page.off('requestfailed', checkCount);
      reject(new Error(`Timed out waiting for ${minimumCount} ${operationId} transport failures.`));
    }, 10_000);
    const checkCount = () => {
      if (countFailures() < minimumCount) return;
      clearTimeout(timeout);
      page.off('requestfailed', checkCount);
      resolve();
    };
    page.on('requestfailed', checkCount);
    checkCount();
  });
}

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartTimes.set(request, Date.now());
  requests.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    resourceType: request.resourceType(),
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestFailures.push({
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown transport failure',
  });
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const requestStartedAt = requestStartTimes.get(response.request());
  responses.push({
    operationId: operationFor(operationMap, response.request().method(), url.pathname) ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(requestStartedAt === undefined ? {} : { elapsedMs: Date.now() - requestStartedAt }),
  });
});

async function inspectErrorAndRetry({
  operationId,
  path: apiPath,
  route,
  emptyLabel,
  screenshotStart,
}) {
  await page
    .getByLabel('Kịch bản màn hình')
    .selectOption(route === '/w/earn/savings/portfolio' ? 'earn' : 'earnHistory');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL(`**${route}`);
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page
    .getByText('Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.', { exact: true })
    .waitFor();
  assert.equal(await page.getByRole('button', { name: 'Thử lại' }).isVisible(), true);
  assert.equal(await page.getByText(emptyLabel, { exact: true }).count(), 0);

  const initialFailures = requestFailures.filter(
    (request) => request.operationId === operationId,
  ).length;
  assert.ok(initialFailures > 0, `${operationId} must fail at the browser transport boundary.`);
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotNames[screenshotStart]),
    fullPage: true,
  });

  const retryButton = page.getByRole('button', { name: 'Thử lại' });
  await retryButton.click();
  await waitForFailureCount(operationId, initialFailures + 1);
  await page
    .getByText('Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.', { exact: true })
    .waitFor();
  const retryFailures =
    requestFailures.filter((request) => request.operationId === operationId).length -
    initialFailures;
  assert.ok(retryFailures > 0, `${operationId} Retry must issue another transport attempt.`);
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotNames[screenshotStart + 1]),
    fullPage: true,
  });

  const operationRequests = requests.filter((request) => request.operationId === operationId);
  const operationFailures = requestFailures.filter(
    (request) => request.operationId === operationId,
  );
  const operationResponses = responses.filter((response) => response.operationId === operationId);
  assert.equal(operationRequests.length, operationFailures.length);
  assert.equal(
    operationResponses.length,
    0,
    `${operationId} must not synthesize an HTTP response.`,
  );
  assert.ok(operationRequests.every((request) => request.method === 'GET'));
  assert.equal(
    requests.some(
      (request) =>
        request.path.startsWith('/api/earn/') &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
    ),
    false,
    'Error/retry screen verification must not issue Earn mutations.',
  );

  observations[operationId] = {
    route,
    apiPath,
    initialTransportFailures: initialFailures,
    retryTransportFailures: retryFailures,
    totalGetRequests: operationRequests.length,
    httpResponses: operationResponses.length,
    errorStateVisible: true,
    retryVisibleAndExercised: true,
    emptyStateSuppressed: true,
    observedFailureKinds: [...new Set(operationFailures.map((failure) => failure.failure))],
  };
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
  initialSessionResponse = await sessionPromise;
  assert.equal(initialSessionResponse.status(), 401);
  assert.equal(initialSessionResponse.fromServiceWorker(), true);

  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('auth-submit').click();
  loginResponse = await loginPromise;
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  const loginPayload = await loginResponse.json();
  assert.ok(loginPayload.session?.user?.permissions.includes('earn:write'));
  await page.waitForURL('**/w/home');

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('earn');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('earn.error', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  await inspectErrorAndRetry({
    operationId: 'getEarnSnapshot',
    path: '/api/earn/snapshot',
    route: '/w/earn/savings/portfolio',
    emptyLabel: 'Chưa có vị thế tiết kiệm',
    screenshotStart: 0,
  });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await inspectErrorAndRetry({
    operationId: 'listEarnTransactions',
    path: '/api/earn/transactions',
    route: '/w/earn/savings/history',
    emptyLabel: 'Chưa có giao dịch tiết kiệm',
    screenshotStart: 2,
  });

  finalRoute = new URL(page.url()).pathname;
  assert.equal(externalApiOrigins.size, 0);
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  const missingScreenshots = screenshotNames.filter(
    (name) => !fsSync.existsSync(path.join(evidenceDirectory, name)),
  );
  for (const screenshotName of missingScreenshots) {
    await page
      .screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true })
      .catch(() => {});
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const observedOperationIds = Object.keys(observations).sort();
  const scenario = {
    id: 'earn.error',
    domain: 'earn',
    state: 'error',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    permissions: ['earn:write'],
    route: '/w/earn/savings/portfolio',
    routes: ['/w/earn/savings/portfolio', '/w/earn/savings/history'],
    finalRoute,
    operationIds: expectedOperationIds,
    observedOperationIds,
    operationRequestCounts: Object.fromEntries(
      expectedOperationIds.map((operationId) => [
        operationId,
        requests.filter((request) => request.operationId === operationId).length,
      ]),
    ),
    requests,
    responses,
    requestFailures,
    observations,
    initialSessionResponse: initialSessionResponse
      ? {
          status: initialSessionResponse.status(),
          fromServiceWorker: initialSessionResponse.fromServiceWorker(),
        }
      : null,
    loginResponse: loginResponse
      ? { status: loginResponse.status(), fromServiceWorker: loginResponse.fromServiceWorker() }
      : null,
    scenarioSelected,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames.filter((name) =>
      fsSync.existsSync(path.join(evidenceDirectory, name)),
    ),
    sourceHashReview: {
      reviewedPaths: Object.keys(approvedStaleHashes),
      priorHashes: approvedStaleHashes,
      scope:
        'The only runtime delta adds transport failure for Earn GET snapshot/transactions when earn.error is active. The test-only delta asserts that contract boundary and keeps subscription writes on their normal handlers. Existing passed scenarios contain no earn.error case and do not enter the new branch.',
      matrixBaselineRefreshedAfterFocusedTestAndBrowserReview: failures.length === 0,
    },
    failures,
    note:
      failures.length === 0
        ? 'Local Chromium/MSW observed transport failures for the two Earn GET reads at both mapped UI routes. ErrorState and Retry remained visible, empty success was suppressed, clicking Retry caused additional failed GET requests, no HTTP status was returned, no Earn mutation was sent and no external API origin was used. OpenAPI Earn declares no 5xx; this is local transport/UI resilience evidence only, not backend availability or user acceptance.'
        : 'The local Chromium Earn error scenario did not satisfy every assertion. Inspect request/response/failure traces and screenshots; this report does not establish a passing scenario or backend behavior.',
  };
  const allSourcePaths = [
    ...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths, runnerRelativePath]),
  ].sort();
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      [...new Set([...sourcePaths, runnerRelativePath])]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));

  master.sourceHashes = Object.fromEntries(
    allSourcePaths.map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  master.sourceHashReview = scenario.sourceHashReview;
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'earn.error');
  master.scenarios.push(scenario);
  master.earnErrorEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Transport failure only for the two Earn read operations on their mapped UI routes; the OpenAPI contract declares no 5xx and Earn mutations were not sent.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...scenario.screenshots])];
  master.checkedAt = scenario.observedAt;
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(master.sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

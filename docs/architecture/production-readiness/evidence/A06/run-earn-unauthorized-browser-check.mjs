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
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-earn-unauthorized-browser-check.mjs';
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/earn-unauthorized-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const reviewedStaleHashes = {
  'src/dev/mocks/preview-scenario-handler.test.ts':
    'a18e3b3ce8d872a9fa09def5cba6989c051747f82a20243901b8f1b4ea6836a8',
  'src/dev/mocks/preview-scenario-handler.ts':
    'cfec53d5fc1867ae4e78654198c2264845fa7de8be1da13cb9e7be9da59b001c',
};
const supersededScreenshotNames = [
  'preview-earn-unauthorized-snapshot-2026-09-29.png',
  'preview-earn-unauthorized-snapshot-retry-2026-09-29.png',
  'preview-earn-unauthorized-history-2026-09-29.png',
  'preview-earn-unauthorized-history-retry-2026-09-29.png',
];
const screenshotNames = [
  'preview-earn-unauthorized-snapshot-session-expired-2026-09-29.png',
  'preview-earn-unauthorized-history-session-expired-2026-09-29.png',
];
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/earn.yaml',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/earn-fixtures.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/earn/api/earn-api.ts',
  'src/features/earn/model/earn-queries.ts',
  'src/features/earn/pages/EarnHistoryPage.tsx',
  'src/features/earn/pages/EarnPage.tsx',
  'src/shared/api/client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/ui/ErrorState.tsx',
];
const expectedOperationIds = [
  'getEarnSnapshot',
  'listEarnTransactions',
  'createEarnSubscription',
  'redeemEarnPosition',
];
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
const previousScenario = (master.scenarios ?? []).find(
  (scenario) => scenario.id === 'earn.unauthorized',
);
if (previousScenario) {
  assert.equal(
    master.earnUnauthorizedEvidence?.report,
    reportRelativePath,
    'Existing Earn unauthorized evidence must point to this runner before refresh.',
  );
  assert.equal(JSON.parse(await fs.readFile(reportPath, 'utf8')).scenario?.id, 'earn.unauthorized');
}
const priorReport = previousScenario ? JSON.parse(await fs.readFile(reportPath, 'utf8')) : null;
const staleSourceHashes = Object.entries(master.sourceHashes ?? {}).filter(
  ([relativePath, expectedHash]) =>
    relativePath !== runnerRelativePath && sha256(relativePath) !== expectedHash,
);
const expectedStaleSourceHashes =
  previousScenario && !priorReport?.scenario?.sourceHashReview
    ? Object.entries(reviewedStaleHashes)
    : [];
assert.deepEqual(
  staleSourceHashes.map(([relativePath, expectedHash]) => [relativePath, expectedHash]),
  expectedStaleSourceHashes,
  'Existing browser evidence is stale; review source impact before continuing.',
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
const earnContract = parse(
  fsSync.readFileSync(path.join(root, 'contracts/openapi/earn.yaml'), 'utf8'),
);
const earnOperations = operationMap.operations.filter((operation) => operation.domain === 'earn');
assert.deepEqual(
  earnOperations.map((operation) => operation.operationId),
  expectedOperationIds,
  'Earn contract operation inventory has changed.',
);
const earnUnauthorizedOperations = earnOperations.filter((operation) =>
  Object.hasOwn(
    earnContract.paths?.[operation.path]?.[operation.method.toLowerCase()]?.responses ?? {},
    '401',
  ),
);
assert.equal(
  earnUnauthorizedOperations.length,
  expectedOperationIds.length,
  'Every Earn operation must declare 401 before it is included in this scenario.',
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const externalApiOrigins = new Set();
const requestStartTimes = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let scenarioSelected = false;
let finalRoute = null;
const observations = {};
const failures = [];

function waitForResponseCount(operationId, status, minimumCount) {
  const matchingCount = () =>
    responses.filter(
      (response) => response.operationId === operationId && response.status === status,
    ).length;
  if (matchingCount() >= minimumCount) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      page.off('response', checkCount);
      reject(
        new Error(`Timed out waiting for ${minimumCount} ${operationId} HTTP ${status} responses.`),
      );
    }, 10_000);
    const checkCount = (response) => {
      if (response.request().method() !== 'GET') return;
      if (matchingCount() < minimumCount) return;
      clearTimeout(timeout);
      page.off('response', checkCount);
      resolve();
    };
    page.on('response', checkCount);
    checkCount({ request: () => ({ method: () => 'GET' }) });
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

async function inspectUnauthorizedRoute({
  operationId,
  route,
  screen,
  emptyLabel,
  screenshotIndex,
}) {
  const previousEarn401Count = responses.filter(
    (response) => response.operationId === operationId && response.status === 401,
  ).length;
  const refreshResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/refresh' &&
      response.request().method() === 'POST',
  );
  await page.getByLabel('Kịch bản màn hình').selectOption(screen);
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL(`**${route}`);
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await waitForResponseCount(operationId, 401, previousEarn401Count + 1);
  const refreshResponse = await refreshResponsePromise;
  assert.equal(refreshResponse.status(), 200);
  assert.equal(refreshResponse.fromServiceWorker(), true);
  assert.equal(await refreshResponse.json(), null);
  await page.waitForURL((url) => url.pathname.endsWith('/auth/login'));
  await page.getByTestId('auth-email').waitFor();
  assert.equal(
    await page
      .getByText('Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.', { exact: true })
      .count(),
    0,
  );
  assert.equal(await page.getByText(emptyLabel, { exact: true }).count(), 0);

  const operation401Responses = responses.filter(
    (response) => response.operationId === operationId && response.status === 401,
  );
  const initial401Count = operation401Responses.length - previousEarn401Count;
  assert.ok(initial401Count > 0, `${operationId} must receive a contract-declared 401.`);
  assert.ok(operation401Responses.every((response) => response.fromServiceWorker));
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotNames[screenshotIndex]),
    fullPage: true,
  });

  const operationResponses = responses.filter((response) => response.operationId === operationId);
  const operationRequests = requests.filter((request) => request.operationId === operationId);
  assert.ok(operationResponses.every((response) => response.status === 401));
  assert.equal(operationResponses.length, operationRequests.length);
  assert.ok(operationRequests.every((request) => request.method === 'GET'));
  assert.equal(
    requests.some(
      (request) =>
        request.path.startsWith('/api/earn/') &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
    ),
    false,
    'The Earn unauthorized read scenario must not issue Earn mutations.',
  );

  observations[operationId] = {
    route,
    http401Responses: initial401Count,
    followUpSessionRefresh: {
      status: refreshResponse.status(),
      body: null,
      contractSupported: true,
    },
    totalGetRequests: operationRequests.length,
    allResponsesFromServiceWorker: operationResponses.every(
      (response) => response.fromServiceWorker,
    ),
    redirectedToAuthentication: true,
    authenticationFormVisibleAfterRedirect: true,
    protectedContentSuppressed: true,
    emptyStateSuppressed: true,
  };
}

async function loginToPreview() {
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('auth-submit').click();
  const response = await loginPromise;
  assert.equal(response.status(), 200);
  assert.equal(response.fromServiceWorker(), true);
  assert.ok((await response.json()).session?.user?.permissions.includes('earn:write'));
  await page.waitForURL('**/w/home');
  return response;
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

  loginResponse = await loginToPreview();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('earn');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('earn.unauthorized', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  await inspectUnauthorizedRoute({
    operationId: 'getEarnSnapshot',
    route: '/w/earn/savings/portfolio',
    screen: 'earn',
    emptyLabel: 'Chưa có vị thế tiết kiệm',
    screenshotIndex: 0,
  });
  loginResponse = await loginToPreview();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await inspectUnauthorizedRoute({
    operationId: 'listEarnTransactions',
    route: '/w/earn/savings/history',
    screen: 'earnHistory',
    emptyLabel: 'Chưa có giao dịch tiết kiệm',
    screenshotIndex: 1,
  });

  finalRoute = new URL(page.url()).pathname;
  assert.equal(externalApiOrigins.size, 0);
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  for (const screenshotName of screenshotNames) {
    if (fsSync.existsSync(path.join(evidenceDirectory, screenshotName))) continue;
    await page
      .screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true })
      .catch(() => {});
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const observedOperationIds = Object.keys(observations).sort();
  const scenario = {
    id: 'earn.unauthorized',
    domain: 'earn',
    state: 'unauthorized',
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
    staleSourceHashesBeforeRun: staleSourceHashes.map(([relativePath]) => relativePath),
    failures,
    note:
      failures.length === 0
        ? 'Chromium/MSW observed contract-declared Earn HTTP 401 responses on snapshot and transaction-history reads. Each 401 triggered the shared auth refresh path; local MSW returned the contract-supported 200/null session result and the app redirected to the authentication form, with no protected Earn content shown. No Earn mutation or external API call occurred. Earn OpenAPI also declares 401 for subscription/redemption, but those POST operations were not exercised; the scenario therefore remains representative (2/4). This local result does not certify backend authorization or session behavior.'
        : 'The local Chromium Earn unauthorized scenario did not satisfy every assertion. Inspect response traces and screenshots; the report is not a passing scenario and does not certify backend authorization.',
  };
  scenario.sourceHashReview = {
    reviewedPaths: Object.keys(reviewedStaleHashes),
    priorHashes: reviewedStaleHashes,
    scope:
      'The handler-only delta changes Earn unauthorized auth-refresh simulation from undeclared HTTP 401 to contract-supported HTTP 200/null. The test addition locks that response contract. Earn success/loading/error behavior and all non-Earn unauthorized branches are unchanged.',
    matrixBaselineRefreshedAfterFocusedTestAndBrowserReview: failures.length === 0,
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
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'earn.unauthorized');
  master.scenarios.push(scenario);
  master.earnUnauthorizedEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Contract-supported HTTP 401 observed on Earn snapshot and history GET routes only; mutations were not sent.',
  };
  master.screenshots = [
    ...new Set([
      ...(master.screenshots ?? []).filter((name) => !supersededScreenshotNames.includes(name)),
      ...scenario.screenshots,
    ]),
  ];
  master.checkedAt = scenario.observedAt;
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(master.sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

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
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/dca-empty-browser-check-2026-09-29.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-dca-empty-browser-check.mjs';
const screenshotName = 'preview-dca-empty-2026-09-29.png';
const sourcePaths = [
  'contracts/openapi/dca.yaml',
  'src/app/pages/dca/DCAPage.tsx',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/dca-fixtures.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/dca/api/dca-api.ts',
  'src/features/dca/model/dca-queries.ts',
  'src/features/dca/pages/DCAMainPage.tsx',
  'src/features/dca/components/DCACreatePlanSheet.tsx',
];

const readFile = (relativePath) => fsSync.readFileSync(path.join(root, relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(readFile(relativePath)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

const masterPath = path.join(root, masterReportRelativePath);
const reportPath = path.join(root, reportRelativePath);
const master = JSON.parse(await fs.readFile(masterPath, 'utf8'));
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
    path.join(root, 'docs/architecture/production-readiness/TRACKING.json'),
    'utf8',
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(
  sourceHead,
  tracking.baseline.sourceHead,
  'DCA evidence must match the A06 baseline HEAD.',
);
const operationMap = JSON.parse(
  await fs.readFile(path.join(root, operationMapRelativePath), 'utf8'),
);
const dcaOperationIds = operationMap.operations
  .filter((operation) => operation.domain === 'dca')
  .map((operation) => operation.operationId);
assert.deepEqual(dcaOperationIds, [
  'getDCAAdvancedOverview',
  'getDCASnapshot',
  'createDCAPlan',
  'updateDCAPlan',
  'deleteDCAPlan',
]);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();
const requestStartedAt = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let snapshot = null;
let scenarioSelected = false;
let emptyStateVisible = false;
let createActionOpened = false;
let pauseFeedbackVisible = false;
let finalRoute = null;
const failures = [];

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
  const operation = operationMap.operations.find(
    (item) => item.method === request.method() && url.pathname.endsWith(item.path),
  );
  requests.push({
    operationId: operation?.operationId ?? null,
    method: request.method(),
    path: url.pathname,
    resourceType: request.resourceType(),
  });
  if (url.origin !== new URL(origin).origin) {
    if (request.resourceType() === 'image') externalAssetOrigins.add(url.origin);
    else externalApiOrigins.add(url.origin);
  }
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const operation = operationMap.operations.find(
    (item) => item.method === response.request().method() && url.pathname.endsWith(item.path),
  );
  const started = requestStartedAt.get(response.request());
  responses.push({
    operationId: operation?.operationId ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(started === undefined ? {} : { elapsedMs: Date.now() - started }),
  });
});

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
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('dca.empty', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  const snapshotPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/dca/snapshot' &&
      response.request().method() === 'GET',
  );
  await page.getByLabel('Kịch bản màn hình').selectOption('dca');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  const snapshotResponse = await snapshotPromise;
  assert.equal(snapshotResponse.status(), 200);
  assert.equal(snapshotResponse.fromServiceWorker(), true);
  snapshot = await snapshotResponse.json();
  assert.deepEqual(snapshot.plans, []);
  assert.deepEqual(snapshot.purchaseHistory, []);
  assert.deepEqual(snapshot.overview, {
    currentValue: 0,
    totalInvested: 0,
    profitLoss: 0,
    profitLossPercent: 0,
    activePlans: 0,
    pausedPlans: 0,
    errorPlans: 0,
    nextExecution: null,
  });
  assert.equal(snapshot.portfolioHistory.length > 0, true);
  assert.equal(
    snapshot.portfolioHistory.every(
      (point) => point.portfolioValue === 0 && point.totalInvested === 0 && !point.hasPurchase,
    ),
    true,
  );

  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.getByRole('heading', { name: 'Chưa có kế hoạch DCA' }).waitFor();
  await page
    .getByText('Tạo kế hoạch đầu tiên để bắt đầu đầu tư tự động', { exact: true })
    .waitFor();
  const createButton = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
  await createButton.waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByText('Không có kế hoạch nào đang chạy', { exact: true }).waitFor();
  pauseFeedbackVisible = true;
  emptyStateVisible = true;
  await page.getByRole('heading', { name: 'Chưa có kế hoạch DCA' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });
  await createButton.click();
  await page.getByText('Tạo Kế Hoạch DCA Mới', { exact: true }).waitFor();
  createActionOpened = true;
  assert.equal(requests.filter((request) => request.operationId === 'createDCAPlan').length, 0);
  finalRoute = new URL(page.url()).pathname;
  assert.equal(externalApiOrigins.size, 0);
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
    id: 'dca.empty',
    domain: 'dca',
    state: 'empty',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'dca (local MSW fixture)',
    role: 'user',
    permissions: ['dca:read', 'dca:write'],
    route: '/w/dca',
    finalRoute,
    operationIds: dcaOperationIds,
    observedOperationIds: [
      ...new Set(
        responses
          .filter(
            (response) => response.operationId === 'getDCASnapshot' && response.status === 200,
          )
          .map((response) => response.operationId),
      ),
    ],
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
    scenarioSelected,
    emptyStateVisible,
    createActionOpened,
    pauseFeedbackVisible,
    snapshot: snapshot
      ? {
          status: 200,
          plans: snapshot.plans.length,
          purchaseHistory: snapshot.purchaseHistory.length,
          portfolioHistoryPoints: snapshot.portfolioHistory.length,
          overview: snapshot.overview,
          allPortfolioPointsZeroAndNoPurchase: snapshot.portfolioHistory.every(
            (point) =>
              point.portfolioValue === 0 && point.totalInvested === 0 && !point.hasPurchase,
          ),
        }
      : null,
    mutationRequests: requests.filter((request) =>
      ['createDCAPlan', 'updateDCAPlan', 'deleteDCAPlan'].includes(request.operationId),
    ),
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: fsSync.existsSync(path.join(evidenceDirectory, screenshotName))
      ? [screenshotName]
      : [],
    failures,
    knownUiFindings: [
      'At /w/dca, the shell heading still reads Dashboard and the sidebar highlights Trang chủ; resolve the active-navigation mapping before UI acceptance.',
    ],
    note: 'Chromium verified the local MSW GET snapshot empty state and the create-plan CTA. Only getDCASnapshot was observed (1/5 DCA operations); no mutation was submitted. This does not verify backend persistence, scheduling, authorization, staging, production, or user acceptance.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths, runnerRelativePath])]
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
      [...new Set([...sourcePaths, runnerRelativePath])]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));
  master.sourceHashes = sourceHashes;
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'dca.empty');
  master.scenarios.push(scenario);
  master.dcaEmptyEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'One operation (getDCASnapshot) observed through local MSW; the five-operation DCA domain is not fully covered by this empty scenario.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...scenario.screenshots])];
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

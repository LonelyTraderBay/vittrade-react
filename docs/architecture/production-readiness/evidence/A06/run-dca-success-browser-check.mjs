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
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/dca-success-browser-check-2026-09-29.json';
const masterReportRelativePath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapRelativePath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-dca-success-browser-check.mjs';
const screenshotNames = [
  'preview-dca-success-plans-2026-09-29.png',
  'preview-dca-success-plan-created-2026-09-29.png',
  'preview-dca-success-plan-paused-2026-09-29.png',
  'preview-dca-success-backend-required-2026-09-29.png',
];
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
  'src/features/dca/pages/DCAAdvancedPreviewPage.tsx',
  'src/features/dca/pages/DCAMainPage.tsx',
  'src/features/dca/components/DCACreatePlanSheet.tsx',
  'src/features/dca/components/DCAPlanCard.tsx',
  operationMapRelativePath,
];

function readFile(relativePath) {
  return fsSync.readFileSync(path.join(root, relativePath));
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
const expectedOperationIds = [
  'getDCAAdvancedOverview',
  'getDCASnapshot',
  'createDCAPlan',
  'updateDCAPlan',
  'deleteDCAPlan',
];
assert.deepEqual(dcaOperationIds, expectedOperationIds, 'DCA contract inventory has changed.');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();
const requestStartTimes = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let scenarioSelected = false;
let finalRoute = null;
let createdPlanId = null;
let pauseKeyPresent = false;
let createKeyPresent = false;
let deleteKeyPresent = false;
const failures = [];

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartTimes.set(request, Date.now());
  const operationId = operationFor(operationMap, request.method(), url.pathname) ?? null;
  requests.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    resourceType: request.resourceType(),
    idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
    observedAtMs: Date.now(),
  });
  if (url.origin !== new URL(origin).origin) {
    if (request.resourceType() === 'image') externalAssetOrigins.add(url.origin);
    else externalApiOrigins.add(url.origin);
  }
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
    observedAtMs: Date.now(),
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('dca.success', { exact: true })
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
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.getByText('Bitcoin', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[0]), fullPage: true });

  await page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true }).click();
  await page.getByRole('heading', { name: 'Tạo Kế Hoạch DCA Mới' }).waitFor();
  await page.getByRole('button', { name: /Cardano\s+ADA/ }).click();
  await page.getByRole('button', { name: '250.000', exact: true }).click();
  const createPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/dca/plans' &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Tạo Kế Hoạch', exact: true }).click();
  const createResponse = await createPromise;
  const createdPlan = await createResponse.json();
  createdPlanId = createdPlan.id;
  assert.equal(createResponse.status(), 201);
  assert.equal(createResponse.fromServiceWorker(), true);
  assert.match(createdPlanId, /^dev-plan-/);
  createKeyPresent = Boolean(
    requests.find((request) => request.operationId === 'createDCAPlan')?.idempotencyKeyPresent,
  );
  assert.equal(createKeyPresent, true, 'Create must carry the required Idempotency-Key header.');
  await page.getByRole('heading', { name: 'Tạo Kế Hoạch DCA Mới' }).waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Kế hoạch (4)', exact: true }).waitFor();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[1]), fullPage: true });

  const pausePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      new URL(response.url()).pathname === `/api/dca/plans/${createdPlanId}`,
  );
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).last().click();
  const pauseResponse = await pausePromise;
  const pausedPlan = await pauseResponse.json();
  assert.equal(pauseResponse.status(), 200);
  assert.equal(pauseResponse.fromServiceWorker(), true);
  assert.equal(pausedPlan.status, 'paused');
  pauseKeyPresent = Boolean(
    requests.filter((request) => request.operationId === 'updateDCAPlan').at(-1)
      ?.idempotencyKeyPresent,
  );
  assert.equal(pauseKeyPresent, true, 'Update must carry the required Idempotency-Key header.');
  await page.getByRole('button', { name: 'Kích hoạt', exact: true }).last().waitFor();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[2]), fullPage: true });

  const deleteCardButton = page.getByRole('button', { name: 'Xóa kế hoạch', exact: true }).last();
  await deleteCardButton.click();
  await page.getByRole('heading', { name: 'Xác nhận xóa' }).waitFor();
  const deletePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'DELETE' &&
      new URL(response.url()).pathname === `/api/dca/plans/${createdPlanId}`,
  );
  const deleteSnapshotPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/dca/snapshot' &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  const deleteResponse = await deletePromise;
  const deleteSnapshotResponse = await deleteSnapshotPromise;
  assert.equal(deleteResponse.status(), 204);
  assert.equal(deleteResponse.fromServiceWorker(), true);
  assert.equal(deleteSnapshotResponse.status(), 200);
  const deleteSnapshot = await deleteSnapshotResponse.json();
  assert.equal(
    deleteSnapshot.plans.some((plan) => plan.id === createdPlanId),
    false,
    'Deleted plan must be absent from the refreshed DCA snapshot.',
  );
  deleteKeyPresent = Boolean(
    requests.filter((request) => request.operationId === 'deleteDCAPlan').at(-1)
      ?.idempotencyKeyPresent,
  );
  assert.equal(deleteKeyPresent, true, 'Delete must carry the required Idempotency-Key header.');
  await page.getByRole('button', { name: 'Kế hoạch (3)', exact: true }).waitFor();

  const advancedOverviewPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/dca/advanced/overview' &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: /Auto-Rebalance/ }).click();
  const advancedOverviewResponse = await advancedOverviewPromise;
  assert.equal(advancedOverviewResponse.status(), 200);
  assert.equal(advancedOverviewResponse.fromServiceWorker(), true);
  await page.getByRole('status', { name: 'Backend integration required' }).waitFor();
  await page.getByText('Chưa kết nối backend', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[3]), fullPage: true });

  finalRoute = new URL(page.url()).pathname;
  const observedOperationIds = [
    ...new Set(
      responses
        .filter(
          (response) =>
            expectedOperationIds.includes(response.operationId) &&
            response.status >= 200 &&
            response.status < 300,
        )
        .map((response) => response.operationId),
    ),
  ].sort();
  assert.deepEqual([...observedOperationIds].sort(), [...expectedOperationIds].sort());
  assert.equal(externalApiOrigins.size, 0);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  for (const screenshotName of screenshotNames) {
    const screenshotPath = path.join(evidenceDirectory, screenshotName);
    if (!fsSync.existsSync(screenshotPath)) {
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      break;
    }
  }
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenario = {
    id: 'dca.success',
    domain: 'dca',
    state: 'success',
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
            (response) =>
              dcaOperationIds.includes(response.operationId) &&
              response.status >= 200 &&
              response.status < 300,
          )
          .map((response) => response.operationId),
      ),
    ].sort(),
    operationRequestCounts: Object.fromEntries(
      dcaOperationIds.map((id) => [
        id,
        requests.filter((request) => request.operationId === id).length,
      ]),
    ),
    requests: requests.map(({ observedAtMs, ...request }) => request),
    responses: responses.map(({ observedAtMs, ...response }) => response),
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
    createdPlanId,
    idempotencyKeyPresent: {
      create: createKeyPresent,
      update: pauseKeyPresent,
      delete: deleteKeyPresent,
    },
    contractResponses: {
      getDCAAdvancedOverview: advancedOverviewResponseStatus(responses),
      getDCASnapshot: snapshotResponseStatus(responses),
      createDCAPlan: responseStatusFor(responses, 'POST', '/api/dca/plans'),
      updateDCAPlan: responseStatusFor(responses, 'PATCH', `/api/dca/plans/${createdPlanId}`),
      deleteDCAPlan: responseStatusFor(responses, 'DELETE', `/api/dca/plans/${createdPlanId}`),
    },
    backendRequiredNoticeVisible: await page
      .getByRole('status', { name: 'Backend integration required' })
      .isVisible()
      .catch(() => false),
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames.filter((name) =>
      fsSync.existsSync(path.join(evidenceDirectory, name)),
    ),
    failures,
    note: 'Chromium exercised all five DCA contract operations through the local MSW service worker: snapshot and advanced overview GET, plan create 201, update 200, and delete 204. A dedicated least-privilege DCA preview persona displayed the controls. The new plan was created, persisted across refetch, paused, and deleted from the in-memory development fixture. Required Idempotency-Key headers were observed, but server replay semantics were not tested or inferred. Advanced DCA correctly displays that backend integration is still required. No real investment or backend/staging request was made; this is local preview evidence, not user acceptance or production certification.',
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
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'dca.success');
  master.scenarios.push(scenario);
  master.dcaSuccessEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Focused local browser check of all five DCA success operations. Idempotency replay, persistence beyond the MSW in-memory lifetime, backend authorization, and staging remain unverified.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...scenario.screenshots])];
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

function responseStatusFor(observedResponses, method, pathname) {
  return observedResponses
    .filter((response) => response.method === method && response.path === pathname)
    .map(({ status, fromServiceWorker }) => ({ status, fromServiceWorker }));
}

function advancedOverviewResponseStatus(observedResponses) {
  return responseStatusFor(observedResponses, 'GET', '/api/dca/advanced/overview');
}

function snapshotResponseStatus(observedResponses) {
  return responseStatusFor(observedResponses, 'GET', '/api/dca/snapshot');
}

if (failures.length > 0) process.exitCode = 1;

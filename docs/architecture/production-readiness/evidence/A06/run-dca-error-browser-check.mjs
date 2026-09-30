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
  'docs/architecture/production-readiness/evidence/A06/dca-error-browser-check-2026-09-29.json';
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-dca-error-browser-check.mjs';
const screenshotName = 'preview-dca-error-2026-09-29.png';
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
  'src/shared/api/http-client.ts',
  'src/shared/ui/ErrorState.tsx',
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
const requestFailures = [];
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();
const requestStartedAt = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null;
let loginResponse = null;
let scenarioSelected = false;
let errorStateVisible = false;
let retryVerified = false;
let initialDcaSnapshotFailureCount = 0;
let retryDcaSnapshotFailureCount = 0;
let finalRoute = null;
const failures = [];

function waitForDcaSnapshotFailureCount(minimumCount) {
  if (
    requestFailures.filter((request) => request.operationId === 'getDCASnapshot').length >=
    minimumCount
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      page.off('requestfailed', checkCount);
      reject(new Error(`Timed out waiting for ${minimumCount} DCA snapshot transport failures.`));
    }, 10_000);
    const checkCount = () => {
      const count = requestFailures.filter(
        (request) => request.operationId === 'getDCASnapshot',
      ).length;
      if (count < minimumCount) return;
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
  requestStartedAt.set(request, Date.now());
  const operation = operationMap.operations.find(
    (item) => item.method === request.method() && url.pathname.endsWith(item.path),
  );
  requests.push({
    operationId: operation?.operationId ?? null,
    method: request.method(),
    path: url.pathname,
  });
  if (url.origin !== new URL(origin).origin) {
    if (request.resourceType() === 'image') externalAssetOrigins.add(url.origin);
    else externalApiOrigins.add(url.origin);
  }
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const operation = operationMap.operations.find(
    (item) => item.method === request.method() && url.pathname.endsWith(item.path),
  );
  requestFailures.push({
    operationId: operation?.operationId ?? null,
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown transport failure',
  });
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('dca.error', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  await page.getByLabel('Kịch bản màn hình').selectOption('dca');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page
    .getByText('Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.', { exact: true })
    .waitFor();
  errorStateVisible = true;
  assert.equal(await page.getByRole('heading', { name: 'Chưa có kế hoạch DCA' }).count(), 0);
  initialDcaSnapshotFailureCount = requestFailures.filter(
    (request) => request.operationId === 'getDCASnapshot',
  ).length;
  assert.ok(
    initialDcaSnapshotFailureCount > 0,
    'The DCA snapshot must fail at the transport boundary.',
  );
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });

  await page.getByRole('button', { name: 'Thử lại' }).click();
  await waitForDcaSnapshotFailureCount(initialDcaSnapshotFailureCount + 1);
  const totalAttemptCount = requestFailures.filter(
    (request) => request.operationId === 'getDCASnapshot',
  ).length;
  retryDcaSnapshotFailureCount = totalAttemptCount - initialDcaSnapshotFailureCount;
  retryVerified = retryDcaSnapshotFailureCount > 0;
  assert.equal(retryVerified, true);
  assert.equal(
    responses.some((response) => response.path === '/api/dca/snapshot'),
    false,
  );
  assert.equal(
    requests.some(
      (request) =>
        ['POST', 'PATCH', 'DELETE'].includes(request.method) && request.path.includes('/api/dca/'),
    ),
    false,
  );
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
  const dcaSnapshotFailures = requestFailures.filter(
    (request) => request.operationId === 'getDCASnapshot',
  );
  const scenario = {
    id: 'dca.error',
    domain: 'dca',
    state: 'error',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'dca (local MSW fixture)',
    role: 'user',
    permissions: ['dca:read', 'dca:write'],
    route: '/w/dca',
    finalRoute,
    operationIds: dcaOperationIds,
    observedOperationIds: dcaSnapshotFailures.length ? ['getDCASnapshot'] : [],
    operationRequestCounts: Object.fromEntries(
      dcaOperationIds.map((id) => [
        id,
        requests.filter((request) => request.operationId === id).length,
      ]),
    ),
    requests,
    responses,
    requestFailures,
    dcaSnapshotTransportFailureCount: dcaSnapshotFailures.length,
    initialDcaSnapshotFailureCount,
    retryDcaSnapshotFailureCount,
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
    errorStateVisible,
    retryVerified,
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
    note: 'DCA OpenAPI declares no 5xx response. Chromium observed local service-worker transport failures for GET snapshot, visible ErrorState and Retry, without an HTTP status or DCA write. This is local UI resilience evidence, not a backend outage or availability result.',
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
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'dca.error');
  master.scenarios.push(scenario);
  master.dcaErrorEvidence = {
    report: reportRelativePath,
    observedAt: scenario.observedAt,
    note: 'Only getDCASnapshot was observed through a transport failure; DCA OpenAPI declares no 5xx and other DCA operations remain outside this scenario.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...scenario.screenshots])];
  await fs.writeFile(masterPath, await serializeJson(master, masterPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

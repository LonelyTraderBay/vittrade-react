import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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
const runId = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const runnerPath =
  'docs/architecture/production-readiness/evidence/A06/run-market-empty-current-head-browser-check.mjs';
const sidecarPath = `docs/architecture/production-readiness/evidence/A06/market-empty-current-head-browser-check-${runId}.json`;
const screenshotName = `preview-market-empty-current-head-${runId}.png`;
const masterPath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const sourcePaths = [
  'contracts/openapi/market.yaml',
  'src/app/routes.ts',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/market/api/market-api.ts',
  'src/features/market/api/market-research-schemas.ts',
  'src/features/market/model/market-queries.ts',
  'src/features/market/model/market-types.ts',
  'src/features/market/pages/MarketScreenerPage.tsx',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
];
const expectedOperationIds = ['listMarketPairs'];
const read = (relativePath) => fs.readFile(path.join(root, relativePath));
const sha256 = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await read(relativePath))
    .digest('hex');
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

const tracking = JSON.parse(
  (await read('docs/architecture/production-readiness/TRACKING.json')).toString('utf8'),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(
  sourceHead,
  (process.env.EVIDENCE_SOURCE_HEAD ?? tracking.executionPlan.auditSourceHead),
  'Evidence must match the audited Git HEAD.',
);

const operationMap = JSON.parse((await read(operationMapPath)).toString('utf8'));
const contract = parse((await read('contracts/openapi/market.yaml')).toString('utf8'));
const listOperation = Object.values(contract.paths)
  .flatMap((pathItem) =>
    Object.entries(pathItem)
      .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
      .map(([method, operation]) => ({ method: method.toUpperCase(), ...operation })),
  )
  .find((operation) => operation.operationId === 'listMarketPairs');
assert.equal(listOperation?.method, 'GET');
assert.ok(
  listOperation?.responses?.['200'],
  'The empty collection must use the declared 200 response.',
);
assert.deepEqual(
  operationMap.operations
    .filter(
      (operation) => operation.domain === 'market' && operation.operationId === 'listMarketPairs',
    )
    .map((operation) => operation.path),
  ['/market/pairs'],
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const requestFailures = [];
const pageErrors = [];
const externalApiOrigins = new Set();
const apiRequestSequence = new WeakMap();
const requestStartedAt = new WeakMap();
let nextApiRequestSequence = 0;
let scenarioRequestStart = 0;
let scenarioResponseStart = 0;
let scenarioFailureStart = 0;
let scenarioSelected = false;
let listResponseBody = null;
let finalRoute = null;
let emptyStateVisible = false;
let assetCountText = null;
const failures = [];
const startedAt = Date.now();

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const sequence = ++nextApiRequestSequence;
  apiRequestSequence.set(request, sequence);
  requestStartedAt.set(request, Date.now());
  requests.push({
    sequence,
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    routeAtRequest: new URL(page.url()).pathname,
  });
  if (url.origin !== new URL(origin).origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const request = response.request();
  responses.push({
    sequence: apiRequestSequence.get(request),
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    elapsedMs: Date.now() - (requestStartedAt.get(request) ?? Date.now()),
  });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestFailures.push({
    sequence: apiRequestSequence.get(request),
    operationId: operationFor(operationMap, request.method(), url.pathname) ?? null,
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown request failure',
  });
});

async function login() {
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('auth-submit').click();
  const response = await responsePromise;
  assert.equal(response.status(), 200);
  assert.equal(response.fromServiceWorker(), true);
  await page.waitForURL('**/w/home');
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
  await login();

  await page.evaluate(() => {
    window.history.pushState(
      { usr: null, key: 'market-empty-screener', idx: 1 },
      '',
      '/w/markets/screener',
    );
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  });
  await page.waitForFunction(() => window.location.pathname === '/w/markets/screener');
  await page.getByText('Market screener', { exact: true }).waitFor({ state: 'visible' });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('market');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  const emptyResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/market/pairs' &&
      response.request().method() === 'GET',
  );
  scenarioRequestStart = requests.length;
  scenarioResponseStart = responses.length;
  scenarioFailureStart = requestFailures.length;
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page
    .getByTestId('active-preview-scenario')
    .getByText('market.empty', { exact: true })
    .waitFor();
  scenarioSelected = true;

  const emptyResponse = await emptyResponsePromise;
  assert.equal(emptyResponse.status(), 200);
  assert.equal(emptyResponse.fromServiceWorker(), true);
  listResponseBody = await emptyResponse.json();
  assert.deepEqual(listResponseBody, { items: [] });
  await page.getByText('Không có tài sản phù hợp.', { exact: true }).waitFor({ state: 'visible' });
  assetCountText = await page.getByText('0 tài sản', { exact: true }).innerText();
  emptyStateVisible = true;
  assert.equal(await page.getByText('BTC/USDT', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotName),
    fullPage: true,
  });
  finalRoute = new URL(page.url()).pathname;

  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.slice(scenarioFailureStart);
  const observedOperationIds = [
    ...new Set(scenarioRequests.map((request) => request.operationId).filter(Boolean)),
  ].sort();
  assert.deepEqual(observedOperationIds, expectedOperationIds);
  assert.equal(
    scenarioRequests.length,
    1,
    'The screener empty state should issue only its list read.',
  );
  assert.equal(scenarioFailures.length, 0);
  assert.deepEqual(externalApiOrigins, new Set());
  assert.ok(scenarioResponses.length >= 1);
  assert.ok(
    scenarioResponses.every((response) => response.status === 200 && response.fromServiceWorker),
  );
  assert.deepEqual(pageErrors, []);
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  await page
    .screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true })
    .catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.slice(scenarioFailureStart);
  const observedAt = new Date().toISOString();
  const scenario = {
    id: 'market.empty',
    domain: 'market',
    state: 'empty',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt,
    persona: 'developer (local MSW fixture)',
    role: 'user',
    routes: finalRoute ? [finalRoute] : [],
    operationIds: expectedOperationIds,
    observedOperationIds: [
      ...new Set(scenarioRequests.map((request) => request.operationId).filter(Boolean)),
    ].sort(),
    operationRequestCounts: Object.fromEntries(
      expectedOperationIds.map((operationId) => [
        operationId,
        scenarioRequests.filter((request) => request.operationId === operationId).length,
      ]),
    ),
    requests: scenarioRequests,
    responses: scenarioResponses,
    requestFailures: scenarioFailures,
    responseBody: listResponseBody,
    assetCountText,
    emptyStateVisible,
    scenarioSelected,
    externalApiOrigins: [...externalApiOrigins],
    pageErrors,
    elapsedMs: Date.now() - startedAt,
    screenshots: await fs
      .access(path.join(evidenceDirectory, screenshotName))
      .then(() => [screenshotName])
      .catch(() => []),
    sourceHashesReviewed: sourcePaths.length + 1,
    note:
      failures.length === 0
        ? 'Current-head local Chromium observed one contract-valid listMarketPairs HTTP 200 response with {items: []}; the screener rendered 0 assets and its empty-state message. The response came from the local MSW service worker, with no external API origin, write, or backend request. This is local UI/fixture evidence, not backend, staging, or user-acceptance evidence.'
        : 'The local Market empty scenario did not satisfy every assertion. Inspect the request trace, page errors, failure list, and screenshot; this report is not passing evidence.',
    failures,
  };
  const sidecar = {
    schemaVersion: 1,
    observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      await Promise.all(
        [...new Set([...sourcePaths, runnerPath])]
          .sort()
          .map(async (relativePath) => [relativePath, await sha256(relativePath)]),
      ),
    ),
    fixtureBoundary: {
      serviceWorkerControlled: scenarioResponses.some((response) => response.fromServiceWorker),
      allObservedResponsesFromServiceWorker:
        scenarioResponses.length > 0 &&
        scenarioResponses.every((response) => response.fromServiceWorker),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: scenarioRequests.some((request) => {
        const response = scenarioResponses.find(
          (candidate) => candidate.sequence === request.sequence,
        );
        return !response || !response.fromServiceWorker;
      }),
      realBackendMutationSent: false,
    },
    scenario,
  };
  await fs.writeFile(
    path.join(root, sidecarPath),
    await serializeJson(sidecar, path.join(root, sidecarPath)),
  );
  if (failures.length === 0 && !process.argv.includes('--no-register')) {
    const master = JSON.parse((await read(masterPath)).toString('utf8'));
    const reportDigest = crypto
      .createHash('sha256')
      .update(await fs.readFile(path.join(root, sidecarPath)))
      .digest('hex');
    master.scenarioEvidenceArtifacts = (master.scenarioEvidenceArtifacts ?? []).filter(
      (artifact) => artifact.id !== 'market.empty',
    );
    master.scenarioEvidenceArtifacts.push({
      id: 'market.empty',
      path: sidecarPath,
      sha256: reportDigest,
    });
    master.marketEmptyEvidence = {
      report: sidecarPath,
      observedAt,
      note: 'Current-head sidecar records the Market screener empty list read and visible empty state. Aggregate historical source hashes and unrelated scenarios are not promoted.',
    };
    await fs.writeFile(path.join(root, masterPath), await serializeJson(master, masterPath));
  }
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sidecar.sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

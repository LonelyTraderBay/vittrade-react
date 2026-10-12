import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const directory = path.dirname(fileURLToPath(import.meta.url));
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const checkedAt = new Date().toISOString();
const searchQuery = 'solana';
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportRelativePath = `docs/architecture/production-readiness/evidence/A06/discovery-loading-current-head-browser-check-${runId}.json`;
const runnerRelativePath =
  'docs/architecture/production-readiness/evidence/A06/run-discovery-loading-current-head-browser-check.mjs';
const screenshotName = `preview-discovery-loading-current-head-${runId}.png`;
const sourcePaths = [
  'contracts/openapi/discovery.yaml',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/discovery/api/discovery-api.ts',
  'src/features/discovery/model/discovery-queries.ts',
  'src/features/discovery/pages/DiscoveryContractPages.tsx',
  'src/features/discovery/routes.ts',
  operationMapPath,
];
const readFile = (p) => fsSync.readFileSync(path.join(root, p));
const sha256 = (p) => crypto.createHash('sha256').update(readFile(p)).digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });
const operationMap = JSON.parse(await fs.readFile(path.join(root, operationMapPath), 'utf8'));
const operationIds = operationMap.operations
  .filter((x) => x.domain === 'discovery')
  .map((x) => x.operationId);
assert.deepEqual(operationIds, ['searchDiscovery', 'getDiscoveryTopic']);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [],
  responses = [],
  externalRequests = [],
  pageErrors = [];
const externalApiOrigins = new Set(),
  externalAssetOrigins = new Set(),
  externalResourceOrigins = new Set();
const requestStartedAt = new WeakMap();
const startedAt = Date.now();
let initialSessionResponse = null,
  loginResponse = null,
  loginPayload = null,
  discoveryResponse = null,
  searchResult = null;
let scenarioSelected = false,
  loadingStateVisible = false,
  loadingVisibleMs = null,
  emptyStateDuringLoading = false,
  resultCount = null,
  finalRoute = null;
const failures = [];
page.on('request', (request) => {
  const url = new URL(request.url()),
    type = request.resourceType();
  if (url.origin !== new URL(origin).origin) {
    externalRequests.push({
      origin: url.origin,
      path: url.pathname,
      method: request.method(),
      resourceType: type,
    });
    if (['image', 'font', 'stylesheet'].includes(type)) externalAssetOrigins.add(url.origin);
    else if (url.pathname.startsWith('/api/')) externalApiOrigins.add(url.origin);
    else externalResourceOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
  const op = operationMap.operations.find(
    (x) => x.method === request.method() && url.pathname.endsWith(x.path),
  );
  requests.push({
    operationId: op?.operationId ?? null,
    method: request.method(),
    path: url.pathname,
    resourceType: type,
    ...(url.pathname === '/api/discovery/search' ? { query: url.searchParams.get('query') } : {}),
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const op = operationMap.operations.find(
    (x) => x.method === response.request().method() && url.pathname.endsWith(x.path),
  );
  const started = requestStartedAt.get(response.request());
  responses.push({
    operationId: op?.operationId ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(started === undefined ? {} : { elapsedMs: Date.now() - started }),
  });
});
const reportPath = path.join(root, reportRelativePath);
try {
  const sessionPromise = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/api/auth/session' && r.request().method() === 'GET',
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
    (r) => new URL(r.url()).pathname === '/api/auth/login' && r.request().method() === 'POST',
  );
  await page.getByTestId('auth-submit').click();
  loginResponse = await loginPromise;
  loginPayload = await loginResponse.json();
  await page.waitForURL('**/w/home');
  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('discovery');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('discovery.loading', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);
  await page.getByLabel('Kịch bản màn hình').selectOption('discovery');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  assert.equal(new URL(page.url()).pathname, '/w/search');
  const searchPromise = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === '/api/discovery/search' &&
      r.request().method() === 'GET' &&
      new URL(r.url()).searchParams.get('query') === searchQuery,
  );
  const searchInput = page.getByPlaceholder('Tìm market, mode, creator hoặc pair…');
  const loadingMessage = page.getByText('Đang tải dữ liệu Discovery API…', { exact: true });
  const emptyMessage = page.getByText('Không tìm thấy kết quả phù hợp.', { exact: true });
  await searchInput.fill(searchQuery);
  await loadingMessage.waitFor({ state: 'visible' });
  loadingStateVisible = true;
  const loadingShownAt = Date.now();
  emptyStateDuringLoading = await emptyMessage.isVisible().catch(() => false);
  assert.equal(emptyStateDuringLoading, false);
  discoveryResponse = await searchPromise;
  loadingVisibleMs = Date.now() - loadingShownAt;
  assert.ok(loadingVisibleMs >= 1_500, `Loading was visible for only ${loadingVisibleMs} ms`);
  assert.equal(discoveryResponse.status(), 200);
  assert.equal(discoveryResponse.fromServiceWorker(), true);
  searchResult = await discoveryResponse.json();
  assert.equal(searchResult.query, searchQuery);
  const visibleSections = [
    ['Prediction markets', searchResult.predictions],
    ['Arena', [...searchResult.arenaModes, ...searchResult.arenaRooms]],
    ['Creators', searchResult.creators],
    ['Spot pairs', searchResult.tradingPairs],
  ];
  for (const [label, items] of visibleSections) {
    if (items.length === 0) {
      assert.equal(
        await page.getByRole('heading', { name: new RegExp(`^${label} \\(0\\)$`) }).count(),
        0,
      );
      continue;
    }
    await page.getByRole('heading', { name: `${label} (${items.length})`, exact: true }).waitFor();
  }
  resultCount =
    searchResult.predictions.length +
    searchResult.arenaModes.length +
    searchResult.arenaRooms.length +
    searchResult.creators.length +
    searchResult.tradingPairs.length;
  assert.equal(await searchInput.inputValue(), searchQuery);
  assert.equal(await searchInput.isEnabled(), true);
  await loadingMessage.waitFor({ state: 'hidden' });
  assert.equal(await loadingMessage.isVisible(), false);
  if (resultCount === 0) await emptyMessage.waitFor({ state: 'visible' });
  else assert.equal(await emptyMessage.count(), 0);
  assert.equal(await page.getByText('Có lỗi xảy ra').count(), 0);
  assert.equal(await page.getByText('Đang tải dữ liệu Discovery API').count(), 0);
  assert.equal(requests.filter((x) => x.operationId === 'searchDiscovery').length, 1);
  assert.equal(requests.filter((x) => x.operationId === 'getDiscoveryTopic').length, 0);
  assert.equal(
    requests.some(
      (x) => x.path.startsWith('/api/discovery/') && ['POST', 'PATCH', 'DELETE'].includes(x.method),
    ),
    false,
  );
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(
    responses.every((x) => x.fromServiceWorker),
    true,
  );
  assert.deepEqual(pageErrors, []);
  finalRoute = new URL(page.url()).pathname;
  await page.screenshot({ path: path.join(directory, screenshotName), fullPage: true });
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  if (!fsSync.existsSync(path.join(directory, screenshotName)))
    await page
      .screenshot({ path: path.join(directory, screenshotName), fullPage: true })
      .catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const scenario = {
    id: 'discovery.loading',
    domain: 'discovery',
    state: 'loading',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'developer',
    permissions: loginPayload?.session?.user?.permissions ?? [],
    route: '/w/search',
    finalRoute,
    operationIds,
    observedOperationIds: discoveryResponse?.status() === 200 ? ['searchDiscovery'] : [],
    operationRequestCounts: Object.fromEntries(
      operationIds.map((id) => [id, requests.filter((x) => x.operationId === id).length]),
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
    discoveryResponse: discoveryResponse
      ? {
          status: discoveryResponse.status(),
          fromServiceWorker: discoveryResponse.fromServiceWorker(),
        }
      : null,
    scenarioSelected,
    loadingStateVisible,
    loadingVisibleMs,
    emptyStateDuringLoading,
    resultCount,
    resultCounts: searchResult
      ? {
          query: searchResult.query,
          predictions: searchResult.predictions.length,
          arenaModes: searchResult.arenaModes.length,
          arenaRooms: searchResult.arenaRooms.length,
          creators: searchResult.creators.length,
          tradingPairs: searchResult.tradingPairs.length,
        }
      : null,
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    externalResourceOrigins: [...externalResourceOrigins],
    externalRequests,
    pageErrors,
    elapsedMs: Date.now() - startedAt,
    screenshots: fsSync.existsSync(path.join(directory, screenshotName)) ? [screenshotName] : [],
    failures,
    knownUiFindings: [
      'At /w/search, the shell heading still reads Dashboard and the sidebar highlights Trang chủ.',
      'The floating Web widget overlaps the simulated-data warning banner.',
    ],
    note: 'Local Chromium/Vite/MSW loading search; the explicit discovery.loading preview scenario delays the normal handler response by approximately two seconds. Only searchDiscovery was exercised (1/2 Discovery operations). This measures client loading behavior with a fixture, not backend latency or availability, staging, production or user acceptance.',
  };
  const sourceHashes = Object.fromEntries(
    [...new Set([...sourcePaths, runnerRelativePath])].sort().map((p) => [p, sha256(p)]),
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
      allObservedResponsesFromServiceWorker: responses.every((x) => x.fromServiceWorker),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
    },
    sourceHashes,
    scenario,
  };
  await fs.writeFile(reportPath, await serializeJson(sidecar, reportPath));
  process.stdout.write(
    `${JSON.stringify({ scenario, sourceHashCount: Object.keys(sourceHashes).length }, null, 2)}\n`,
  );
  await browser.close();
}
if (failures.length > 0) process.exitCode = 1;

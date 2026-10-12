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
  'docs/architecture/production-readiness/evidence/A06/run-launchpad-loading-current-head-browser-check.mjs';
const sidecarPath =
  'docs/architecture/production-readiness/evidence/A06/launchpad-loading-current-head-browser-check-' +
  runId +
  '.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotName = 'preview-launchpad-loading-current-head-' + runId + '.png';
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/launchpad.yaml',
  operationMapPath,
  'src/app/App.tsx',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/launchpad-fixtures.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/features/launchpad/api/launchpad-api.ts',
  'src/features/launchpad/model/launchpad-queries.ts',
  'src/features/launchpad/model/launchpad-types.ts',
  'src/features/launchpad/pages/LaunchpadContractPages.tsx',
  'src/features/launchpad/pages/LaunchpadContractPages.test.tsx',
  'src/features/launchpad/routes.ts',
  'src/shared/api/client.ts',
  'src/shared/api/http-client.ts',
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
const operationMap = JSON.parse(await fs.readFile(path.join(root, operationMapPath), 'utf8'));
const contract = parse(read('contracts/openapi/launchpad.yaml').toString('utf8'));
const contractOperations = Object.values(contract.paths).flatMap((pathItem) =>
  Object.entries(pathItem)
    .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
    .map(([method, operation]) => ({ method: method.toUpperCase(), ...operation })),
);
assert.deepEqual(
  contractOperations.map((operation) => operation.operationId).sort(),
  expectedOperationIds.slice().sort(),
  'Launchpad contract inventory changed.',
);
const listOperation = contractOperations.find(
  (operation) => operation.operationId === 'listLaunchpadProjects',
);
assert.ok(
  listOperation?.responses?.['200'],
  'The loading flow must end with the declared 200 response.',
);
const mappedOperations = operationMap.operations.filter(
  (operation) => operation.domain === 'launchpad',
);
assert.deepEqual(
  mappedOperations.map((operation) => operation.operationId).sort(),
  expectedOperationIds.slice().sort(),
  'Launchpad operation map changed.',
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const requests = [];
const responses = [];
const externalApiOrigins = new Set();
const requestStartedAt = new WeakMap();
const startedAt = Date.now();
const failures = [];
let scenarioSelected = false;
let listResponseBody = null;
let finalRoute = null;

page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestStartedAt.set(request, Date.now());
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
  const requestTime = requestStartedAt.get(response.request());
  responses.push({
    operationId: operationFor(operationMap, response.request().method(), url.pathname) ?? null,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    ...(requestTime === undefined ? {} : { elapsedMs: Date.now() - requestTime }),
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
  await page.goto(origin + '/w/auth/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const sessionResponse = await sessionPromise;
  assert.equal(sessionResponse.status(), 401);
  assert.equal(sessionResponse.fromServiceWorker(), true);
  await login();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('launchpad');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('launchpad.loading', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  const listResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/launchpad/projects' &&
      response.request().method() === 'GET',
  );
  let listResponseSettled = false;
  void listResponsePromise.then(() => {
    listResponseSettled = true;
  });
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.getByRole('button', { name: 'Launchpad', exact: true }).click();
  await page.getByText('Đang tải dữ liệu Launchpad API…', { exact: true }).waitFor();
  assert.equal(
    listResponseSettled,
    false,
    'The loading state must render before the list response.',
  );
  assert.equal(await page.getByText('Không có dự án phù hợp.', { exact: true }).count(), 0);
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotName),
    fullPage: true,
  });
  const listResponse = await listResponsePromise;
  assert.equal(listResponse.status(), 200);
  assert.equal(listResponse.fromServiceWorker(), true);
  listResponseBody = await listResponse.json();
  assert.ok(listResponseBody.projects.length > 0);
  assert.equal(listResponseBody.total, listResponseBody.projects.length);
  await page.getByText(listResponseBody.projects[0].name, { exact: true }).waitFor();
  assert.equal(await page.getByText('Không có dự án phù hợp.', { exact: true }).count(), 0);
  const listResponseElapsedMs = responses.find(
    (response) =>
      response.operationId === 'listLaunchpadProjects' &&
      response.path === '/api/launchpad/projects',
  )?.elapsedMs;
  assert.ok(
    typeof listResponseElapsedMs === 'number' && listResponseElapsedMs >= 1_900,
    'The local loading delay must remain observable in the response trace.',
  );

  const launchpadRequests = requests.filter((request) =>
    request.path.startsWith('/api/launchpad/'),
  );
  assert.equal(launchpadRequests.length, 1);
  assert.equal(launchpadRequests[0].operationId, 'listLaunchpadProjects');
  assert.equal(launchpadRequests[0].method, 'GET');
  assert.deepEqual(externalApiOrigins, new Set());
  assert.ok(
    responses
      .filter((response) => response.path.startsWith('/api/launchpad/'))
      .every((response) => response.status === 200 && response.fromServiceWorker),
  );
  finalRoute = new URL(page.url()).pathname;
} catch (error) {
  failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  await page
    .screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true })
    .catch(() => {});
} finally {
  if (!finalRoute && page.url()) finalRoute = new URL(page.url()).pathname;
  const observedOperationIds = [
    ...new Set(
      requests
        .map((request) => request.operationId)
        .filter((operationId) => expectedOperationIds.includes(operationId)),
    ),
  ].sort();
  const scenario = {
    id: 'launchpad.loading',
    domain: 'launchpad',
    state: 'loading',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    routes: finalRoute ? [finalRoute] : [],
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
    listProjectCount: listResponseBody?.projects?.length ?? null,
    listTotal: listResponseBody?.total ?? null,
    activeCount: listResponseBody?.activeCount ?? null,
    listResponseElapsedMs:
      responses.find((response) => response.operationId === 'listLaunchpadProjects')?.elapsedMs ??
      null,
    scenarioSelected,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: fsSync.existsSync(path.join(evidenceDirectory, screenshotName))
      ? [screenshotName]
      : [],
    note:
      failures.length === 0
        ? 'Local Chromium/MSW observed the Launchpad loading state before listLaunchpadProjects returned the ordinary contract-valid 200 fixture response after a configured 2-second preview delay. The list appeared afterward without a false empty state. This row observes listLaunchpadProjects only (1/2 linked operations); detail remains outside the loading route flow. No write or external API call occurred; this is not backend or user-acceptance evidence.'
        : 'The local Launchpad loading scenario did not satisfy every assertion. Inspect the request trace and screenshot; the report is not passing evidence.',
  };
  const sourceHashPaths = [...new Set([...sourcePaths, runnerPath])].sort();
  const sourceHashes = Object.fromEntries(
    sourceHashPaths.map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    fixtureBoundary: {
      serviceWorkerControlled:
        responses.length > 0 && responses.every((response) => response.fromServiceWorker),
      allObservedResponsesFromServiceWorker:
        responses.length > 0 && responses.every((response) => response.fromServiceWorker),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: responses.some((response) => !response.fromServiceWorker),
      realBackendMutationSent: requests.some(
        (request) =>
          request.path.startsWith('/api/launchpad/') &&
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
      ),
    },
    sourceHashes,
    scenario,
  };
  const destination = path.join(root, sidecarPath);
  await fs.writeFile(destination, await serializeJson(sidecar, destination));
  process.stdout.write(
    JSON.stringify(
      { scenario, report: sidecarPath, sourceHashCount: Object.keys(sourceHashes).length },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

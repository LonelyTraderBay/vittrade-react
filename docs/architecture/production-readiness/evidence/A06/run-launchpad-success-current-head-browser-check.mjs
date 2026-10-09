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
  'docs/architecture/production-readiness/evidence/A06/run-launchpad-success-current-head-browser-check.mjs';
const sidecarPath =
  'docs/architecture/production-readiness/evidence/A06/launchpad-success-current-head-browser-check-' +
  runId +
  '.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotNames = [
  'preview-launchpad-success-project-list-current-head-' + runId + '.png',
  'preview-launchpad-success-project-detail-current-head-' + runId + '.png',
];
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
const contract = parse(
  fsSync.readFileSync(path.join(root, 'contracts/openapi/launchpad.yaml'), 'utf8'),
);
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
assert.ok(contractOperations.every((operation) => Object.hasOwn(operation.responses ?? {}, '200')));
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
let sessionResponse = null;
let loginResponse = null;
let scenarioSelected = false;
let listResponseBody = null;
let detailResponseBody = null;
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
  return response;
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
  sessionResponse = await sessionPromise;
  assert.equal(sessionResponse.status(), 401);
  assert.equal(sessionResponse.fromServiceWorker(), true);
  loginResponse = await login();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('launchpad');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('launchpad.success', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  const listResponsePromise = page
    .waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/launchpad/projects' &&
        response.request().method() === 'GET',
    )
    .catch(() => null);
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.getByRole('button', { name: 'Launchpad', exact: true }).click();
  await page.getByText('VitLaunch', { exact: true }).waitFor();
  const listResponse = await listResponsePromise;
  assert.ok(listResponse, 'The Launchpad list GET must produce an HTTP response.');
  assert.equal(listResponse.status(), 200);
  assert.equal(listResponse.fromServiceWorker(), true);
  listResponseBody = await listResponse.json();
  assert.ok(listResponseBody.projects.length > 0);
  assert.ok(listResponseBody.total >= listResponseBody.projects.length);
  await page.getByText(listResponseBody.projects[0].name, { exact: true }).waitFor();
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[0]), fullPage: true });

  const project = listResponseBody.projects[0];
  const detailPath = '/api/launchpad/projects/' + encodeURIComponent(project.id);
  const detailResponsePromise = page
    .waitForResponse(
      (response) =>
        new URL(response.url()).pathname === detailPath && response.request().method() === 'GET',
    )
    .catch(() => null);
  await page.getByRole('button').filter({ hasText: project.name }).first().click();
  await page.waitForURL('**/w/launchpad/' + project.id);
  await page.getByText('Tokenomics', { exact: true }).waitFor();
  await page.getByText('Audit & access', { exact: true }).waitFor();
  await page.getByText('Production action boundary', { exact: true }).waitFor();
  const detailResponse = await detailResponsePromise;
  assert.ok(detailResponse, 'The Launchpad detail GET must produce an HTTP response.');
  assert.equal(detailResponse.status(), 200);
  assert.equal(detailResponse.fromServiceWorker(), true);
  detailResponseBody = await detailResponse.json();
  assert.equal(detailResponseBody.id, project.id);
  assert.equal(detailResponseBody.name, project.name);
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotNames[1]), fullPage: true });

  assert.equal(externalApiOrigins.size, 0);
  assert.equal(
    requests.some(
      (request) =>
        request.path.startsWith('/api/launchpad/') &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
    ),
    false,
    'The successful Launchpad list/detail check is read-only.',
  );
  assert.ok(
    requests
      .filter((request) => request.path.startsWith('/api/launchpad/'))
      .every((request) => request.method === 'GET'),
  );
  assert.ok(
    responses
      .filter((response) => response.path.startsWith('/api/launchpad/'))
      .every((response) => response.status === 200 && response.fromServiceWorker),
  );
  finalRoute = new URL(page.url()).pathname;
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
  const observedOperationIds = [
    ...new Set(
      requests
        .map((request) => request.operationId)
        .filter((operationId) => expectedOperationIds.includes(operationId)),
    ),
  ].sort();
  const scenario = {
    id: 'launchpad.success',
    domain: 'launchpad',
    state: 'success',
    status: failures.length === 0 ? 'passed' : 'failed',
    observedAt: new Date().toISOString(),
    persona: 'developer (local MSW fixture)',
    role: 'user',
    routes: ['/w/launchpad', finalRoute],
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
    detailProjectId: detailResponseBody?.id ?? null,
    detailProjectName: detailResponseBody?.name ?? null,
    scenarioSelected,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: screenshotNames.filter((name) =>
      fsSync.existsSync(path.join(evidenceDirectory, name)),
    ),
    note:
      failures.length === 0
        ? 'Local Chromium/MSW observed contract-valid 200 list and detail reads, populated Launchpad UI and a read-only detail boundary. Both mapped Launchpad operations were exercised; no purchase/subscription mutation or external API call occurred. Fixture UI evidence does not establish backend persistence, authorization or user acceptance.'
        : 'The local Launchpad success scenario did not satisfy every assertion. Inspect the response trace and screenshots; the report is not a passing scenario.',
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

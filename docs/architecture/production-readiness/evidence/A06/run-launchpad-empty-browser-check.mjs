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
const runnerPath =
  'docs/architecture/production-readiness/evidence/A06/run-launchpad-empty-browser-check.mjs';
const sidecarPath =
  'docs/architecture/production-readiness/evidence/A06/launchpad-empty-browser-check-2026-09-29.json';
const masterPath =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const operationMapPath =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const screenshotName = 'preview-launchpad-empty-2026-09-29.png';
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/launchpad.yaml',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/PreviewControls.test.tsx',
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
  'src/features/launchpad/pages/LaunchpadContractPages.test.tsx',
  'src/shared/api/client.ts',
  'src/shared/session/AuthContext.tsx',
];
const expectedOperationIds = ['listLaunchpadProjects', 'getLaunchpadProject'];
const reviewedStaleHashes = {
  'docs/architecture/production-readiness/evidence/A06/run-launchpad-empty-browser-check.mjs':
    '733c322636ae3bafbc67ee6d6c608f0768ad2de420f2fe434d96386def25f673',
};
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
  'Browser evidence must match the A06 baseline.',
);
const masterFile = path.join(root, masterPath);
const master = JSON.parse(await fs.readFile(masterFile, 'utf8'));
const staleSourceHashes = Object.entries(master.sourceHashes ?? {})
  .filter(([relativePath, expectedHash]) => sha256(relativePath) !== expectedHash)
  .sort(([left], [right]) => left.localeCompare(right));
assert.deepEqual(
  staleSourceHashes,
  Object.entries(reviewedStaleHashes).sort(([left], [right]) => left.localeCompare(right)),
  'Review only the Launchpad empty scenario changes before refreshing browser evidence.',
);

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
assert.ok(listOperation?.responses?.['200'], 'The empty list must use the declared 200 response.');
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  scenarioSelected = await page
    .getByTestId('active-preview-scenario')
    .getByText('launchpad.empty', { exact: true })
    .isVisible();
  assert.equal(scenarioSelected, true);

  const listResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/launchpad/projects' &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.getByRole('button', { name: 'Launchpad', exact: true }).click();
  await page.getByText('Không có dự án phù hợp.', { exact: true }).waitFor();
  const listResponse = await listResponsePromise;
  assert.equal(listResponse.status(), 200);
  assert.equal(listResponse.fromServiceWorker(), true);
  listResponseBody = await listResponse.json();
  assert.deepEqual(listResponseBody, { projects: [], total: 0, activeCount: 0 });
  assert.equal(await page.getByText('NexaAI Protocol', { exact: true }).count(), 0);
  await page.screenshot({
    path: path.join(evidenceDirectory, screenshotName),
    fullPage: true,
  });

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
    id: 'launchpad.empty',
    domain: 'launchpad',
    state: 'empty',
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
    scenarioSelected,
    externalApiOrigins: [...externalApiOrigins],
    elapsedMs: Date.now() - startedAt,
    screenshots: fsSync.existsSync(path.join(evidenceDirectory, screenshotName))
      ? [screenshotName]
      : [],
    sourceHashesReviewed: Object.keys(master.sourceHashes ?? {}).length,
    staleSourceHashesBeforeRun: staleSourceHashes.map(([relativePath]) => relativePath),
    failures,
    sourceHashReview: {
      reviewedPaths: staleSourceHashes.map(([relativePath]) => relativePath),
      priorHashes: Object.fromEntries(staleSourceHashes),
      scope:
        'Added only contract-shaped Launchpad empty collection behavior and enabled the empty scenario selector; normalized the browser report to list the single observed route once. Focused tests and this browser run cover the change; Launchpad detail remains the normal fixture read.',
      sourceHashBaselineRefreshedAfterBrowserRun: failures.length === 0,
    },
    note:
      failures.length === 0
        ? 'Local Chromium/MSW observed one contract-valid 200 empty Launchpad list response and the visible no-projects state. The list contract provides no eligibility-reason field, so none is invented. This row observes listLaunchpadProjects only (1/2 linked operations); detail remains outside the empty-list route flow. No write or external API call occurred; this is not backend or user-acceptance evidence.'
        : 'The local Launchpad empty scenario did not satisfy every assertion. Inspect the request trace and screenshot; the report is not passing evidence.',
  };
  const sourceHashPaths = [
    ...new Set([...Object.keys(master.sourceHashes ?? {}), ...sourcePaths, runnerPath]),
  ].sort();
  const sidecar = {
    schemaVersion: 1,
    observedAt: scenario.observedAt,
    sourceHead,
    origin,
    viewport: { width: 1440, height: 900 },
    sourceHashes: Object.fromEntries(
      [...new Set([...sourcePaths, runnerPath])]
        .sort()
        .map((relativePath) => [relativePath, sha256(relativePath)]),
    ),
    scenario,
  };
  await fs.writeFile(
    path.join(root, sidecarPath),
    await serializeJson(sidecar, path.join(root, sidecarPath)),
  );
  master.sourceHashes = Object.fromEntries(
    sourceHashPaths.map((relativePath) => [relativePath, sha256(relativePath)]),
  );
  master.scenarios = (master.scenarios ?? []).filter((item) => item.id !== 'launchpad.empty');
  master.scenarios.push(scenario);
  master.launchpadEmptyEvidence = {
    report: sidecarPath,
    observedAt: scenario.observedAt,
    note: 'Local browser observed an empty listLaunchpadProjects 200 and visible empty state; project detail was not part of this scenario.',
  };
  master.screenshots = [...new Set([...(master.screenshots ?? []), ...scenario.screenshots])];
  master.checkedAt = scenario.observedAt;
  await fs.writeFile(masterFile, await serializeJson(master, masterPath));
  process.stdout.write(
    JSON.stringify(
      { scenario, sourceHashCount: Object.keys(master.sourceHashes).length },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
}

if (failures.length > 0) process.exitCode = 1;

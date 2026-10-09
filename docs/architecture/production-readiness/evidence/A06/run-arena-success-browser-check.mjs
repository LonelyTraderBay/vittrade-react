import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import prettier from 'prettier';
import { parse } from 'yaml';

const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportPath = path.join(evidenceDirectory, `arena-success-browser-check-${runId}.json`);
const screenshotPaths = {
  discovery: path.join(evidenceDirectory, `preview-arena-success-discovery-${runId}.png`),
  mode: path.join(evidenceDirectory, `preview-arena-success-mode-${runId}.png`),
  challenge: path.join(evidenceDirectory, `preview-arena-success-challenge-${runId}.png`),
};
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-arena-success-browser-check.mjs',
  'src/app/routes.ts',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/arena-fixtures.ts',
  'src/dev/mocks/arena-handlers.test.ts',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'contracts/openapi/arena.yaml',
  'src/features/arena/api/arena-api.ts',
  'src/features/arena/api/arena-api.test.ts',
  'src/features/arena/model/arena-queries.ts',
  'src/features/arena/pages/ArenaDiscoveryPage.tsx',
  'src/features/arena/pages/ArenaDiscoveryPage.test.tsx',
  'src/features/arena/pages/ArenaContractPages.tsx',
  'src/features/arena/pages/ArenaJoinContractPage.test.tsx',
];
const operationPaths = {
  getArenaDiscovery: { method: 'GET', path: '/api/arena/discovery' },
  getArenaMode: { method: 'GET', path: /^\/api\/arena\/modes\/[^/]+$/ },
  getArenaChallenge: { method: 'GET', path: /^\/api\/arena\/challenges\/[^/]+$/ },
  joinArenaChallenge: { method: 'POST', path: /^\/api\/arena\/challenges\/[^/]+\/join$/ },
};
const operationIdFor = (method, pathname) =>
  Object.entries(operationPaths).find(([, operation]) => {
    const matches =
      typeof operation.path === 'string'
        ? operation.path === pathname
        : operation.path.test(pathname);
    return operation.method === method && matches;
  })?.[0];

const contract = parse(await fs.readFile('contracts/openapi/arena.yaml', 'utf8'));
const expectedOperationIds = Object.keys(operationPaths);
const contractOperations = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) => expectedOperationIds.includes(operation.operationId));
const declaredSuccess = Object.fromEntries(
  contractOperations.map((operation) => [
    operation.operationId,
    operation.operationId === 'joinArenaChallenge' ? '201' : '200',
  ]),
);
assert.equal(contractOperations.length, expectedOperationIds.length);
for (const operation of contractOperations) {
  assert.ok(
    Object.hasOwn(operation.responses ?? {}, declaredSuccess[operation.operationId]),
    `${operation.operationId} must declare ${declaredSuccess[operation.operationId]}.`,
  );
}
assert.equal(
  contractOperations
    .find((operation) => operation.operationId === 'joinArenaChallenge')
    ?.parameters?.some((parameter) => parameter.name === 'Idempotency-Key' && parameter.required),
  true,
);

const requestCounts = Object.fromEntries(expectedOperationIds.map((id) => [id, 0]));
const requests = [];
const responses = [];
const unexpectedArenaRequests = [];
const financialApiRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);

page.on('request', (request) => {
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== origin &&
    (request.headers().accept?.includes('application/json') || url.pathname.includes('/api/'))
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (/^\/api\/(wallet|trading|orders)(\/|$)/.test(url.pathname)) {
    financialApiRequests.push({ method: request.method(), path: url.pathname });
  }
  if (!url.pathname.startsWith('/api/arena/')) return;
  const operationId = operationIdFor(request.method(), url.pathname);
  if (!operationId) {
    unexpectedArenaRequests.push({ method: request.method(), path: url.pathname });
    return;
  }
  requestCounts[operationId] += 1;
  requests.push({
    operationId,
    method: request.method(),
    path: url.pathname,
    idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
  });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  const operationId = operationIdFor(response.request().method(), url.pathname);
  if (!operationId) return;
  responses.push({
    operationId,
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function signInArenaThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('arena');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

try {
  const startedAt = Date.now();
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('arena');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.success').waitFor();
  await signInArenaThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('arena.success').waitFor();

  const discoveryResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/discovery' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/arena');
  const discoveryResponse = await discoveryResponsePromise;
  const discoveryPayload = await discoveryResponse.json();
  assert.equal(discoveryResponse.status(), 200);
  assert.equal(discoveryResponse.fromServiceWorker(), true);
  const challengeFromDiscovery = discoveryPayload.challenges.find((item) => item.id === 'ch001');
  assert.ok(challengeFromDiscovery, 'Open Arena discovery must expose the public ch001 fixture.');
  await page.getByRole('heading', { name: challengeFromDiscovery.title }).waitFor();
  const arenaPointsDisclosureVisible =
    (await page.getByText('Arena Points only.', { exact: false }).isVisible()) === true;
  assert.equal(arenaPointsDisclosureVisible, true);
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: screenshotPaths.discovery, fullPage: true });

  const modeId = challengeFromDiscovery.modeId;
  const modeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/arena/modes/${modeId}` &&
      response.request().method() === 'GET',
  );
  await page.getByRole('tab', { name: 'Mode' }).click();
  await page.getByRole('button', { name: 'Xem mode', exact: true }).first().click();
  await page.waitForURL(`**/w/arena/mode/${modeId}`);
  const modeResponse = await modeResponsePromise;
  const modePayload = await modeResponse.json();
  assert.equal(modeResponse.status(), 200);
  assert.equal(modeResponse.fromServiceWorker(), true);
  assert.equal(modePayload.id, modeId);
  await page.getByRole('heading', { name: modePayload.title }).waitFor();
  await page.getByText(modePayload.winCondition, { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.mode, fullPage: true });

  await navigateWithinSpa('/w/arena');
  await page.getByRole('tab', { name: 'Challenge' }).click();
  await page.getByRole('heading', { name: challengeFromDiscovery.title }).waitFor();
  const challengeId = challengeFromDiscovery.id;
  const challengeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/arena/challenges/${challengeId}` &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Xem challenge', exact: true }).first().click();
  await page.waitForURL(`**/w/arena/challenge/${challengeId}`);
  const challengeResponse = await challengeResponsePromise;
  const challengePayload = await challengeResponse.json();
  assert.equal(challengeResponse.status(), 200);
  assert.equal(challengeResponse.fromServiceWorker(), true);
  assert.equal(challengePayload.id, challengeId);
  await page.getByRole('heading', { name: challengePayload.title }).waitFor();
  await page.getByRole('button', { name: 'Tham gia challenge', exact: true }).waitFor();

  const joinRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === `/api/arena/challenges/${challengeId}/join` &&
      request.method() === 'POST',
  );
  const joinResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/arena/challenges/${challengeId}/join` &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Tham gia challenge', exact: true }).click();
  const [joinRequest, joinResponse] = await Promise.all([joinRequestPromise, joinResponsePromise]);
  const joinPayload = await joinResponse.json();
  const idempotencyKey = joinRequest.headers()['idempotency-key'];
  assert.equal(joinResponse.status(), 201);
  assert.equal(joinResponse.fromServiceWorker(), true);
  assert.ok(idempotencyKey && idempotencyKey.length >= 8);
  assert.equal(joinPayload.challenge.id, challengeId);
  assert.equal(joinPayload.challenge.slotsFilled, challengePayload.slotsFilled + 1);
  assert.ok(
    joinPayload.challenge.participants.some(
      (participant) => participant.name === 'VitTrade Developer' && participant.status === 'joined',
    ),
  );
  await page
    .getByText(`${joinPayload.challenge.slotsFilled}/${joinPayload.challenge.slotsTotal}`, {
      exact: true,
    })
    .waitFor();
  await page.getByRole('main').getByText('VitTrade Developer', { exact: true }).waitFor();
  await page.screenshot({ path: screenshotPaths.challenge, fullPage: true });

  assert.deepEqual(requestCounts, {
    getArenaDiscovery: 1,
    getArenaMode: 1,
    getArenaChallenge: 1,
    joinArenaChallenge: 1,
  });
  assert.equal(responses.length, 4);
  assert.ok(
    responses.every(
      (response) =>
        response.fromServiceWorker &&
        response.status === Number(declaredSuccess[response.operationId]),
    ),
  );
  assert.deepEqual(unexpectedArenaRequests, []);
  assert.deepEqual(financialApiRequests, []);
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);

  const sourceHashes = Object.fromEntries(
    await Promise.all(
      sourceFiles.map(async (file) => [
        file,
        crypto
          .createHash('sha256')
          .update(await fs.readFile(path.resolve(file)))
          .digest('hex'),
      ]),
    ),
  );
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'arena.success',
      domain: 'arena',
      state: 'success',
      status: 'passed',
      persona: 'arena',
      role: 'user',
      permissions: ['arena:join'],
      routes: ['/w/arena', `/w/arena/mode/${modeId}`, `/w/arena/challenge/${challengeId}`],
      operationIds: expectedOperationIds,
      observedOperationIds: expectedOperationIds,
      operationRequestCounts: requestCounts,
      requests,
      responses,
      declaredSuccessResponses: declaredSuccess,
      discoveryChallengeCount: discoveryPayload.challenges.length,
      modeId,
      challengeId,
      joinStatus: joinResponse.status(),
      idempotencyKeyPresent: Boolean(idempotencyKey),
      idempotencyKeyLength: idempotencyKey.length,
      initialSlotsFilled: challengePayload.slotsFilled,
      slotsFilledAfterJoin: joinPayload.challenge.slotsFilled,
      joinedParticipantVisible: true,
      arenaPointsDisclosureVisible,
      routeAvailability:
        'The local Vite development route maps /w/arena to ArenaDiscoveryPage; src/app/routes.ts selects IntegrationPendingPage when isDevelopmentBuild is false.',
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      financialApiRequestCount: financialApiRequests.length,
      writeRequestCount: requests.filter((request) => request.method !== 'GET').length,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: Date.now() - startedAt,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([name, filePath]) => [name, path.basename(filePath)]),
      ),
      note: 'Chromium exercised all four Arena OpenAPI operations using the local MSW service worker. The dedicated preview persona has arena:join; the join POST returned a local contract-shaped 201 with Idempotency-Key and the UI showed the updated participant/slot count. The route is wired only in Vite development; production uses IntegrationPendingPage. The service worker does not establish backend permission, persistence or replay behavior. Arena Points are fixture values; no wallet/trading API was called.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: responses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      arenaRequestCount: requests.length,
      arenaResponseCount: responses.length,
      operationResponseCounts: Object.fromEntries(
        expectedOperationIds.map((operationId) => [
          operationId,
          responses.filter((response) => response.operationId === operationId).length,
        ]),
      ),
      writeRequestCount: requests.filter((request) => request.method !== 'GET').length,
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      financialApiRequestCount: financialApiRequests.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: {
      operationPaths: Object.fromEntries(
        Object.entries(operationPaths).map(([operationId, operation]) => [
          operationId,
          typeof operation.path === 'string' ? operation.path : operation.path.source,
        ]),
      ),
      successResponses: declaredSuccess,
      joinRequiresIdempotencyKey: true,
    },
    sourceHashes,
    limitations:
      'This run used the local Vite development server and MSW fixtures; routes.ts selects IntegrationPendingPage when isDevelopmentBuild is false, so it does not verify the production Arena route. It also does not establish backend authorization, persistence, idempotency replay semantics, staging behavior or user acceptance.',
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) || {};
  await fs.writeFile(
    reportPath,
    await prettier.format(JSON.stringify(report, null, 2), { ...prettierOptions, parser: 'json' }),
  );
  process.stdout.write(`${JSON.stringify({ reportPath, ...report }, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

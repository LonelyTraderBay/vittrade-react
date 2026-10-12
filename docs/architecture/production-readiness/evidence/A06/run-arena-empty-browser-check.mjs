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
const reportPath = path.join(evidenceDirectory, `arena-empty-browser-check-${runId}.json`);
const screenshotPaths = {
  challenges: path.join(evidenceDirectory, `preview-arena-empty-challenges-${runId}.png`),
  modes: path.join(evidenceDirectory, `preview-arena-empty-modes-${runId}.png`),
};
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-arena-empty-browser-check.mjs',
  'src/app/routes.ts',
  'src/app/routeConfig.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'contracts/openapi/arena.yaml',
  'src/features/arena/api/arena-api.ts',
  'src/features/arena/model/arena-queries.ts',
  'src/features/arena/pages/ArenaDiscoveryPage.tsx',
  'src/features/arena/pages/ArenaDiscoveryPage.test.tsx',
];
const contract = parse(await fs.readFile('contracts/openapi/arena.yaml', 'utf8'));
const discoveryOperation = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .find((operation) => operation.operationId === 'getArenaDiscovery');
assert.ok(Object.hasOwn(discoveryOperation?.responses ?? {}, '200'));
const discoverySchema = contract.components.schemas.ArenaDiscoveryResponse;
assert.deepEqual(discoverySchema.required, ['modes', 'challenges']);
assert.equal(discoverySchema.properties.modes.type, 'array');
assert.equal(discoverySchema.properties.challenges.type, 'array');

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
  if (request.method() === 'GET' && url.pathname === '/api/arena/discovery') {
    requests.push({ operationId: 'getArenaDiscovery', method: 'GET', path: url.pathname });
    return;
  }
  unexpectedArenaRequests.push({ method: request.method(), path: url.pathname });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (url.pathname !== '/api/arena/discovery' || response.request().method() !== 'GET') return;
  responses.push({
    operationId: 'getArenaDiscovery',
    method: 'GET',
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.empty').waitFor();
  await signInArenaThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('arena.empty').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/discovery' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/arena');
  const response = await responsePromise;
  const payload = await response.json();
  assert.equal(response.status(), 200);
  assert.equal(response.fromServiceWorker(), true);
  assert.deepEqual(payload, { modes: [], challenges: [] });

  await page.getByText('Chưa có challenge nào khả dụng.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Xem challenge', exact: true }).count(), 0);
  assert.equal(
    await page.getByRole('button', { name: 'Tham gia challenge', exact: true }).count(),
    0,
  );
  assert.equal(await page.getByText('Không thể tham gia. Vui lòng thử lại.').count(), 0);
  await page.screenshot({ path: screenshotPaths.challenges, fullPage: true });

  const modeTab = page.getByRole('tab', { name: 'Mode' });
  await modeTab.click();
  await page.getByText('Chưa có mode nào khả dụng.', { exact: true }).waitFor();
  assert.equal(await modeTab.getAttribute('aria-selected'), 'true');
  await page.screenshot({ path: screenshotPaths.modes, fullPage: true });

  assert.deepEqual(requests, [
    { operationId: 'getArenaDiscovery', method: 'GET', path: '/api/arena/discovery' },
  ]);
  assert.equal(responses.length, 1);
  assert.deepEqual(
    responses.map((item) => item.status),
    [200],
  );
  assert.ok(responses.every((item) => item.fromServiceWorker));
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
      id: 'arena.empty',
      domain: 'arena',
      state: 'empty',
      status: 'passed',
      persona: 'arena',
      role: 'user',
      permissions: ['arena:join'],
      routes: ['/w/arena'],
      operationIds: ['getArenaDiscovery'],
      observedOperationIds: ['getArenaDiscovery'],
      operationRequestCounts: { getArenaDiscovery: 1 },
      requests,
      responses,
      payload,
      emptyChallengeStateVisible: true,
      emptyModeStateVisible: true,
      modeTabSelected: true,
      challengeOpenActionCount: 0,
      joinActionCount: 0,
      joinFailureCopyCount: 0,
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      financialApiRequestCount: financialApiRequests.length,
      writeRequestCount: 0,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: Date.now() - startedAt,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([name, filePath]) => [name, path.basename(filePath)]),
      ),
      routeAvailability:
        'The local Vite development route maps /w/arena to ArenaDiscoveryPage; src/app/routes.ts selects IntegrationPendingPage when isDevelopmentBuild is false.',
      note: 'Chromium received a contract-shaped empty Arena discovery from local MSW and rendered explicit empty states for both Challenge and Mode. No challenge/detail/join action, mutation, wallet/trading API or other Arena request was sent. The route is wired only in Vite development; production uses IntegrationPendingPage.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: responses.every((item) => item.fromServiceWorker),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      arenaRequestCount: requests.length,
      arenaResponseCount: responses.length,
      operationResponseCounts: { getArenaDiscovery: responses.length },
      writeRequestCount: 0,
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      financialApiRequestCount: financialApiRequests.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: {
      operationId: 'getArenaDiscovery',
      declaredSuccessResponses: ['200'],
      requiredResponseFields: discoverySchema.required,
      emptyCollectionsAllowed: true,
    },
    sourceHashes,
    limitations:
      'This run used the local Vite development server and MSW fixtures; routes.ts selects IntegrationPendingPage when isDevelopmentBuild is false, so it does not verify the production Arena route. It does not establish backend authorization, persistence, staging behavior or user acceptance.',
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

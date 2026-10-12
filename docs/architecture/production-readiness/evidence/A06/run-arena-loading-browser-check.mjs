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
const reportPath = path.join(evidenceDirectory, `arena-loading-browser-check-${runId}.json`);
const screenshotPaths = {
  loading: path.join(evidenceDirectory, `preview-arena-loading-discovery-${runId}.png`),
};
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-arena-loading-browser-check.mjs',
  'src/app/routes.ts',
  'src/app/routeConfig.ts',
  'src/app/components/layout/WebSidebar.tsx',
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
let requestAt = null;
let responseAt = null;
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
    requestAt ??= Date.now();
    requests.push({ operationId: 'getArenaDiscovery', method: 'GET', path: url.pathname });
    return;
  }
  unexpectedArenaRequests.push({ method: request.method(), path: url.pathname });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (url.pathname !== '/api/arena/discovery' || response.request().method() !== 'GET') return;
  responseAt ??= Date.now();
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

async function getActiveSidebarItems() {
  return page.locator('button[aria-current="page"]').evaluateAll((buttons) =>
    buttons.map((button) => {
      const buttonRect = button.getBoundingClientRect();
      const scrollContainer = button.closest('.overflow-y-auto');
      const containerRect = scrollContainer?.getBoundingClientRect();
      return {
        label: button.innerText.trim(),
        visibleInScrollContainer: Boolean(
          containerRect &&
          buttonRect.height > 0 &&
          buttonRect.top >= containerRect.top &&
          buttonRect.bottom <= containerRect.bottom,
        ),
      };
    }),
  );
}

async function waitForActiveSidebarItemsInView() {
  await page.waitForFunction(() => {
    const activeButtons = document.querySelectorAll('button[aria-current="page"]');
    if (activeButtons.length !== 1) return false;
    const activeButton = activeButtons[0];
    const scrollContainer = activeButton.closest('.overflow-y-auto');
    if (!scrollContainer) return false;
    const buttonRect = activeButton.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    return (
      buttonRect.height > 0 &&
      buttonRect.top >= containerRect.top &&
      buttonRect.bottom <= containerRect.bottom
    );
  });
  return getActiveSidebarItems();
}

try {
  const startedAt = Date.now();
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('arena');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.loading').waitFor();
  await signInArenaThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('arena.loading').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/discovery' &&
      response.request().method() === 'GET',
  );
  const requestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/arena/discovery' && request.method() === 'GET',
  );
  let responseObserved = false;
  void responsePromise.then(() => {
    responseObserved = true;
  });
  const flowStartedAt = Date.now();
  await navigateWithinSpa('/w/arena');
  const request = await requestPromise;
  const loadingObservedAt = Date.now();
  await page.getByText('Đang tải dữ liệu Arena…', { exact: true }).waitFor();
  const loadingUiObservedMs = Date.now() - loadingObservedAt;
  assert.equal(responseObserved, false);
  const loadingSidebarActiveItems = await waitForActiveSidebarItemsInView();
  const loadingSidebarActiveLabels = loadingSidebarActiveItems.map((item) => item.label);
  const loadingSidebarVisibleActiveLabels = loadingSidebarActiveItems
    .filter((item) => item.visibleInScrollContainer)
    .map((item) => item.label);
  assert.deepEqual(loadingSidebarActiveLabels, ['Open Arena']);
  assert.deepEqual(loadingSidebarVisibleActiveLabels, ['Open Arena']);
  await page.mouse.move(1430, 890);
  const hoveredSidebarLabels = await page
    .locator('button.web-sidebar-item')
    .evaluateAll((buttons) =>
      buttons.filter((button) => button.matches(':hover')).map((button) => button.innerText.trim()),
    );
  await page.screenshot({ path: screenshotPaths.loading, fullPage: true });
  const response = await responsePromise;
  const payload = await response.json();
  assert.equal(response.status(), 200);
  assert.equal(response.fromServiceWorker(), true);
  assert.ok(Array.isArray(payload.challenges));
  assert.ok(Array.isArray(payload.modes));
  const loadedChallengeTitle = payload.challenges[0]?.title;
  assert.equal(typeof loadedChallengeTitle, 'string');
  await page.getByRole('main').getByText('Open Arena', { exact: true }).waitFor();
  await page.getByText(loadedChallengeTitle, { exact: true }).waitFor();
  const settledSidebarActiveItems = await waitForActiveSidebarItemsInView();
  const settledSidebarActiveLabels = settledSidebarActiveItems.map((item) => item.label);
  const settledSidebarVisibleActiveLabels = settledSidebarActiveItems
    .filter((item) => item.visibleInScrollContainer)
    .map((item) => item.label);
  assert.deepEqual(settledSidebarActiveLabels, ['Open Arena']);
  assert.deepEqual(settledSidebarVisibleActiveLabels, ['Open Arena']);
  const totalFlowMs = Date.now() - flowStartedAt;

  assert.deepEqual(requests, [
    { operationId: 'getArenaDiscovery', method: 'GET', path: '/api/arena/discovery' },
  ]);
  assert.equal(request.method(), 'GET');
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
      id: 'arena.loading',
      domain: 'arena',
      state: 'loading',
      status: 'passed',
      persona: 'arena',
      role: 'user',
      permissions: ['arena:join'],
      routes: ['/w/arena'],
      operationIds: [
        'getArenaDiscovery',
        'getArenaMode',
        'getArenaChallenge',
        'joinArenaChallenge',
      ],
      observedOperationIds: ['getArenaDiscovery'],
      operationRequestCounts: { getArenaDiscovery: 1 },
      requests,
      responses,
      payload,
      loadingStateVisibleBeforeResponse: true,
      loadingUiObservedMs,
      requestToResponseMs: responseAt - requestAt,
      loadedChallengeTitle,
      loadingSidebarActiveLabels,
      loadingSidebarActiveItems,
      loadingSidebarVisibleActiveLabels,
      settledSidebarActiveLabels,
      settledSidebarActiveItems,
      settledSidebarVisibleActiveLabels,
      hoveredSidebarLabels,
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      financialApiRequestCount: financialApiRequests.length,
      writeRequestCount: 0,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: totalFlowMs,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([name, filePath]) => [name, path.basename(filePath)]),
      ),
      requestMethod: request.method(),
      routeAvailability:
        'The local Vite development route maps /w/arena to ArenaDiscoveryPage; src/app/routes.ts selects IntegrationPendingPage when isDevelopmentBuild is false.',
      note: 'Chromium observed the Arena discovery loading state while the single declared GET remained in flight, then rendered a challenge from the local MSW fixture after HTTP 200. During loading and after response, Open Arena is the sole aria-current item and its button stays within the sidebar scroll viewport. The measured two-second delay is local preview transport simulation, not backend latency. Production currently selects IntegrationPendingPage.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker: responses.every((item) => item.fromServiceWorker),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs,
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
    },
    sourceHashes,
    limitations:
      'This run used the local Vite development server and MSW fixtures; the preview loading delay is synthetic and routes.ts selects IntegrationPendingPage when isDevelopmentBuild is false. It does not establish backend latency, authorization, persistence, staging behavior or user acceptance.',
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

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
const reportPath = path.join(evidenceDirectory, `arena-error-browser-check-${runId}.json`);
const screenshotPaths = {
  error: path.join(evidenceDirectory, `preview-arena-error-discovery-${runId}.png`),
};
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-arena-error-browser-check.mjs',
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
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/features/arena/pages/ArenaDiscoveryPage.tsx',
  'src/features/arena/pages/ArenaDiscoveryPage.test.tsx',
];
const contract = parse(await fs.readFile('contracts/openapi/arena.yaml', 'utf8'));
const discoveryOperation = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .find((operation) => operation.operationId === 'getArenaDiscovery');
const arenaOperations = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) => /^\w*Arena/.test(operation.operationId ?? ''));
const auditedOperations = arenaOperations.map((operation) => ({
  operationId: operation.operationId,
  declaredResponses: Object.keys(operation.responses ?? {}).sort(),
  declared5xxResponses: Object.keys(operation.responses ?? {}).filter((status) =>
    /^5\d\d$/.test(status),
  ),
}));
assert.equal(auditedOperations.length, 4);
assert.ok(Object.hasOwn(discoveryOperation?.responses ?? {}, '200'));
assert.ok(auditedOperations.every((operation) => operation.declared5xxResponses.length === 0));

const requests = [];
const responses = [];
const failures = [];
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
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname !== '/api/arena/discovery' || request.method() !== 'GET') return;
  failures.push({
    operationId: 'getArenaDiscovery',
    method: 'GET',
    path: url.pathname,
    failure: request.failure()?.errorText ?? null,
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.error').waitFor();
  await signInArenaThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('arena.error').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const flowStartedAt = Date.now();
  await navigateWithinSpa('/w/arena');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const retryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
  await retryButton.waitFor({ state: 'visible' });
  const activeSidebarItems = await waitForActiveSidebarItemsInView();
  const activeSidebarLabels = activeSidebarItems.map((item) => item.label);
  const visibleActiveSidebarLabels = activeSidebarItems
    .filter((item) => item.visibleInScrollContainer)
    .map((item) => item.label);
  assert.deepEqual(activeSidebarLabels, ['Open Arena']);
  assert.deepEqual(visibleActiveSidebarLabels, ['Open Arena']);
  const initialFailureCount = failures.length;
  const initialRequestCount = requests.length;
  const initialElapsedMs = Date.now() - flowStartedAt;
  assert.ok(initialFailureCount > 0);
  assert.equal(initialFailureCount, 3);
  assert.equal(initialRequestCount, initialFailureCount);
  assert.equal(await page.getByText('Chưa có challenge nào khả dụng.', { exact: true }).count(), 0);
  assert.equal(responses.length, 0);
  await page.mouse.move(1430, 890);
  await page.screenshot({ path: screenshotPaths.error, fullPage: true });

  const retryStartedAt = Date.now();
  await retryButton.click();
  const retryDeadline = Date.now() + 10_000;
  while (failures.length < initialFailureCount * 2 && Date.now() < retryDeadline) {
    await page.waitForTimeout(25);
  }
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const retrySidebarActiveItems = await waitForActiveSidebarItemsInView();
  const retryVisibleActiveSidebarLabels = retrySidebarActiveItems
    .filter((item) => item.visibleInScrollContainer)
    .map((item) => item.label);
  assert.deepEqual(retryVisibleActiveSidebarLabels, ['Open Arena']);
  const retryElapsedMs = Date.now() - retryStartedAt;
  assert.equal(failures.length, initialFailureCount * 2);
  assert.equal(requests.length, failures.length);
  assert.equal(await page.getByText('Chưa có challenge nào khả dụng.', { exact: true }).count(), 0);
  assert.equal(responses.length, 0);
  const pageControlledByServiceWorker = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(pageControlledByServiceWorker, true);
  const totalFlowMs = Date.now() - flowStartedAt;

  assert.ok(requests.length > 0);
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
      id: 'arena.error',
      domain: 'arena',
      state: 'error',
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
      operationRequestCounts: { getArenaDiscovery: requests.length },
      requests,
      failures,
      responses,
      visibleErrorState: true,
      visibleRetryAction: true,
      emptySuccessStateVisible: false,
      activeSidebarItems,
      activeSidebarLabels,
      visibleActiveSidebarLabels,
      retrySidebarActiveItems,
      retryVisibleActiveSidebarLabels,
      initialFailureCount,
      retryFailureCount: failures.length - initialFailureCount,
      initialElapsedMs,
      retryElapsedMs,
      pageControlledByServiceWorker,
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      financialApiRequestCount: financialApiRequests.length,
      writeRequestCount: 0,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: totalFlowMs,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([name, filePath]) => [name, path.basename(filePath)]),
      ),
      routeAvailability:
        'The local Vite development route maps /w/arena to ArenaDiscoveryPage; src/app/routes.ts selects IntegrationPendingPage when isDevelopmentBuild is false.',
      note: 'The Arena OpenAPI declares no 5xx response on any of its four operations. Chromium used a service-worker-controlled transport failure with no HTTP response for getArenaDiscovery; the UI showed ErrorState and Retry, stayed distinct from empty success, and remained in error after one Retry click. At initial ErrorState and after Retry, Open Arena was the sole aria-current item and stayed inside the visible sidebar scroll viewport. The three transport failures in each query cycle are local HTTP-client retry behavior; the feature query does not add a second retry layer. Production currently selects IntegrationPendingPage.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: pageControlledByServiceWorker,
      allObservedResponsesFromServiceWorker:
        responses.length > 0 && responses.every((item) => item.fromServiceWorker),
      transportFailureNoHttpResponse: responses.length === 0 && failures.length > 0,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs,
      arenaRequestCount: requests.length,
      arenaResponseCount: responses.length,
      initialFailureCount,
      retryFailureCount: failures.length - initialFailureCount,
      requestFailureCount: failures.length,
      operationRequestCounts: { getArenaDiscovery: requests.length },
      operationResponseCounts: { getArenaDiscovery: responses.length },
      writeRequestCount: 0,
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      financialApiRequestCount: financialApiRequests.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: { auditedOperations },
    sourceHashes,
    limitations:
      'This run used a service-worker-controlled transport failure and no HTTP response because the Arena OpenAPI declares no 5xx status. It does not establish server error behavior, backend authorization, persistence, staging behavior or user acceptance; routes.ts selects IntegrationPendingPage outside Vite development.',
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

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Loopback preview only.');
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const runId = process.env.EVIDENCE_RUN_SUFFIX ?? `${Date.now()}`;
assert.match(runId, /^[a-z0-9-]+$/i, 'Evidence run suffix must be alphanumeric or hyphenated.');
const artifactSuffix = `-${runId}`;
const operationIds = ['listNews', 'listNotifications', 'getHelpCenter', 'listSupportTickets'];
const screenshotPaths = {
  news: path.join(directory, `preview-support-loading-news-${date}${artifactSuffix}.png`),
  notifications: path.join(
    directory,
    `preview-support-loading-notifications-${date}${artifactSuffix}.png`,
  ),
  help: path.join(directory, `preview-support-loading-help-${date}${artifactSuffix}.png`),
  tickets: path.join(directory, `preview-support-loading-tickets-${date}${artifactSuffix}.png`),
};
const reportPath = path.join(
  directory,
  `support-loading-browser-check-${date}${artifactSuffix}.json`,
);
const sourceFiles = [
  'contracts/openapi/support.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/app/components/layout/WebSidebar.tsx',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/dev/mocks/trading-fixtures.ts',
  'src/features/support/api/support-api.ts',
  'src/features/support/model/support-queries.ts',
  'src/features/support/model/support-types.ts',
  'src/features/support/pages/HelpCenterContractPage.tsx',
  'src/features/support/pages/NewsContractPage.tsx',
  'src/features/support/pages/NotificationsContractPage.tsx',
  'src/features/support/pages/SupportContractPage.tsx',
  'src/shared/api/app-client.ts',
  'src/shared/api/client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-support-loading-browser-check.mjs',
];
const sha256 = async (file) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, file)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await sha256(file)])),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();

const operationFor = (method, pathname) => {
  if (method === 'GET' && pathname === '/api/content/news') return 'listNews';
  if (method === 'GET' && pathname === '/api/notifications') return 'listNotifications';
  if (method === 'POST' && /^\/api\/notifications\/[^/]+\/read$/.test(pathname)) {
    return 'markNotificationRead';
  }
  if (method === 'GET' && pathname === '/api/support/help') return 'getHelpCenter';
  if (method === 'GET' && pathname === '/api/support/tickets') return 'listSupportTickets';
  if (method === 'POST' && pathname === '/api/support/tickets') return 'createSupportTicket';
  return null;
};
const isSupportScenarioPath = (pathname) =>
  pathname.startsWith('/api/content/') ||
  pathname.startsWith('/api/notifications') ||
  pathname.startsWith('/api/support/');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const apiRequests = [];
const apiResponses = [];
const apiFailures = [];
const unexpectedRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const requestRecords = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const record = {
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname),
    startedAt: Date.now(),
  };
  requestRecords.set(request, record);
  apiRequests.push(record);
  if (isSupportScenarioPath(url.pathname) && !record.operationId) unexpectedRequests.push(record);
  if (url.origin !== originUrl) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const task = (async () => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    const request = response.request();
    requestsWithResponse.add(request);
    const record = requestRecords.get(request);
    apiResponses.push({
      method: request.method(),
      path: url.pathname,
      operationId: record?.operationId ?? null,
      status: response.status(),
      fromServiceWorker: await response.fromServiceWorker(),
      elapsedMs: Date.now() - (record?.startedAt ?? Date.now()),
    });
  })();
  responseTasks.push(task);
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiFailures.push({
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname),
    failure: request.failure()?.errorText ?? 'unknown',
    hadResponse: requestsWithResponse.has(request),
  });
});

const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};

try {
  await page.goto(`${originUrl}/w/auth/login`, {
    waitUntil: 'domcontentloaded',
  });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.locator('[data-testid="dev-preview-controls"]').waitFor();
  const expandPreview = page.getByRole('button', {
    name: 'Mở công cụ xem trước',
  });
  if (await expandPreview.count()) await expandPreview.click();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'The local preview service worker must control the page.',
  );

  await page.locator('#preview-domain').selectOption('support');
  await page.locator('#preview-state').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('support.loading').waitFor();
  await page.locator('#preview-persona').selectOption('support');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page
    .locator('[data-testid="dev-preview-controls"]')
    .getByText('support@vittrade.local')
    .waitFor();
  await page.waitForURL('**/w/home');
  const personaAndScenarioApplied = true;
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();

  const reads = [];
  const runRead = async ({ operationId, route, loadingMessage, loadedContent, screenshotPath }) => {
    const readStartedAt = Date.now();
    const responsePromise = page.waitForResponse(
      (response) =>
        operationFor(response.request().method(), new URL(response.url()).pathname) === operationId,
    );
    await navigate(route);
    const loadingLocator = page.getByText(loadingMessage, { exact: true });
    await loadingLocator.waitFor({ state: 'visible' });
    const loadingVisibleAt = Date.now();
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const response = await responsePromise;
    const responseReceivedAt = Date.now();
    await loadedContent.waitFor({ state: 'visible' });
    return {
      operationId,
      route,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      loadingVisibleBeforeResponse: true,
      loadingVisibleMsBeforeResponse: responseReceivedAt - loadingVisibleAt,
      requestToResponseMs: responseReceivedAt - readStartedAt,
    };
  };

  // The authenticated shell prefetches this shared query, so inspect it before its delay settles.
  reads.push(
    await runRead({
      operationId: 'listNotifications',
      route: '/w/notifications',
      loadingMessage: 'Đang tải thông báo…',
      loadedContent: page.getByText('Lệnh đã khớp', { exact: true }),
      screenshotPath: screenshotPaths.notifications,
    }),
  );
  reads.push(
    await runRead({
      operationId: 'listNews',
      route: '/w/news',
      loadingMessage: 'Đang tải nội dung…',
      loadedContent: page.getByRole('heading', {
        name: 'Phí giao dịch 0% cho BTC/USDT',
      }),
      screenshotPath: screenshotPaths.news,
    }),
  );
  reads.push(
    await runRead({
      operationId: 'getHelpCenter',
      route: '/w/support/help',
      loadingMessage: 'Đang tải help center…',
      loadedContent: page.getByRole('heading', {
        name: 'Cách tạo tài khoản VitTrade',
      }),
      screenshotPath: screenshotPaths.help,
    }),
  );
  reads.push(
    await runRead({
      operationId: 'listSupportTickets',
      route: '/w/support',
      loadingMessage: 'Đang tải ticket…',
      loadedContent: page.getByRole('heading', {
        name: 'Rút USDT bị pending quá lâu',
      }),
      screenshotPath: screenshotPaths.tickets,
    }),
  );

  await Promise.all(responseTasks);
  const scenarioResponses = apiResponses.filter((response) => response.operationId);
  const scenarioRequests = apiRequests.filter((request) => request.operationId);
  const scopedFailures = apiFailures.filter((failure) => failure.operationId);
  const transportFailures = scopedFailures.filter((failure) => !failure.hadResponse);
  const observedOperationIds = [
    ...new Set(scenarioResponses.map((response) => response.operationId)),
  ];
  const requestCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      scenarioRequests.filter((request) => request.operationId === id).length,
    ]),
  );
  const excludedMutationOperationIds = ['markNotificationRead', 'createSupportTicket'];
  const excludedMutationRequestCount = scenarioRequests.filter((request) =>
    excludedMutationOperationIds.includes(request.operationId),
  ).length;
  const responseCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      scenarioResponses.filter((response) => response.operationId === id).length,
    ]),
  );
  assert.deepEqual(observedOperationIds.sort(), [...operationIds].sort());
  assert.deepEqual(requestCounts, {
    listNews: 1,
    listNotifications: 1,
    getHelpCenter: 1,
    listSupportTickets: 1,
  });
  assert.deepEqual(responseCounts, requestCounts);
  assert.equal(scenarioResponses.length, 4);
  assert.equal(
    scenarioResponses.every((response) => response.status === 200 && response.fromServiceWorker),
    true,
  );
  assert.equal(
    reads.every((read) => read.loadingVisibleBeforeResponse && read.status === 200),
    true,
  );
  assert.equal(excludedMutationRequestCount, 0);
  assert.equal(unexpectedRequests.length, 0);
  assert.equal(transportFailures.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);
  assert.equal(new URL(page.url()).pathname, '/w/support');

  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'support.loading',
      status: 'passed',
      persona: 'support (development preview)',
      operationIds,
      observedOperationIds,
      expectedDomainOperationCount: operationIds.length,
      coverage: 'full_scenario_operations_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      personaAndScenarioApplied,
      allObservedResponsesFromServiceWorker: scenarioResponses.every(
        (response) => response.fromServiceWorker,
      ),
      observedScenarioResponseCount: scenarioResponses.length,
      localMockMutationCount: 0,
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins].sort(),
      unexpectedScenarioRequestCount: unexpectedRequests.length,
      pageErrorCount: pageErrors.length,
      scenarioTransportFailureCount: transportFailures.length,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      completedAt: new Date().toISOString(),
      scenarioRequestCount: scenarioRequests.length,
      scenarioResponseCount: scenarioResponses.length,
      scenarioOperationRequestCounts: requestCounts,
      scenarioOperationResponseCounts: responseCounts,
      readOperations: reads,
      excludedMutationOperationIds,
      excludedMutationRequestCount,
      externalApiOriginCount: externalApiOrigins.size,
      scenarioTransportFailureCount: transportFailures.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      loadingVisibleBeforeEachResponse: reads.every((read) => read.loadingVisibleBeforeResponse),
      resolvedContentVisibleAfterEachResponse: true,
      finalRoute: new URL(page.url()).pathname,
      responses: scenarioResponses,
    },
    apiRequests,
    apiResponses,
    apiFailures,
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([name, file]) => [name, path.basename(file)]),
    ),
    sourceHashes,
    limitations: [
      'The fixed 2,000 ms wait is injected by the local MSW scenario handler and is not backend latency or an SLO measurement.',
      'This scenario covers four collection GETs; notification-read and ticket-create mutations are deliberately not sent while reads are pending.',
      'MSW does not establish backend authorization, persistence, staging behavior or user acceptance.',
    ],
  };
  await fs.writeFile(
    reportPath,
    await prettier.format(`${JSON.stringify(report)}\n`, { parser: 'json' }),
    'utf8',
  );
  console.log(
    JSON.stringify(
      {
        reportPath: path.relative(root, reportPath),
        screenshotPaths: Object.fromEntries(
          Object.entries(screenshotPaths).map(([name, file]) => [name, path.relative(root, file)]),
        ),
        observedOperationIds,
        reads,
        totalFlowMs: report.measurements.totalFlowMs,
        sourceHashCount: Object.keys(sourceHashes).length,
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  await browser.close();
}

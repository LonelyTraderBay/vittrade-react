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
  news: path.join(directory, `preview-support-error-news-${date}${artifactSuffix}.png`),
  notifications: path.join(
    directory,
    `preview-support-error-notifications-${date}${artifactSuffix}.png`,
  ),
  help: path.join(directory, `preview-support-error-help-${date}${artifactSuffix}.png`),
  tickets: path.join(directory, `preview-support-error-tickets-${date}${artifactSuffix}.png`),
};
const reportPath = path.join(
  directory,
  `support-error-browser-check-${date}${artifactSuffix}.json`,
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
  'src/shared/ui/ErrorState.tsx',
  'src/shared/api/app-client.ts',
  'src/shared/api/client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-support-error-browser-check.mjs',
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
const expectedAttemptsPerCycle = Number(process.env.SUPPORT_ERROR_EXPECTED_ATTEMPTS ?? 3);
assert.ok(Number.isInteger(expectedAttemptsPerCycle) && expectedAttemptsPerCycle > 0);
await page.addInitScript(() => {
  const originalFetch = window.fetch.bind(window);
  Object.defineProperty(window, '__supportTransportAttempts', {
    configurable: true,
    value: [],
  });
  Object.defineProperty(window, '__supportTransportFailureEnabled', {
    configurable: true,
    writable: true,
    value: false,
  });
  window.fetch = async (input, init) => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const request = input instanceof Request ? input : null;
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const url = new URL(requestUrl, window.location.href);
    const operationByPath = {
      '/api/content/news': 'listNews',
      '/api/notifications': 'listNotifications',
      '/api/support/help': 'getHelpCenter',
      '/api/support/tickets': 'listSupportTickets',
    };
    const operationId = operationByPath[url.pathname];
    if (
      window.__supportTransportFailureEnabled &&
      url.origin === window.location.origin &&
      method === 'GET' &&
      operationId
    ) {
      window.__supportTransportAttempts.push({
        method,
        path: url.pathname,
        operationId,
        errorText: 'Failed to fetch',
        source: 'runner-scoped pre-network fetch rejection',
      });
      throw new TypeError('Failed to fetch');
    }
    return originalFetch(input, init);
  };
});

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
      requestStartedAt: record?.startedAt,
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

  await page.locator('#preview-persona').selectOption('support');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page
    .locator('[data-testid="dev-preview-controls"]')
    .getByText('support@vittrade.local')
    .waitFor();
  await page.waitForURL('**/w/home');
  await page.locator('#preview-domain').selectOption('support');
  await page.locator('#preview-state').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('support.error').waitFor();
  const personaAndScenarioApplied = true;
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();
  const failureInjectionEnabledAt = Date.now();
  await page.evaluate(() => {
    window.__supportTransportFailureEnabled = true;
  });

  const reads = [];
  const injectedTransportAttempts = () =>
    page.evaluate(() => [...window.__supportTransportAttempts]);
  const runErrorRead = async ({ operationId, route, successContent, screenshotPath }) => {
    const attemptCount = () =>
      page.evaluate(
        (targetOperationId) =>
          window.__supportTransportAttempts.filter(
            (attempt) => attempt.operationId === targetOperationId,
          ).length,
        operationId,
      );
    const attemptStartCount = await attemptCount();
    const waitForAttemptCount = (count) =>
      page.waitForFunction(
        ({ targetOperationId, targetCount }) =>
          window.__supportTransportAttempts.filter(
            (attempt) => attempt.operationId === targetOperationId,
          ).length >= targetCount,
        { targetOperationId: operationId, targetCount: count },
      );
    await navigate(route);
    const initialTarget = attemptStartCount + expectedAttemptsPerCycle;
    await waitForAttemptCount(initialTarget);
    await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
    const retryButton = page.getByRole('button', { name: 'Thử lại' });
    await retryButton.waitFor({ state: 'visible' });
    const initialAttemptCount = (await attemptCount()) - attemptStartCount;
    assert.equal(initialAttemptCount, expectedAttemptsPerCycle);
    assert.equal(
      await successContent.count(),
      0,
      `${operationId} must not display stale success content while failed.`,
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const retryStartedAt = Date.now();
    await retryButton.click();
    const finalTarget = initialTarget + expectedAttemptsPerCycle;
    await waitForAttemptCount(finalTarget);
    await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Thử lại' }).waitFor({ state: 'visible' });
    assert.equal(new URL(page.url()).pathname, route, 'Retry must preserve the route.');
    assert.equal(await successContent.count(), 0, 'Retry must not reveal success content.');

    const attempts = await page.evaluate(() => [...window.__supportTransportAttempts]);
    const operationAttempts = attempts.filter((attempt) => attempt.operationId === operationId);
    const operationRequests = apiRequests.filter((request) => request.operationId === operationId);
    const operationResponses = apiResponses.filter(
      (response) => response.operationId === operationId,
    );
    const operationRequestsAfterInjection = operationRequests.filter(
      (request) => request.startedAt >= failureInjectionEnabledAt,
    );
    const operationResponsesAfterInjection = operationResponses.filter(
      (response) => response.requestStartedAt >= failureInjectionEnabledAt,
    );
    assert.equal(operationAttempts.length - attemptStartCount, expectedAttemptsPerCycle * 2);
    assert.equal(operationRequestsAfterInjection.length, 0);
    assert.equal(operationResponsesAfterInjection.length, 0);
    return {
      operationId,
      route,
      initialFetchAttempts: initialAttemptCount,
      manualRetryFetchAttempts: operationAttempts.length - attemptStartCount - initialAttemptCount,
      totalFetchAttempts: operationAttempts.length - attemptStartCount,
      preRouteShellFetchAttempts: attemptStartCount,
      httpRequestCountAfterFailureInjection: operationRequestsAfterInjection.length,
      httpResponseCountAfterFailureInjection: operationResponsesAfterInjection.length,
      preInjectionHttpRequestCount:
        operationRequests.length - operationRequestsAfterInjection.length,
      preInjectionHttpResponseCount:
        operationResponses.length - operationResponsesAfterInjection.length,
      failureInjectedBeforeNetwork: true,
      errorStateVisibleAfterRetry: true,
      retryRoutePreserved: true,
      successContentHidden: true,
      manualRetryFlowMs: Date.now() - retryStartedAt,
      screenshot: path.basename(screenshotPath),
    };
  };

  reads.push(
    await runErrorRead({
      operationId: 'listNews',
      route: '/w/news',
      successContent: page.getByRole('heading', {
        name: 'Phí giao dịch 0% cho BTC/USDT',
      }),
      screenshotPath: screenshotPaths.news,
    }),
  );
  reads.push(
    await runErrorRead({
      operationId: 'listNotifications',
      route: '/w/notifications',
      successContent: page.getByText('Lệnh đã khớp', { exact: true }),
      screenshotPath: screenshotPaths.notifications,
    }),
  );
  reads.push(
    await runErrorRead({
      operationId: 'getHelpCenter',
      route: '/w/support/help',
      successContent: page.getByRole('heading', {
        name: 'Cách tạo tài khoản VitTrade',
      }),
      screenshotPath: screenshotPaths.help,
    }),
  );
  reads.push(
    await runErrorRead({
      operationId: 'listSupportTickets',
      route: '/w/support',
      successContent: page.getByRole('heading', {
        name: 'Rút USDT bị pending quá lâu',
      }),
      screenshotPath: screenshotPaths.tickets,
    }),
  );

  await Promise.all(responseTasks);
  const transportAttempts = await injectedTransportAttempts();
  const scenarioAttempts = transportAttempts.filter((attempt) =>
    operationIds.includes(attempt.operationId),
  );
  const scenarioResponses = apiResponses.filter((response) =>
    operationIds.includes(response.operationId),
  );
  const scenarioRequests = apiRequests.filter((request) =>
    operationIds.includes(request.operationId),
  );
  const scenarioMutations = apiRequests.filter((request) =>
    ['markNotificationRead', 'createSupportTicket'].includes(request.operationId),
  );
  const scopedFailures = apiFailures.filter((failure) =>
    operationIds.includes(failure.operationId),
  );
  const transportFailures = scopedFailures.filter((failure) => !failure.hadResponse);
  const observedOperationIds = [...new Set(scenarioAttempts.map((attempt) => attempt.operationId))];
  const scenarioFetchAttemptCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      scenarioAttempts.filter((attempt) => attempt.operationId === id).length,
    ]),
  );
  const excludedMutationOperationIds = ['markNotificationRead', 'createSupportTicket'];
  const excludedMutationRequestCount = scenarioMutations.length;
  const requestCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      scenarioRequests.filter((request) => request.operationId === id).length,
    ]),
  );
  const responseCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      scenarioResponses.filter((response) => response.operationId === id).length,
    ]),
  );
  const postInjectionRequestCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      scenarioRequests.filter(
        (request) => request.operationId === id && request.startedAt >= failureInjectionEnabledAt,
      ).length,
    ]),
  );
  const postInjectionResponseCounts = Object.fromEntries(
    operationIds.map((id) => [
      id,
      scenarioResponses.filter(
        (response) =>
          response.operationId === id && response.requestStartedAt >= failureInjectionEnabledAt,
      ).length,
    ]),
  );
  const preRouteShellFetchAttempts = Object.fromEntries(
    reads.map((read) => [read.operationId, read.preRouteShellFetchAttempts]),
  );
  assert.deepEqual(observedOperationIds.sort(), [...operationIds].sort());
  assert.deepEqual(
    Object.fromEntries(
      reads.map((read) => [
        read.operationId,
        [read.initialFetchAttempts, read.manualRetryFetchAttempts],
      ]),
    ),
    Object.fromEntries(
      operationIds.map((id) => [id, [expectedAttemptsPerCycle, expectedAttemptsPerCycle]]),
    ),
  );
  assert.deepEqual(
    Object.fromEntries(
      operationIds
        .filter((id) => id !== 'listNotifications')
        .map((id) => [id, preRouteShellFetchAttempts[id]]),
    ),
    Object.fromEntries(
      operationIds.filter((id) => id !== 'listNotifications').map((id) => [id, 0]),
    ),
  );
  assert.ok(preRouteShellFetchAttempts.listNotifications <= expectedAttemptsPerCycle);
  assert.deepEqual(
    scenarioFetchAttemptCounts,
    Object.fromEntries(
      operationIds.map((id) => [id, expectedAttemptsPerCycle * 2 + preRouteShellFetchAttempts[id]]),
    ),
  );
  assert.deepEqual(
    postInjectionRequestCounts,
    Object.fromEntries(operationIds.map((id) => [id, 0])),
  );
  assert.deepEqual(
    postInjectionResponseCounts,
    Object.fromEntries(operationIds.map((id) => [id, 0])),
  );
  assert.equal(
    scenarioAttempts.length,
    operationIds.length * expectedAttemptsPerCycle * 2 +
      Object.values(preRouteShellFetchAttempts).reduce((total, count) => total + count, 0),
  );
  assert.equal(
    scenarioAttempts.every(
      (attempt) => attempt.source === 'runner-scoped pre-network fetch rejection',
    ),
    true,
  );
  assert.equal(scopedFailures.length, 0);
  assert.equal(
    reads.every((read) => read.errorStateVisibleAfterRetry),
    true,
  );
  assert.equal(excludedMutationRequestCount, 0);
  assert.equal(unexpectedRequests.length, 0);
  assert.equal(
    transportFailures.length,
    0,
    'Injected failures must not dispatch network requests.',
  );
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
      id: 'support.error',
      status: 'passed',
      persona: 'support (development preview)',
      operationIds,
      observedOperationIds,
      expectedDomainOperationCount: operationIds.length,
      coverage: 'full_scenario_operations_browser_observed_transport_failure',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      personaAndScenarioApplied,
      failureInjection: 'window.fetch rejects targeted GETs before network dispatch',
      allObservedFailuresInjectedBeforeNetwork: scenarioAttempts.every(
        (attempt) => attempt.source === 'runner-scoped pre-network fetch rejection',
      ),
      observedScenarioResponseCount: scenarioResponses.length,
      injectedTransportFailureCount: scenarioAttempts.length,
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
      scenarioFetchAttemptCount: scenarioAttempts.length,
      scenarioOperationRequestCounts: requestCounts,
      scenarioOperationResponseCounts: responseCounts,
      scenarioOperationRequestsAfterFailureInjection: postInjectionRequestCounts,
      scenarioOperationResponsesAfterFailureInjection: postInjectionResponseCounts,
      scenarioOperationFetchAttemptCounts: scenarioFetchAttemptCounts,
      preRouteShellFetchAttempts,
      readOperations: reads,
      excludedMutationOperationIds,
      excludedMutationRequestCount,
      externalApiOriginCount: externalApiOrigins.size,
      scenarioTransportFailureCount: scenarioAttempts.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      errorStateAndRetryVisibleAfterEachReadFailure: reads.every(
        (read) => read.errorStateVisibleAfterRetry,
      ),
      staleSuccessContentHiddenAfterEachFailure: reads.every((read) => read.successContentHidden),
      failureInjectedBeforeNetwork: scenarioAttempts.every(
        (attempt) => attempt.source === 'runner-scoped pre-network fetch rejection',
      ),
      httpRequestCountForScenarioOperations: scenarioRequests.length,
      httpResponseCountForScenarioOperations: scenarioResponses.length,
      noHttpDispatchAfterFailureInjection: Object.values(postInjectionRequestCounts).every(
        (count) => count === 0,
      ),
      finalRoute: new URL(page.url()).pathname,
      responses: scenarioResponses,
      injectedTransportAttempts: scenarioAttempts,
    },
    apiRequests,
    apiResponses,
    apiFailures,
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([name, file]) => [name, path.basename(file)]),
    ),
    sourceHashes,
    retryPolicyObservation: {
      expectedFetchAttemptsPerQueryExecution: expectedAttemptsPerCycle,
      preRouteShellFetchAttempts,
      initialFailureAttemptsByOperation: Object.fromEntries(
        reads.map((read) => [read.operationId, read.initialFetchAttempts]),
      ),
      manualRetryAttemptsByOperation: Object.fromEntries(
        reads.map((read) => [read.operationId, read.manualRetryFetchAttempts]),
      ),
      totalAttemptsByOperation: scenarioFetchAttemptCounts,
    },
    limitations: [
      'Support OpenAPI declares no 5xx response; the runner injects a TypeError before network dispatch and does not create an HTTP status or response.',
      'The observed retry fan-out is local HTTP-client and React Query behavior; it is not a production retry recommendation or backend measurement.',
      'This scenario covers four collection GETs; notification-read and ticket-create mutations are not sent because a failed write can have an unknown outcome.',
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

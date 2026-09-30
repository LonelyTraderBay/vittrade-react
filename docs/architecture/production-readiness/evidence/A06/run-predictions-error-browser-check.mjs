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
const scenarioOperationIds = [
  'listPredictionEvents',
  'getPredictionEvent',
  'listPredictionPositions',
  'listPredictionRewards',
  'listPredictionLeaderboard',
  'listPredictionActivity',
  'placePredictionOrder',
  'getPredictionOrderReceipt',
];
const operationIds = ['listPredictionEvents'];
const pages = [
  { operationId: 'listPredictionEvents', route: '/w/markets/predictions', key: 'events' },
];
const sourceFiles = [
  'contracts/openapi/predictions.yaml',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/prediction-fixtures.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/predictions/api/predictions-api.ts',
  'src/features/predictions/model/prediction-queries.ts',
  'src/features/predictions/model/prediction-types.ts',
  'src/features/predictions/pages/PredictionContractPages.tsx',
  'src/features/predictions/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/config/env.ts',
  'src/shared/ui/ErrorState.tsx',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-predictions-error-browser-check.mjs',
];
const hash = async (file) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, file)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await hash(file)])),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const requestCounts = Object.fromEntries(
  [...operationIds, 'placePredictionOrder'].map((id) => [id, 0]),
);
const requests = [];
const failures = [];
const pageErrors = [];
const externalApiOrigins = new Set();
const observations = {};
const screenshotPaths = Object.fromEntries(
  pages.map(({ key }) => [
    key,
    path.join(directory, `preview-predictions-error-${key}-fresh-${date}.png`),
  ]),
);
const reportPath = path.join(directory, `predictions-error-browser-check-fresh-${date}.json`);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const operationFor = (method, pathname) => {
  if (method === 'GET' && pathname.endsWith('/api/predictions/events'))
    return 'listPredictionEvents';
  if (method === 'GET' && /\/api\/predictions\/events\/[^/]+$/.test(pathname)) {
    return 'getPredictionEvent';
  }
  if (method === 'GET' && pathname.endsWith('/api/predictions/positions')) {
    return 'listPredictionPositions';
  }
  if (method === 'GET' && pathname.endsWith('/api/predictions/rewards'))
    return 'listPredictionRewards';
  if (method === 'GET' && pathname.endsWith('/api/predictions/leaderboard')) {
    return 'listPredictionLeaderboard';
  }
  if (method === 'GET' && pathname.endsWith('/api/predictions/activity'))
    return 'listPredictionActivity';
  if (method === 'POST' && pathname.endsWith('/api/predictions/orders'))
    return 'placePredictionOrder';
  if (method === 'GET' && /\/api\/predictions\/orders\/[^/]+$/.test(pathname)) {
    return 'getPredictionOrderReceipt';
  }
  return undefined;
};

page.on('request', (request) => {
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    (request.headers().accept?.includes('json') || url.pathname.includes('/api/'))
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/')) return;
  const operationId = operationFor(request.method(), url.pathname);
  if (operationId) requestCounts[operationId] += 1;
  requests.push({
    method: request.method(),
    path: `${url.pathname}${url.search}`,
    pageRoute: new URL(page.url()).pathname,
    operationId: operationId ?? null,
  });
});
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  failures.push({
    method: request.method(),
    path: `${url.pathname}${url.search}`,
    pageRoute: new URL(page.url()).pathname,
    operationId: operationFor(request.method(), url.pathname) ?? null,
    error: request.failure()?.errorText ?? 'unknown',
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};

const startedAt = Date.now();
let serviceWorkerControlled = false;

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  if (!(await page.getByLabel('Miền API').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.error').waitFor();

  if (!(await page.getByLabel('Tài khoản xem trước').count())) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  const collapse = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapse.count()) await collapse.click();
  serviceWorkerControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by its local service worker.',
  );

  for (const item of pages) {
    const requestOffset = requests.length;
    const failureOffset = failures.length;
    await navigate(item.route);
    await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
    const retry = page.getByRole('button', { name: 'Thử lại', exact: true });
    await retry.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');
    const initialRequests = requests
      .slice(requestOffset)
      .filter(
        (request) => request.pageRoute === item.route && request.operationId === item.operationId,
      );
    const initialFailures = failures
      .slice(failureOffset)
      .filter(
        (failure) => failure.pageRoute === item.route && failure.operationId === item.operationId,
      );
    const initialCountsByPath = Object.fromEntries(
      [...new Set(initialRequests.map(({ path }) => path))].map((path) => [
        path,
        initialRequests.filter((request) => request.path === path).length,
      ]),
    );
    assert.ok(
      initialRequests.length > 0,
      `${item.operationId} must be requested from ${item.route}.`,
    );
    assert.equal(initialFailures.length, initialRequests.length);
    assert.ok(
      Object.values(initialCountsByPath).every((count) => count === 6),
      `${item.operationId} should make six transport attempts per query: three HTTP-client attempts, then one React Query retry of those three attempts.`,
    );
    assert.equal(
      await page
        .getByText('Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.', { exact: true })
        .count(),
      1,
      `${item.operationId} should explain the recoverable error.`,
    );
    assert.equal(
      await page.getByText('Không có prediction market phù hợp.', { exact: true }).count(),
      0,
    );
    assert.equal(
      await page.getByText('Bitcoin reaches $150K before July 2026?', { exact: true }).count(),
      0,
      'A failed read must not present local fixture data as success.',
    );

    const retryOffset = requests.length;
    const retryFailureOffset = failures.length;
    await retry.click();
    const routeRequestTotal = () =>
      requests
        .slice(retryOffset)
        .filter(
          (request) => request.pageRoute === item.route && request.operationId === item.operationId,
        ).length;
    const deadline = Date.now() + 15_000;
    while (routeRequestTotal() < 2 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.ok(routeRequestTotal() >= 2, `${item.operationId} Retry should issue another request.`);
    await page.waitForLoadState('networkidle');
    await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
    const retryRequests = requests
      .slice(retryOffset)
      .filter(
        (request) => request.pageRoute === item.route && request.operationId === item.operationId,
      );
    const retryFailures = failures
      .slice(retryFailureOffset)
      .filter(
        (failure) => failure.pageRoute === item.route && failure.operationId === item.operationId,
      );
    const retryCountsByPath = Object.fromEntries(
      [...new Set(retryRequests.map(({ path }) => path))].map((path) => [
        path,
        retryRequests.filter((request) => request.path === path).length,
      ]),
    );
    assert.equal(retryFailures.length, retryRequests.length);
    assert.ok(
      Object.values(retryCountsByPath).some((count) => count === 6),
      `${item.operationId} Retry should repeat the six transport attempts for the selected query.`,
    );
    assert.ok(Object.values(retryCountsByPath).every((count) => count === 6));
    await page.screenshot({ path: screenshotPaths[item.key], fullPage: true });
    observations[item.operationId] = {
      route: item.route,
      visibleErrorTitle: true,
      visibleErrorMessage: true,
      visibleRetryAction: true,
      emptyStateOrFixtureDataVisible: false,
      initialQueryAttemptsByPath: initialCountsByPath,
      manualRetryAttemptsByPath: retryCountsByPath,
      initialTransportAttemptCount: initialRequests.length,
      manualRetryTransportAttemptCount: retryRequests.length,
      totalTransportAttemptCount: initialRequests.length + retryRequests.length,
      contractHttpStatusInvented: false,
    };
  }

  assert.ok(operationIds.every((id) => requestCounts[id] > 0));
  assert.equal(requestCounts.placePredictionOrder, 0);
  assert.equal(
    failures.filter((failure) => failure.path.startsWith('/api/predictions/')).length,
    requests.filter((request) => request.path.startsWith('/api/predictions/')).length,
  );
  assert.ok(
    failures
      .filter((failure) => failure.path.startsWith('/api/predictions/'))
      .every((failure) => failure.error === 'net::ERR_FAILED'),
    'Prediction reads should fail at transport without an invented HTTP status.',
  );
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'predictions.error',
      status: 'passed',
      persona: 'developer (preview only)',
      route: pages[0].route,
      additionalRoutes: pages.slice(1).map(({ route }) => route),
      operationIds: scenarioOperationIds,
      observedOperationIds: operationIds,
      expectedDomainOperationCount: 8,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      predictionHttpResponsesReceived: 0,
      allObservedPredictionFailuresAreTransportLevel: true,
      transportFailureNoHttpResponse: true,
      localPreviewScenarioOnly: true,
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: requests.length,
      predictionApiRequestCount: Object.values(requestCounts).reduce(
        (sum, count) => sum + count,
        0,
      ),
      requestCounts,
      predictionReadTransportFailureCount: failures.filter((failure) =>
        failure.path.startsWith('/api/predictions/'),
      ).length,
      predictionMutationCount: requestCounts.placePredictionOrder,
      externalApiOriginCount: externalApiOrigins.size,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      pages: observations,
      requests,
      requestFailures: failures,
      externalApiOrigins: [...externalApiOrigins],
      pageErrors,
    },
    requestTrace: requests,
    sourceHashes,
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([key, file]) => [key, path.basename(file)]),
    ),
    limitations: [
      'Predictions OpenAPI declares no 5xx responses, so the preview represents read failures as statusless transport failures; this does not simulate a backend HTTP 5xx.',
      'The observed listPredictionEvents query made six local transport attempts before showing the error and six more after manual Retry: three attempts in the HTTP client multiplied by one React Query retry. Other Predictions reads were not exercised in this scenario.',
      'The order mutation is deliberately not submitted because a lost write response would have an unknown business outcome; its count must remain zero.',
      'This verifies local browser error and retry behavior only; it does not prove backend behavior, persistence, staging or user acceptance.',
    ],
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  await fs.writeFile(
    reportPath,
    await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
      ...prettierOptions,
      parser: 'json',
    }),
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  console.error(
    JSON.stringify(
      {
        currentUrl: page.url(),
        requestCounts,
        requests,
        failures,
        pageErrors,
        bodyText: await page
          .locator('body')
          .innerText()
          .catch(() => ''),
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await context.close();
  await browser.close();
}

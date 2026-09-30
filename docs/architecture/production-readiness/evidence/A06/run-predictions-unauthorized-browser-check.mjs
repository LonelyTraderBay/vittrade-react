import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(evidenceDirectory, '../../../../../');
const origin = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname),
  'Only a loopback preview is allowed.',
);
assert.equal(origin.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const suffix = process.env.EVIDENCE_RUN_SUFFIX || 'contract-scoped';
assert.match(suffix, /^[a-z0-9-]+$/i, 'Evidence run suffix must be alphanumeric or hyphenated.');
const eventsScreenshotPath = path.join(
  evidenceDirectory,
  `preview-predictions-unauthorized-events-${date}-${suffix}.png`,
);
const portfolioScreenshotPath = path.join(
  evidenceDirectory,
  `preview-predictions-unauthorized-portfolio-${date}-${suffix}.png`,
);
const reportPath = path.join(
  evidenceDirectory,
  `predictions-unauthorized-browser-check-${date}-${suffix}.json`,
);

const sourceFiles = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/predictions.yaml',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/predictions/api/predictions-api.ts',
  'src/features/predictions/model/prediction-queries.ts',
  'src/features/predictions/pages/PredictionContractPages.tsx',
  'src/features/predictions/routes.ts',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-predictions-unauthorized-browser-check.mjs',
];
const sha256 = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(repositoryRoot, relativePath)))
    .digest('hex');
const sourceHashes = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await sha256(file)])),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).trim();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const externalApiOrigins = new Set();
const apiResponses = [];
const predictionRequests = [];
const predictionResponses = [];
const predictionRequestFailures = [];
const authRefreshContractFixtures = [];
const pageErrors = [];

page.on('request', (request) => {
  const url = new URL(request.url());
  if (
    url.protocol.startsWith('http') &&
    url.origin !== originUrl &&
    url.pathname.startsWith('/api/')
  ) {
    externalApiOrigins.add(url.origin);
  }
  if (!url.pathname.startsWith('/api/predictions/')) return;
  const operationId =
    url.pathname === '/api/predictions/events'
      ? 'listPredictionEvents'
      : url.pathname === '/api/predictions/positions'
        ? 'listPredictionPositions'
        : null;
  predictionRequests.push({
    method: request.method(),
    path: `${url.pathname}${url.search}`,
    operationId,
  });
});

page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  const responseEvidence = {
    method: response.request().method(),
    path: `${url.pathname}${url.search}`,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  };
  apiResponses.push(responseEvidence);
  if (!url.pathname.startsWith('/api/predictions/')) return;
  const operationId =
    url.pathname === '/api/predictions/events'
      ? 'listPredictionEvents'
      : url.pathname === '/api/predictions/positions'
        ? 'listPredictionPositions'
        : null;
  predictionResponses.push({
    method: responseEvidence.method,
    path: responseEvidence.path,
    operationId,
    status: responseEvidence.status,
    fromServiceWorker: responseEvidence.fromServiceWorker,
  });
});

page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/predictions/')) {
    predictionRequestFailures.push({
      method: request.method(),
      path: `${url.pathname}${url.search}`,
      error: request.failure()?.errorText ?? 'unknown',
    });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.addInitScript(() => {
  const originalFetch = window.fetch.bind(window);
  const trace = [];
  Object.defineProperty(window, '__vittradeAuthRefreshContractFixtures', {
    configurable: false,
    value: trace,
  });
  window.fetch = async (input, init) => {
    const inputUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(inputUrl, window.location.href);
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    if (url.pathname !== '/api/auth/refresh' || method !== 'POST') {
      return originalFetch(input, init);
    }
    const fixture = {
      method,
      path: url.pathname,
      status: 200,
      body: null,
      source: 'runner-local contract fixture; request not sent to service worker or backend',
    };
    trace.push(fixture);
    return new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

async function openPreviewControlsIfNeeded() {
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
}

async function applyPredictionsUnauthorizedScenario() {
  await openPreviewControlsIfNeeded();
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.unauthorized').waitFor();
}

async function signInDeveloperThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
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

async function exerciseUnauthorizedRoute({ route, operationId, screenshotPath }) {
  const responseStart = predictionResponses.length;
  await navigateWithinSpa(route);
  await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
  await page.getByTestId('auth-email').waitFor();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const responses = predictionResponses.slice(responseStart);
  const staleProtectedRouteVisible =
    route === '/w/markets/predictions'
      ? (await page.getByText('Contract-first prediction data', { exact: true }).count()) > 0
      : (await page.getByText('Prediction portfolio', { exact: true }).count()) > 0;
  assert.equal(responses.length, 1, `${operationId} should have one observed response.`);
  assert.equal(responses[0].method, 'GET');
  assert.equal(responses[0].operationId, operationId);
  assert.equal(responses[0].status, 401);
  assert.equal(responses[0].fromServiceWorker, true);
  assert.equal(staleProtectedRouteVisible, false);

  return {
    protectedRoute: route,
    resultRoute: new URL(page.url()).pathname,
    response: responses[0],
    staleProtectedRouteVisible,
  };
}

try {
  await page.goto(`${originUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await applyPredictionsUnauthorizedScenario();
  await signInDeveloperThroughPreview();

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    'Preview must be controlled by its local service worker.',
  );

  const eventsRoute = await exerciseUnauthorizedRoute({
    route: '/w/markets/predictions',
    operationId: 'listPredictionEvents',
    screenshotPath: eventsScreenshotPath,
  });
  await signInDeveloperThroughPreview();
  const portfolioRoute = await exerciseUnauthorizedRoute({
    route: '/w/markets/predictions/portfolio',
    operationId: 'listPredictionPositions',
    screenshotPath: portfolioScreenshotPath,
  });

  const refreshFixtures = await page.evaluate(
    () => window.__vittradeAuthRefreshContractFixtures ?? [],
  );
  authRefreshContractFixtures.push(...refreshFixtures);
  const unsupportedPredictionRequests = predictionRequests.filter(
    (request) => !['listPredictionEvents', 'listPredictionPositions'].includes(request.operationId),
  );
  const observedOperationIds = [
    ...new Set(predictionResponses.map((response) => response.operationId)),
  ];
  assert.deepEqual(observedOperationIds.sort(), [
    'listPredictionEvents',
    'listPredictionPositions',
  ]);
  assert.equal(unsupportedPredictionRequests.length, 0);
  assert.equal(authRefreshContractFixtures.length, 2);
  assert.equal(
    authRefreshContractFixtures.every((fixture) => fixture.status === 200 && fixture.body === null),
    true,
  );
  assert.equal(apiResponses.length > 0, true);
  assert.equal(
    apiResponses.every((response) => response.fromServiceWorker),
    true,
  );
  assert.deepEqual(predictionRequestFailures, []);
  assert.equal(externalApiOrigins.size, 0);
  assert.deepEqual(pageErrors, []);

  const report = {
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'predictions.unauthorized',
      status: 'passed',
      persona: 'developer (preview only)',
      operationIds: [
        'listPredictionEvents',
        'getPredictionEvent',
        'listPredictionPositions',
        'listPredictionRewards',
        'listPredictionLeaderboard',
        'listPredictionActivity',
        'placePredictionOrder',
        'getPredictionOrderReceipt',
      ],
      observedOperationIds,
      contractUnauthorizedOperationIds: ['listPredictionEvents', 'listPredictionPositions'],
      expectedDomainOperationCount: 8,
      coverage: 'representative_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      observedNetworkApiResponseCount: apiResponses.length,
      runnerInterceptedAuthRefreshResponsesAreNotNetworkResponses: true,
      authRefreshContractFixtures,
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins],
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      networkApiResponseCount: apiResponses.length,
      predictionRequestCount: predictionRequests.length,
      prediction401ResponseCount: predictionResponses.filter((response) => response.status === 401)
        .length,
      authRefreshContractFixtureCount: authRefreshContractFixtures.length,
      unauthorizedRedirectCount: [eventsRoute, portfolioRoute].filter(
        (result) => result.resultRoute === '/auth/login',
      ).length,
      unsupportedPredictionRequestCount: unsupportedPredictionRequests.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      routes: [eventsRoute, portfolioRoute],
      apiResponses,
      predictionRequests,
      predictionResponses,
      unsupportedPredictionRequests,
      predictionRequestFailures,
      pageErrors,
    },
    screenshots: {
      events: path.basename(eventsScreenshotPath),
      portfolio: path.basename(portfolioScreenshotPath),
    },
    sourceHashes,
    limitations: [
      'The Predictions OpenAPI contract declares 401 for listPredictionEvents and listPredictionPositions only; the other six domain operations were not exercised in this unauthorized scenario.',
      'The local preview scenario handler applies 401 to Predictions requests. This runner visits only the two contract-declared protected reads and asserts no other Predictions operation was requested.',
      'Auth OpenAPI does not declare 401 for refreshSession. The runner intercepts that fetch before network dispatch and returns its contract-declared 200/null response; it does not claim service-worker or backend evidence for refresh.',
      'Local Chromium/MSW and the runner-local refresh fixture do not verify backend authorization, persistence, staging, production or user acceptance.',
    ],
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  const formatted = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
    ...prettierOptions,
    parser: 'json',
  });
  await fs.writeFile(reportPath, formatted);
  process.stdout.write(formatted);
} finally {
  await browser.close();
}

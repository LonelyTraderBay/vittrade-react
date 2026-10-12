import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';
import { parse } from 'yaml';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const checkedAt = new Date().toISOString();
const runId = checkedAt.replace(/[-:.TZ]/g, '').slice(0, 15);
const reportPath = path.join(
  evidenceDirectory,
  `auth-unauthorized-current-head-browser-check-${runId}.json`,
);
const screenshotName = `preview-auth-unauthorized-current-head-${runId}.png`;
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'docs/architecture/production-readiness/evidence/A06/run-auth-unauthorized-current-head-browser-check.mjs',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/contexts/AuthContext.tsx',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
];
const sha256 = async (relativePath) =>
  crypto
    .createHash('sha256')
    .update(await fs.readFile(path.join(root, relativePath)))
    .digest('hex');
const serializeJson = async (value, destination) =>
  prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...((await prettier.resolveConfig(destination)) ?? {}),
    parser: 'json',
  });

const contract = parse(await fs.readFile(path.join(root, 'contracts/openapi/auth.yaml'), 'utf8'));
const operations = Object.values(contract.paths).flatMap((item) => Object.values(item));
const sessionOperation = operations.find((operation) => operation.operationId === 'getSession');
const authOperationIds = operations
  .filter((operation) => typeof operation.operationId === 'string')
  .map((operation) => operation.operationId);
assert.ok(Object.hasOwn(sessionOperation?.responses ?? {}, '401'));

const requests = [];
const responses = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requests.push({ method: request.method(), path: url.pathname });
  if (url.origin !== origin) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  responses.push({
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  const startedAt = Date.now();
  const bootstrapPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  void bootstrapPromise.catch(() => undefined);
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const bootstrapResponse = await bootstrapPromise;
  assert.equal(bootstrapResponse.status(), 401);
  assert.equal(bootstrapResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('auth');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const scenarioVisible = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.unauthorized', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const scenarioRequestStart = requests.length;
  const scenarioResponseStart = responses.length;
  const sessionPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  void sessionPromise.catch(() => undefined);
  await page.goto(`${origin}/w/trade/positions`, { waitUntil: 'domcontentloaded' });
  const sessionResponse = await sessionPromise;
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
  const finalRoute = new URL(page.url()).pathname;
  const loginFormVisible = await page.getByTestId('auth-submit').isVisible();
  const protectedContentVisible = await page
    .getByRole('heading', { name: 'Vị thế đang mở', exact: true })
    .isVisible()
    .catch(() => false);
  const loginErrorVisible = (await page.getByRole('alert').count()) > 0;
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: true });

  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const writes = scenarioRequests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  const financialRequests = scenarioRequests.filter((request) =>
    /^\/api\/(?:trading|wallet|p2p|dca|earn|predictions)\//.test(request.path),
  );
  assert.equal(scenarioVisible, true);
  assert.equal(sessionResponse.status(), 401);
  assert.equal(sessionResponse.fromServiceWorker(), true);
  assert.match(finalRoute, /\/(?:w\/)?auth\/login$/);
  assert.equal(loginFormVisible, true);
  assert.equal(protectedContentVisible, false);
  assert.equal(loginErrorVisible, false);
  assert.equal(scenarioRequests.length, 1);
  assert.equal(scenarioResponses.length, 1);
  assert.equal(writes.length, 0);
  assert.equal(financialRequests.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);
  assert.equal(
    scenarioResponses.every((response) => response.fromServiceWorker),
    true,
  );

  const sourceHashes = {};
  for (const relativePath of sourcePaths) sourceHashes[relativePath] = await sha256(relativePath);
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'auth.unauthorized',
      domain: 'auth',
      state: 'unauthorized',
      status: 'passed',
      persona: 'guest (no authenticated session)',
      role: 'unauthenticated',
      permissions: [],
      operationIds: authOperationIds,
      observedOperationIds: ['getSession'],
      operationRequestCounts: { getSession: scenarioRequests.length },
      requests: scenarioRequests,
      responses: scenarioResponses,
      bootstrapSessionResponse: {
        status: bootstrapResponse.status(),
        fromServiceWorker: bootstrapResponse.fromServiceWorker(),
      },
      unauthorizedSessionResponse: {
        status: sessionResponse.status(),
        fromServiceWorker: sessionResponse.fromServiceWorker(),
      },
      protectedRoute: '/w/trade/positions',
      finalRoute,
      redirectedToLogin: /\/(?:w\/)?auth\/login$/.test(finalRoute),
      loginFormVisible,
      protectedContentVisible,
      loginErrorVisible,
      writeRequestCount: writes.length,
      financialApiRequestCount: financialRequests.length,
      elapsedMs: Date.now() - startedAt,
      externalApiOrigins: [...externalApiOrigins],
      pageErrors,
      screenshots: [screenshotName],
      note: 'The browser used getSession 401, which the Auth OpenAPI explicitly declares. The guest was redirected to login without protected content or an erroneous login-submission alert. Only getSession among 14 Auth operations was observed. All traffic was local MSW; backend/session-cookie behavior, staging, production and user acceptance are unverified.',
    },
    fixtureBoundary: {
      serviceWorkerControlled: await page.evaluate(() =>
        Boolean(navigator.serviceWorker.controller),
      ),
      allObservedResponsesFromServiceWorker: responses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: requests.length,
      apiResponseCount: responses.length,
      unauthorizedScenarioRequestCount: scenarioRequests.length,
      unauthorizedScenarioResponseCount: scenarioResponses.length,
      writeRequestCount: writes.length,
      financialApiRequestCount: financialRequests.length,
      externalApiOriginCount: externalApiOrigins.size,
      pageErrors,
    },
    contract: {
      operationId: 'getSession',
      declaredResponses: Object.keys(sessionOperation.responses),
      observedStatus: sessionResponse.status(),
    },
    sourceHashes,
    limitations:
      'This run used local Vite development and MSW. It does not establish backend authorization/session persistence, cookie behavior, staging, production or user acceptance.',
  };
  await fs.writeFile(reportPath, await serializeJson(report, reportPath));
  process.stdout.write(
    `${JSON.stringify({ reportPath, scenario: report.scenario, measurements: report.measurements, sourceHashes }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(
    `Auth unauthorized browser check failed: ${error instanceof Error ? error.stack : String(error)}\n`,
  );
  throw error;
} finally {
  await context.close();
  await browser.close();
}

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
  `auth-error-current-head-browser-check-${runId}.json`,
);
const firstErrorScreenshotName = `preview-auth-error-current-head-${runId}.png`;
const retryScreenshotName = `preview-auth-error-retry-current-head-${runId}.png`;
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'docs/architecture/production-readiness/evidence/A06/run-auth-error-current-head-browser-check.mjs',
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
const loginOperation = operations.find((operation) => operation.operationId === 'login');
const sessionOperation = operations.find((operation) => operation.operationId === 'getSession');
const authOperationIds = operations
  .filter((operation) => typeof operation.operationId === 'string')
  .map((operation) => operation.operationId);
assert.ok(Object.hasOwn(loginOperation?.responses ?? {}, '200'));
assert.equal(
  Object.keys(loginOperation.responses).some((status) => /^5\d\d$/.test(status)),
  false,
);
assert.ok(Object.hasOwn(sessionOperation?.responses ?? {}, '401'));

const requests = [];
const responses = [];
const requestFailures = [];
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
page.on('requestfailed', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  requestFailures.push({
    method: request.method(),
    path: url.pathname,
    failure: request.failure()?.errorText ?? 'unknown transport failure',
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  const startedAt = Date.now();
  const bootstrapResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  void bootstrapResponsePromise.catch(() => undefined);
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const bootstrapResponse = await bootstrapResponsePromise;
  assert.equal(bootstrapResponse.status(), 401);
  assert.equal(bootstrapResponse.fromServiceWorker(), true);

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('auth');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const scenarioVisible = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.error', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');

  const scenarioRequestStart = requests.length;
  const scenarioResponseStart = responses.length;
  const scenarioFailureStart = requestFailures.length;
  const loginRequestMatcher = (request) =>
    request.method() === 'POST' && new URL(request.url()).pathname === '/api/auth/login';
  const firstLoginRequest = page.waitForRequest(loginRequestMatcher);
  const firstLoginFailure = page.waitForEvent('requestfailed', loginRequestMatcher);
  void firstLoginRequest.catch(() => undefined);
  void firstLoginFailure.catch(() => undefined);
  await page.getByTestId('auth-submit').click();
  await firstLoginRequest;
  await firstLoginFailure;
  const alert = page.getByRole('alert');
  await alert.waitFor({ state: 'visible' });
  const firstErrorVisible = await alert.isVisible();
  const firstErrorText = (await alert.innerText()).trim();
  const retryEnabledAfterFirstError = await page.getByTestId('auth-submit').isEnabled();
  await page.screenshot({
    path: path.join(evidenceDirectory, firstErrorScreenshotName),
    fullPage: true,
  });

  const retryLoginRequest = page.waitForRequest(loginRequestMatcher);
  const retryLoginFailure = page.waitForEvent('requestfailed', loginRequestMatcher);
  void retryLoginRequest.catch(() => undefined);
  void retryLoginFailure.catch(() => undefined);
  await page.getByTestId('auth-submit').click();
  await retryLoginRequest;
  await retryLoginFailure;
  await alert.waitFor({ state: 'visible' });
  const errorVisibleAfterRetry = await alert.isVisible();
  const retryErrorText = (await alert.innerText()).trim();
  const retryEnabledAfterSecondError = await page.getByTestId('auth-submit').isEnabled();
  await page.screenshot({
    path: path.join(evidenceDirectory, retryScreenshotName),
    fullPage: true,
  });
  const finalRoute = new URL(page.url()).pathname;

  const scenarioRequests = requests.slice(scenarioRequestStart);
  const scenarioResponses = responses.slice(scenarioResponseStart);
  const scenarioFailures = requestFailures.slice(scenarioFailureStart);
  const loginRequests = scenarioRequests.filter(
    (request) => request.method === 'POST' && request.path.endsWith('/auth/login'),
  );
  const loginFailures = scenarioFailures.filter(
    (failure) => failure.method === 'POST' && failure.path.endsWith('/auth/login'),
  );
  const unexpectedWrites = scenarioRequests.filter(
    (request) =>
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      !(request.method === 'POST' && request.path.endsWith('/auth/login')),
  );
  const financialRequests = scenarioRequests.filter((request) =>
    /^\/api\/(?:trading|wallet|p2p|dca|earn|predictions)\//.test(request.path),
  );
  assert.equal(scenarioVisible, true);
  assert.equal(firstErrorVisible, true);
  assert.equal(firstErrorText.length > 0, true);
  assert.equal(retryEnabledAfterFirstError, true);
  assert.equal(errorVisibleAfterRetry, true);
  assert.equal(retryErrorText.length > 0, true);
  assert.equal(retryEnabledAfterSecondError, true);
  assert.equal(finalRoute, '/w/auth/login');
  assert.equal(loginRequests.length, 2, 'POST login should not be automatically retried.');
  assert.equal(loginFailures.length, 2, 'Both deliberate login attempts should fail at transport.');
  assert.equal(
    scenarioResponses.filter(
      (response) => response.method === 'POST' && response.path.endsWith('/auth/login'),
    ).length,
    0,
    'Do not invent an HTTP status for an OpenAPI-unspecified transport failure.',
  );
  assert.deepEqual(unexpectedWrites, []);
  assert.equal(financialRequests.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);

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
      id: 'auth.error',
      domain: 'auth',
      state: 'error',
      status: 'passed',
      persona: 'guest (no authenticated session)',
      role: 'unauthenticated',
      permissions: [],
      operationIds: authOperationIds,
      observedOperationIds: ['login'],
      operationRequestCounts: { login: loginRequests.length, getSession: 0 },
      requests: scenarioRequests,
      responses: scenarioResponses,
      requestFailures: loginFailures,
      bootstrapSessionResponse: {
        status: bootstrapResponse.status(),
        fromServiceWorker: bootstrapResponse.fromServiceWorker(),
      },
      errorVisibleAfterFirstFailure: firstErrorVisible,
      errorMessageAfterFirstFailure: firstErrorText,
      retryEnabledAfterFirstFailure: retryEnabledAfterFirstError,
      errorVisibleAfterRetry,
      errorMessageAfterRetry: retryErrorText,
      retryEnabledAfterSecondFailure: retryEnabledAfterSecondError,
      staysOnLoginRoute: finalRoute === '/w/auth/login',
      writeRequestCount: loginRequests.length,
      unexpectedWriteCount: unexpectedWrites.length,
      financialApiRequestCount: financialRequests.length,
      elapsedMs: Date.now() - startedAt,
      externalApiOrigins: [...externalApiOrigins],
      pageErrors,
      screenshots: [firstErrorScreenshotName, retryScreenshotName],
      note: 'OpenAPI declares no 5xx for login. The local preview returns statusless transport failures for two deliberate POST /auth/login attempts. The form shows a recoverable error, remains retryable and does not navigate as though login succeeded. This is local browser/MSW evidence only.',
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
      loginPostCount: loginRequests.length,
      loginTransportFailureCount: loginFailures.length,
      loginHttpResponseCount: scenarioResponses.filter(
        (response) => response.method === 'POST' && response.path.endsWith('/auth/login'),
      ).length,
      writeRequestCount: loginRequests.length,
      unexpectedWriteCount: unexpectedWrites.length,
      financialApiRequestCount: financialRequests.length,
      externalApiOriginCount: externalApiOrigins.size,
      pageErrors,
    },
    contract: {
      operationId: 'login',
      declaredResponses: Object.keys(loginOperation.responses),
      declared5xxResponses: Object.keys(loginOperation.responses).filter((status) =>
        /^5\d\d$/.test(status),
      ),
    },
    sourceHashes,
    limitations:
      'This run used local Vite development and MSW. The login failures had no HTTP status. It does not establish backend behavior, staging, production or user acceptance.',
  };
  await fs.writeFile(reportPath, await serializeJson(report, reportPath));
  process.stdout.write(
    `${JSON.stringify({ reportPath, scenario: report.scenario, measurements: report.measurements, contract: report.contract, sourceHashes }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(
    `Auth error browser check failed: ${error instanceof Error ? error.stack : String(error)}\n`,
  );
  throw error;
} finally {
  await context.close();
  await browser.close();
}

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
  `auth-empty-current-head-browser-check-${runId}.json`,
);
const screenshotPath = path.join(evidenceDirectory, `preview-auth-empty-current-head-${runId}.png`);
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'docs/architecture/production-readiness/evidence/A06/run-auth-empty-current-head-browser-check.mjs',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/app/contexts/AuthContext.tsx',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
];

const contract = parse(await fs.readFile(path.join(root, 'contracts/openapi/auth.yaml'), 'utf8'));
const getSession = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .find((operation) => operation.operationId === 'getSession');
const authOperationIds = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) => typeof operation.operationId === 'string')
  .map((operation) => operation.operationId);
assert.ok(Object.hasOwn(getSession?.responses ?? {}, '200'));
assert.ok(Object.hasOwn(getSession?.responses ?? {}, '401'));
const sessionResponseSchema = getSession.responses['200'].content['application/json'].schema;
assert.ok(sessionResponseSchema.oneOf?.some((item) => item.type === 'null'));

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
  if (url.origin !== origin) externalApiOrigins.add(url.origin);
  requests.push({ method: request.method(), path: url.pathname });
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
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const emptySessionResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  void emptySessionResponsePromise.catch(() => undefined);
  await page.evaluate(() => window.location.reload());
  await page.waitForURL('**/w/auth/login');
  const emptySessionResponse = await emptySessionResponsePromise;
  const emptySessionPayload = await emptySessionResponse.json();
  assert.equal(emptySessionPayload, null);
  assert.equal(emptySessionResponse.fromServiceWorker(), true);
  await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
  const loginFormVisible = await page.getByTestId('auth-submit').isVisible();
  const loginErrorVisible =
    (await page.getByText('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.').count()) >
    0;
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  const activeScenarioVisible = await page
    .getByTestId('active-preview-scenario')
    .getByText('auth.empty', { exact: true })
    .isVisible();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const protectedSessionResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  void protectedSessionResponsePromise.catch(() => undefined);
  await page.goto(`${origin}/w/trade/positions`, { waitUntil: 'domcontentloaded' });
  const protectedSessionResponse = await protectedSessionResponsePromise;
  const protectedSessionPayload = await protectedSessionResponse.json();
  assert.equal(protectedSessionPayload, null);
  assert.equal(protectedSessionResponse.fromServiceWorker(), true);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByTestId('auth-submit').waitFor({ state: 'visible' });
  const finalRoute = new URL(page.url()).pathname;
  const protectedRouteRedirectedToLogin = /\/(?:w\/)?auth\/login$/.test(finalRoute);
  await page.mouse.move(1430, 890);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const apiWrites = requests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  const financialApiRequests = requests.filter((request) =>
    /^\/api\/(wallet|trading|orders)(\/|$)/.test(request.path),
  );
  const sessionResponses = responses.filter((response) => response.path === '/api/auth/session');
  const emptySessionResponses = sessionResponses.filter((response) => response.status === 200);
  const session401Responses = sessionResponses.filter((response) => response.status === 401);
  assert.equal(loginFormVisible, true);
  assert.equal(loginErrorVisible, false);
  assert.equal(activeScenarioVisible, true);
  assert.equal(protectedRouteRedirectedToLogin, true);
  assert.equal(emptySessionResponses.length, 2);
  assert.ok(session401Responses.length >= 1);
  assert.deepEqual(apiWrites, []);
  assert.deepEqual(financialApiRequests, []);
  assert.ok(responses.every((response) => response.fromServiceWorker));
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);

  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(serviceWorkerControlled, true);
  const sourceHashes = Object.fromEntries(
    await Promise.all(
      sourcePaths.map(async (source) => [
        source,
        crypto
          .createHash('sha256')
          .update(await fs.readFile(path.join(root, source)))
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
      id: 'auth.empty',
      domain: 'auth',
      state: 'empty',
      status: 'passed',
      persona: 'guest (no authenticated session)',
      role: 'unauthenticated',
      permissions: [],
      operationIds: authOperationIds,
      observedOperationIds: ['getSession'],
      operationRequestCounts: { getSession: sessionResponses.length },
      requests,
      responses,
      initialSessionResponse: {
        status: bootstrapResponse.status(),
        fromServiceWorker: bootstrapResponse.fromServiceWorker(),
      },
      emptySessionResponse: {
        status: emptySessionResponse.status(),
        body: emptySessionPayload,
        fromServiceWorker: emptySessionResponse.fromServiceWorker(),
      },
      protectedRouteSessionResponse: {
        status: protectedSessionResponse.status(),
        body: protectedSessionPayload,
        fromServiceWorker: protectedSessionResponse.fromServiceWorker(),
      },
      loginFormVisible,
      loginErrorVisible,
      activeScenarioVisible,
      protectedRoute: '/w/trade/positions',
      protectedRouteRedirectedToLogin,
      finalRoute,
      writeRequestCount: apiWrites.length,
      financialApiRequestCount: financialApiRequests.length,
      elapsedMs: Date.now() - startedAt,
      externalApiOrigins: [...externalApiOrigins],
      pageErrors,
      screenshots: [path.basename(screenshotPath)],
      note: 'OpenAPI declares getSession 200 as AuthSession or JSON null and declares 401. The guest fixture returned JSON null in the selected auth.empty scenario; the login form remained ready without error copy, and the protected trading route redirected to login. Only getSession among 14 linked Auth operations was observed. All requests used local MSW; backend session/cookie behavior, production and user acceptance are unverified.',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
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
      sessionRequestCount: sessionResponses.length,
      emptySessionResponseCount: emptySessionResponses.length,
      unauthorizedBootstrapResponseCount: session401Responses.length,
      writeRequestCount: apiWrites.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: {
      operationId: 'getSession',
      declaredResponses: Object.keys(getSession.responses),
      successSchemaIncludesNull: true,
    },
    sourceHashes,
    limitations:
      'This run used local Vite development and MSW. It does not establish backend session persistence, cookie behavior, staging, production routing or user acceptance.',
  };
  const options = (await prettier.resolveConfig(reportPath)) ?? {};
  await fs.writeFile(
    reportPath,
    await prettier.format(JSON.stringify(report, null, 2), { ...options, parser: 'json' }),
  );
  process.stdout.write(`${JSON.stringify({ reportPath, ...report }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Auth empty browser check failed: ${error.stack ?? error}\n`);
  throw error;
} finally {
  await context.close();
  await browser.close();
}

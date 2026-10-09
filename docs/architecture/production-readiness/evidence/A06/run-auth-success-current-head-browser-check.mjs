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
  `auth-success-current-head-browser-check-${runId}.json`,
);
const screenshotPath = path.join(
  evidenceDirectory,
  `preview-auth-success-current-head-${runId}.png`,
);
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'docs/architecture/production-readiness/evidence/A06/run-auth-success-current-head-browser-check.mjs',
  'src/app/contexts/AuthContext.tsx',
  'src/app/components/layout/WebCommandBar.tsx',
  'src/app/components/layout/WebSidebar.tsx',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/AuthContext.tsx',
];

const contract = parse(await fs.readFile(path.join(root, 'contracts/openapi/auth.yaml'), 'utf8'));
const operations = Object.values(contract.paths)
  .flatMap((item) => Object.values(item))
  .filter((operation) => typeof operation.operationId === 'string');
const operationIds = operations.map((operation) => operation.operationId);
const operationById = new Map(operations.map((operation) => [operation.operationId, operation]));
assert.ok(Object.hasOwn(operationById.get('login')?.responses ?? {}, '200'));
assert.ok(Object.hasOwn(operationById.get('getSession')?.responses ?? {}, '401'));

const apiRequests = [];
const apiResponses = [];
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
  apiRequests.push({ method: request.method(), path: url.pathname });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  apiResponses.push({
    method: response.request().method(),
    path: url.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  const startedAt = Date.now();
  const sessionResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByTestId('auth-email').waitFor();
  const sessionResponse = await sessionResponsePromise;
  assert.equal(sessionResponse.status(), 401);
  assert.equal(sessionResponse.fromServiceWorker(), true);

  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  const loginStartedAt = Date.now();
  await page.getByTestId('auth-submit').click();
  const loginResponse = await loginResponsePromise;
  const loginPayload = await loginResponse.json();
  await page.waitForURL('**/w/home');
  await page.getByText('VitTrade Developer', { exact: true }).first().waitFor();
  const identityCount = await page.getByText('VitTrade Developer', { exact: true }).count();
  const formerStaticIdentityCount = await page.getByText('VitTrader Pro', { exact: true }).count();
  const finalRoute = new URL(page.url()).pathname;
  const bodyTextLength = (await page.locator('body').innerText()).trim().length;
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  await page.mouse.move(1430, 890);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  assert.equal(loginResponse.status(), 200);
  assert.equal(loginResponse.fromServiceWorker(), true);
  assert.equal(loginPayload.status, 'authenticated');
  assert.equal(loginPayload.session?.user?.email, 'developer@vittrade.local');
  assert.equal(finalRoute, '/w/home');
  assert.ok(identityCount >= 1);
  assert.equal(formerStaticIdentityCount, 0);
  assert.ok(bodyTextLength > 0);
  assert.equal(serviceWorkerControlled, true);

  const loginRequests = apiRequests.filter((request) => request.path === '/api/auth/login');
  const sessionResponses = apiResponses.filter((response) => response.path === '/api/auth/session');
  const loginResponses = apiResponses.filter((response) => response.path === '/api/auth/login');
  const apiWrites = apiRequests.filter(
    (request) => !['GET', 'HEAD', 'OPTIONS'].includes(request.method),
  );
  assert.equal(loginRequests.length, 1);
  assert.equal(sessionResponses.length, 1);
  assert.equal(loginResponses.length, 1);
  assert.deepEqual([sessionResponses[0].status, loginResponses[0].status], [401, 200]);
  assert.deepEqual(
    apiWrites.map((request) => request.path),
    ['/api/auth/login'],
  );
  assert.ok(apiResponses.every((response) => response.fromServiceWorker));
  assert.deepEqual([...externalApiOrigins], []);
  assert.deepEqual(pageErrors, []);

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
      id: 'auth.success',
      domain: 'auth',
      state: 'success',
      status: 'passed',
      persona: 'developer (local MSW fixture)',
      role: 'user',
      operationIds,
      observedOperationIds: ['login'],
      operationRequestCounts: {
        getSession: sessionResponses.length,
        login: loginRequests.length,
      },
      requests: apiRequests,
      responses: apiResponses,
      initialSessionResponse: {
        status: sessionResponses[0].status,
        fromServiceWorker: sessionResponses[0].fromServiceWorker,
        contractExpected: true,
      },
      loginResult: {
        status: loginPayload.status,
        userEmail: loginPayload.session.user.email,
        userFullName: loginPayload.session.user.fullName,
        elapsedMs: Date.now() - loginStartedAt,
      },
      visibleIdentityCount: identityCount,
      formerStaticIdentityCount,
      visibleHomeContent: bodyTextLength > 0,
      finalRoute,
      elapsedMs: Date.now() - startedAt,
      externalApiOrigins: [...externalApiOrigins],
      writeRequestCount: apiWrites.length,
      pageErrors,
      screenshots: [path.basename(screenshotPath)],
      note: 'The login flow used the real WebLoginPage and a local MSW developer fixture. getSession returned its declared unauthenticated 401; exactly one login POST returned the declared 200 and routed to /w/home with the session identity visible. Only login among 14 linked Auth operations was observed. This does not prove backend authentication, cookie persistence, MFA, staging or production behavior.',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      realBackendMutationSent: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      authLoginCount: loginRequests.length,
      authSessionCount: sessionResponses.length,
      writeRequestCount: apiWrites.length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    contract: {
      operationIds,
      loginSuccessResponses: Object.keys(operationById.get('login').responses),
      sessionResponses: Object.keys(operationById.get('getSession').responses),
    },
    sourceHashes,
    limitations:
      'This run used local Vite development and MSW. It does not establish backend authentication, persisted cookies, MFA behavior, staging, production routing or user acceptance.',
  };
  const options = (await prettier.resolveConfig(reportPath)) ?? {};
  await fs.writeFile(
    reportPath,
    await prettier.format(JSON.stringify(report, null, 2), { ...options, parser: 'json' }),
  );
  process.stdout.write(`${JSON.stringify({ reportPath, ...report }, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

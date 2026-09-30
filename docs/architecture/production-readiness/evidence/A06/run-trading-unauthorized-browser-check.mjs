import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const previewUrl = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(previewUrl.hostname),
  'Trading unauthorized check is restricted to a loopback preview.',
);
assert.equal(previewUrl.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');

const origin = previewUrl.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const reportPath = path.join(directory, `trading-unauthorized-browser-check-${date}.json`);
const screenshotPath = path.join(directory, `preview-trading-unauthorized-login-${date}.png`);
const sourceFiles = [
  'contracts/openapi/auth.yaml',
  'contracts/openapi/trading.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/app/components/layout/ProtectedRoute.tsx',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/features/trading/pages/OpenPositionsPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-trading-unauthorized-browser-check.mjs',
];
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (file) => [
      file,
      createHash('sha256')
        .update(await fs.readFile(path.join(root, file)))
        .digest('hex'),
    ]),
  ),
);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: root,
  encoding: 'utf8',
}).trim();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const apiRequests = [];
const apiResponses = [];
const apiFailures = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const requestRecords = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];

const classifyOperation = (method, pathname) => {
  if (method === 'GET' && pathname === '/api/trading/positions') return 'listOpenPositions';
  if (method === 'POST' && pathname === '/api/auth/refresh') return 'refreshSession';
  return null;
};
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const record = {
    method: request.method(),
    path: url.pathname,
    operationId: classifyOperation(request.method(), url.pathname),
    startedAt: Date.now(),
  };
  requestRecords.set(request, record);
  apiRequests.push(record);
  if (url.origin !== origin) externalApiOrigins.add(url.origin);
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
    operationId: classifyOperation(request.method(), url.pathname),
    failure: request.failure()?.errorText ?? 'unknown',
    hadResponse: requestsWithResponse.has(request),
  });
});

const startedAt = Date.now();
try {
  await page.goto(`${origin}/w/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="dev-preview-controls"]').waitFor();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker?.controller)), true);

  const expandPreview = page.getByRole('button', { name: 'Mở công cụ xem trước' });
  if (await expandPreview.count()) await expandPreview.click();
  await page.locator('#preview-persona').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page
    .locator('[data-testid="dev-preview-controls"]')
    .getByText('developer@vittrade.local')
    .waitFor();
  await page.locator('#preview-domain').selectOption('trading');
  await page.locator('#preview-state').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.unauthorized').waitFor();
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();

  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/positions');
  await page.waitForURL((url) => url.pathname === '/auth/login');
  await Promise.all(responseTasks);

  const positionsResponses = apiResponses.filter(
    (response) => response.operationId === 'listOpenPositions',
  );
  const refreshResponses = apiResponses.filter(
    (response) => response.operationId === 'refreshSession',
  );
  assert.equal(positionsResponses.length, 1);
  assert.equal(positionsResponses[0].status, 401);
  assert.equal(positionsResponses[0].fromServiceWorker, true);
  assert.equal(refreshResponses.length, 1);
  assert.equal(refreshResponses[0].status, 401);
  assert.equal(refreshResponses[0].fromServiceWorker, true);
  assert.equal(
    await page.getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true }).count(),
    0,
  );
  assert.equal(await page.getByText('Không có vị thế phù hợp.', { exact: true }).count(), 0);
  const loginHeading = page.getByRole('heading', { name: 'VitTrade', exact: true });
  await loginHeading.waitFor({ state: 'visible' });
  assert.equal(await loginHeading.count(), 1);
  assert.deepEqual(externalApiOrigins, new Set());
  assert.deepEqual(pageErrors, []);
  assert.equal(
    apiFailures.filter((failure) => !failure.hadResponse).length,
    0,
    JSON.stringify(apiFailures.filter((failure) => !failure.hadResponse)),
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const trading401Count = (() => {
    const contract = readFileSync(path.join(root, 'contracts/openapi/trading.yaml'), 'utf8');
    return (contract.match(/'401':/g) ?? []).length;
  })();
  const authContract = readFileSync(path.join(root, 'contracts/openapi/auth.yaml'), 'utf8');
  const refreshBlock = authContract.split('/auth/refresh:')[1]?.split('\n  /')[0] ?? '';
  const refresh401Declared = /'401':/.test(refreshBlock);

  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'trading.unauthorized',
      status: 'passed',
      persona: 'developer',
      route: '/w/trade/positions',
      operationIds: ['listOpenPositions'],
      observedOperationIds: ['listOpenPositions'],
      expectedDomainOperationCount: 13,
      coverage: 'representative_contract_operation_browser_observed',
      declaredTrading401OperationCount: trading401Count,
      positionsStatus: positionsResponses[0].status,
      refreshSessionStatus: refreshResponses[0].status,
      refreshSession401Declared: refresh401Declared,
      redirectedToLogin: page.url() === `${origin}/auth/login`,
      protectedPositionsStateVisible: false,
      screenshot: path.basename(screenshotPath),
    },
    fixtureBoundary: {
      serviceWorkerControlled: true,
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
      operationResponses: {
        listOpenPositions: positionsResponses,
        refreshSession: refreshResponses,
      },
      apiFailures,
      unmatchedApiFailureCount: apiFailures.filter((failure) => !failure.hadResponse).length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    apiRequests,
    apiResponses,
    sourceHashes,
    limitations:
      'The Trading positions 401 is declared by OpenAPI. The preview unauthorized scenario also makes Auth refresh return 401, but the current Auth OpenAPI contract declares only 200/null for refreshSession. The redirect is therefore representative local UI evidence with a contract gap at refresh; it is not full Trading operation coverage, backend authorization or staging evidence.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

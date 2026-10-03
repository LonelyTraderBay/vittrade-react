import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const previewUrl = new URL(process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173');
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(previewUrl.hostname),
  'This check is restricted to a loopback preview.',
);
assert.equal(previewUrl.pathname, '/', 'PREVIEW_BASE_URL must be an origin without a path.');
const origin = previewUrl.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const evidenceRunSuffix = process.env.EVIDENCE_RUN_SUFFIX ?? '';
if (!/^[a-z0-9-]*$/i.test(evidenceRunSuffix)) {
  throw new Error('Evidence run suffix must be alphanumeric or hyphenated.');
}
const artifactSuffix = evidenceRunSuffix ? `-${evidenceRunSuffix}` : '';
const reportPath = path.join(
  directory,
  `trading-forbidden-browser-check-${date}${artifactSuffix}.json`,
);
const screenshotPath = path.join(
  directory,
  `preview-trading-forbidden-positions-${date}${artifactSuffix}.png`,
);
const sourceFiles = [
  'contracts/openapi/trading.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/features/trading/pages/OpenPositionsPage.tsx',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/ui/ErrorState.tsx',
  'docs/architecture/production-readiness/evidence/A06/generate-scenario-matrix.mjs',
  'docs/architecture/production-readiness/evidence/A06/run-trading-forbidden-browser-check.mjs',
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
const contract = parse(
  await fs.readFile(path.join(root, 'contracts/openapi/trading.yaml'), 'utf8'),
);
const declaredForbiddenOperationIds = [];
for (const [apiPath, pathItem] of Object.entries(contract.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (
      operation &&
      typeof operation === 'object' &&
      operation.operationId &&
      operation.responses?.['403']
    ) {
      declaredForbiddenOperationIds.push(operation.operationId);
    }
  }
}
assert.equal(declaredForbiddenOperationIds.length, 10, 'Unexpected Trading OpenAPI 403 scope.');
assert.ok(declaredForbiddenOperationIds.includes('listOpenPositions'));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const apiRequests = [];
const apiResponses = [];
const apiFailures = [];
const pageErrors = [];
const externalApiOrigins = new Set();
const requestRecords = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];
const classifyOperation = (method, pathname) =>
  method === 'GET' && pathname === '/api/trading/positions' ? 'listOpenPositions' : null;
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
  responseTasks.push(
    (async () => {
      const url = new URL(response.url());
      if (!url.pathname.startsWith('/api/')) return;
      const request = response.request();
      requestsWithResponse.add(request);
      const record = requestRecords.get(request);
      const body =
        record?.operationId === 'listOpenPositions'
          ? await response.json().catch(() => null)
          : undefined;
      apiResponses.push({
        method: request.method(),
        path: url.pathname,
        operationId: record?.operationId ?? null,
        status: response.status(),
        fromServiceWorker: await response.fromServiceWorker(),
        elapsedMs: Date.now() - (record?.startedAt ?? Date.now()),
        body,
      });
    })(),
  );
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
  await page.locator('#preview-state').selectOption('forbidden');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.forbidden').waitFor();
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/positions');
  await page.waitForURL((url) => url.pathname === '/w/trade/positions');
  await page.getByText('Không có quyền xem vị thế', { exact: true }).waitFor({ state: 'visible' });
  await page
    .getByText('Tài khoản của bạn không có quyền xem vị thế.', { exact: true })
    .waitFor({ state: 'visible' });
  assert.equal(
    await page.getByText('Không có vị thế phù hợp.', { exact: true }).count(),
    0,
    '403 must not render as an empty success state.',
  );
  const deadline = Date.now() + 20_000;
  while (
    !apiResponses.some((response) => response.operationId === 'listOpenPositions') &&
    Date.now() < deadline
  )
    await page.waitForTimeout(50);
  const positionResponses = apiResponses.filter(
    (response) => response.operationId === 'listOpenPositions',
  );
  assert.equal(positionResponses.length, 1);
  assert.equal(positionResponses[0].status, 403);
  assert.equal(positionResponses[0].fromServiceWorker, true);
  assert.equal(positionResponses[0].body?.code, 'PREVIEW_FORBIDDEN');
  assert.equal(await page.url(), `${origin}/w/trade/positions`);
  const tradingRequests = apiRequests.filter((request) => request.path.startsWith('/api/trading/'));
  const tradingWrites = tradingRequests.filter((request) => request.method !== 'GET');
  assert.deepEqual(tradingWrites, []);
  assert.deepEqual(
    tradingRequests.filter((request) => request.operationId !== 'listOpenPositions'),
    [],
  );
  assert.deepEqual(externalApiOrigins, new Set());
  assert.deepEqual(pageErrors, []);
  await Promise.all(responseTasks);
  assert.equal(apiFailures.filter((failure) => !failure.hadResponse).length, 0);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'trading.forbidden',
      status: 'passed',
      persona: 'developer',
      route: '/w/trade/positions',
      operationIds: ['listOpenPositions'],
      observedOperationIds: ['listOpenPositions'],
      expectedDomainOperationCount: declaredForbiddenOperationIds.length,
      declaredTrading403OperationCount: declaredForbiddenOperationIds.length,
      declaredTrading403OperationIds: declaredForbiddenOperationIds,
      coverage: 'representative_contract_operation_browser_observed',
      responseStatus: positionResponses[0].status,
      responseCode: positionResponses[0].body.code,
      visiblePermissionDeniedState: true,
      visibleEmptyState: false,
      routePreserved: true,
      writeRequestCount: tradingWrites.length,
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
      positionResponses: positionResponses.map(({ body, ...response }) => ({ ...response, body })),
      tradingRequestCount: tradingRequests.length,
      tradingWriteCount: tradingWrites.length,
      unmatchedApiFailureCount: apiFailures.filter((failure) => !failure.hadResponse).length,
      pageErrors,
      externalApiOriginCount: externalApiOrigins.size,
    },
    apiRequests,
    apiResponses,
    sourceHashes,
    limitations:
      'Local Chromium/MSW verifies only listOpenPositions (1/10 operations declaring 403), using PREVIEW_FORBIDDEN. It does not verify backend authorization, the other nine contract operations, staging or user acceptance.',
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}

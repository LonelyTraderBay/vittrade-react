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
const evidenceRunSuffix = process.env.EVIDENCE_RUN_SUFFIX ?? '';
assert.match(
  evidenceRunSuffix,
  /^[a-z0-9-]*$/i,
  'Evidence run suffix must be alphanumeric or hyphenated.',
);
const artifactSuffix = evidenceRunSuffix ? `-${evidenceRunSuffix}` : '';
const screenshotPaths = {
  pending: path.join(directory, `preview-support-pending-${date}${artifactSuffix}.png`),
  completed: path.join(directory, `preview-support-pending-completed-${date}${artifactSuffix}.png`),
};
const reportPath = path.join(
  directory,
  `support-pending-browser-check-${date}${artifactSuffix}.json`,
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
  'src/features/support/api/support-api.ts',
  'src/features/support/model/support-queries.ts',
  'src/features/support/model/support-types.ts',
  'src/features/support/pages/SupportContractPage.tsx',
  'src/shared/api/app-client.ts',
  'src/shared/api/client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/useAuth.ts',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/generate-scenario-matrix.mjs',
  'docs/architecture/production-readiness/evidence/A06/run-support-pending-browser-check.mjs',
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

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const apiRequests = [];
const apiResponses = [];
const apiFailures = [];
const unexpectedSupportRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const requestRecords = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];
let createResponseSettled = false;
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const record = {
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname),
    startedAt: Date.now(),
    idempotencyKeyPresent: Boolean(request.headers()['idempotency-key']),
  };
  requestRecords.set(request, record);
  apiRequests.push(record);
  if (url.origin !== originUrl) externalApiOrigins.add(url.origin);
  if (url.pathname.startsWith('/api/support/') && !record.operationId) {
    unexpectedSupportRequests.push(record);
  }
});
page.on('response', (response) => {
  const task = (async () => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    const request = response.request();
    requestsWithResponse.add(request);
    const record = requestRecords.get(request);
    if (record?.operationId === 'createSupportTicket') createResponseSettled = true;
    apiResponses.push({
      method: request.method(),
      path: url.pathname,
      operationId: record?.operationId ?? null,
      status: response.status(),
      fromServiceWorker: await response.fromServiceWorker(),
      elapsedMs: Date.now() - (record?.startedAt ?? Date.now()),
      idempotencyKeyPresent: record?.idempotencyKeyPresent ?? false,
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
  await page.goto(`${originUrl}/w/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="dev-preview-controls"]').waitFor();
  const expandPreview = page.getByRole('button', { name: 'Mở công cụ xem trước' });
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
  await page.locator('#preview-state').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('support.loading').waitFor();
  const personaAndDelayScenarioApplied = true;
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();

  const initialTicketsResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === 'GET' &&
      url.pathname === '/api/support/tickets' &&
      response.status() === 200
    );
  });
  await navigate('/w/support');
  const initialTicketsResponse = await initialTicketsResponsePromise;
  assert.equal(initialTicketsResponse.fromServiceWorker(), true);
  await page.getByRole('heading', { name: 'Tạo yêu cầu hỗ trợ' }).waitFor();

  const subject = `A06 support pending ${checkedAt}`;
  const description = 'Local in-flight UI check; the API response is supplied by MSW.';
  const subjectField = page.getByRole('textbox', { name: 'Tiêu đề ticket' });
  const descriptionField = page.getByRole('textbox', { name: 'Nội dung ticket' });
  await subjectField.fill(subject);
  await descriptionField.fill(description);

  const submitStartedAt = Date.now();
  let observedResponse = false;
  const createResponsePromise = page
    .waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        response.request().method() === 'POST' &&
        url.pathname === '/api/support/tickets' &&
        response.status() === 201
      );
    })
    .then((response) => {
      observedResponse = true;
      return response;
    });
  await page.getByRole('button', { name: 'Gửi ticket' }).click();
  const pendingButton = page.getByRole('button', { name: 'Đang gửi…' });
  await pendingButton.waitFor({ state: 'visible' });
  assert.equal(await pendingButton.isEnabled(), false);
  assert.equal(await subjectField.isDisabled(), true);
  assert.equal(await descriptionField.isDisabled(), true);
  assert.equal(observedResponse, false, 'The pending UI must be observed before HTTP 201.');
  const pendingUiElapsedMs = Date.now() - submitStartedAt;
  await page.screenshot({ path: screenshotPaths.pending, fullPage: true });

  const createResponse = await createResponsePromise;
  assert.equal(createResponse.status(), 201);
  assert.equal(createResponse.fromServiceWorker(), true);
  const createdTicket = await createResponse.json();
  assert.equal(createdTicket.subject, subject);
  assert.equal(createdTicket.description, description);
  await page.getByRole('heading', { name: subject }).waitFor();
  await page.screenshot({ path: screenshotPaths.completed, fullPage: true });

  await Promise.all(responseTasks);
  const createRequests = apiRequests.filter(
    (request) => request.operationId === 'createSupportTicket',
  );
  const createResponses = apiResponses.filter(
    (response) => response.operationId === 'createSupportTicket',
  );
  const supportFailures = apiFailures.filter((failure) =>
    ['listSupportTickets', 'createSupportTicket'].includes(failure.operationId),
  );
  assert.equal(createRequests.length, 1, 'The in-flight form must not submit a duplicate request.');
  assert.equal(createResponses.length, 1);
  assert.equal(createRequests[0].idempotencyKeyPresent, true);
  assert.equal(createResponses[0].status, 201);
  assert.ok(
    createResponses[0].elapsedMs >= 1_900,
    'The Support loading fixture must hold the response.',
  );
  assert.equal(supportFailures.length, 0);
  assert.equal(unexpectedSupportRequests.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);

  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'support.pending',
      status: 'passed',
      persona: 'support (development preview)',
      route: '/w/support',
      operationIds: ['createSupportTicket'],
      observedOperationIds: ['createSupportTicket'],
      expectedDomainOperationCount: 1,
      coverage: 'full_scenario_operations_browser_observed',
      delayHarnessScenario: 'support.loading',
    },
    operationFlow: {
      requestCount: createRequests.length,
      responseCount: createResponses.length,
      responseStatus: createResponses[0].status,
      responseElapsedMs: createResponses[0].elapsedMs,
      pendingUiElapsedMs,
      idempotencyKeyPresent: createRequests[0].idempotencyKeyPresent,
      pendingButtonDisabled: true,
      formDisabledDuringRequest: true,
      responseHadNotSettledAtPendingCapture: true,
      duplicateSubmissionCount: 0,
      createdTicketRenderedAfter201: true,
      durableServerPendingStatusClaimed: false,
      screenshots: Object.fromEntries(
        Object.entries(screenshotPaths).map(([key, file]) => [key, path.basename(file)]),
      ),
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      personaAndDelayScenarioApplied,
      allObservedResponsesFromServiceWorker: apiResponses.every(
        (response) => response.fromServiceWorker,
      ),
      externalApiOrigins: [...externalApiOrigins],
      unrelatedApiFailureCount: apiFailures.length - supportFailures.length,
      realBackendRequestSent: false,
      note: 'The existing Support loading preview delays API requests by 2 seconds, including ticket creation, then delegates to the ordinary local MSW 201 handler. This measures client request-in-flight UI only; it does not assert a durable server pending status.',
    },
    apiRequests,
    apiResponses,
    apiFailures,
    supportApiFailures: supportFailures,
    unexpectedSupportRequests,
    pageErrors,
    sourceHashes,
  };
  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  const serialized = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
    ...prettierOptions,
    parser: 'json',
  });
  await fs.writeFile(reportPath, serialized);
  console.log(
    JSON.stringify(
      {
        scenario: report.scenario,
        operationFlow: report.operationFlow,
        fixtureBoundary: report.fixtureBoundary,
        reportPath: path.relative(root, reportPath),
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  await browser.close();
}

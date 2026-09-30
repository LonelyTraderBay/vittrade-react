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
const screenshotPaths = {
  news: path.join(directory, `preview-support-success-news-${date}.png`),
  notifications: path.join(directory, `preview-support-success-notifications-${date}.png`),
  help: path.join(directory, `preview-support-success-help-${date}.png`),
  tickets: path.join(directory, `preview-support-success-tickets-${date}.png`),
};
const reportPath = path.join(directory, `support-success-browser-check-${date}.json`);
const sourceFiles = [
  'contracts/openapi/support.yaml',
  'src/app/routeConfig.ts',
  'src/app/routes.ts',
  'src/app/components/layout/WebSidebar.tsx',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/dev/mocks/trading-fixtures.ts',
  'src/features/support/api/support-api.ts',
  'src/features/support/model/support-queries.ts',
  'src/features/support/model/support-types.ts',
  'src/features/support/pages/HelpCenterContractPage.tsx',
  'src/features/support/pages/NewsContractPage.tsx',
  'src/features/support/pages/NotificationsContractPage.tsx',
  'src/features/support/pages/SupportContractPage.tsx',
  'src/shared/api/app-client.ts',
  'src/shared/api/client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/api/query-client.ts',
  'src/shared/session/useAuth.ts',
  'src/shared/ui/layout/Header.tsx',
  'src/main.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-support-success-browser-check.mjs',
];
const sha256 = async (file) =>
  crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex');
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

const supportOperationFor = (method, pathname) => {
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
const externalApiOrigins = new Set();
const pageErrors = [];
const requestsByHandle = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith('/api/')) return;
  const headers = request.headers();
  const idempotencyKey = headers['idempotency-key'] ?? '';
  const record = {
    method: request.method(),
    path: url.pathname,
    operationId: supportOperationFor(request.method(), url.pathname),
    idempotencyKeyPresent: Boolean(idempotencyKey),
    idempotencyKeyFingerprint: idempotencyKey
      ? crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 16)
      : null,
    idempotencyKeyPrefix: idempotencyKey.split('-').slice(0, 2).join('-') || null,
    startedAt: Date.now(),
  };
  requestsByHandle.set(request, record);
  apiRequests.push(record);
  if (url.origin !== originUrl) externalApiOrigins.add(url.origin);
});
page.on('response', (response) => {
  const task = (async () => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    const request = response.request();
    requestsWithResponse.add(request);
    const requestRecord = requestsByHandle.get(request);
    apiResponses.push({
      method: request.method(),
      path: url.pathname,
      operationId: requestRecord?.operationId ?? null,
      status: response.status(),
      fromServiceWorker: await response.fromServiceWorker(),
      elapsedMs: Date.now() - (requestRecord?.startedAt ?? Date.now()),
      idempotencyKeyPresent: requestRecord?.idempotencyKeyPresent ?? false,
      idempotencyKeyFingerprint: requestRecord?.idempotencyKeyFingerprint ?? null,
      idempotencyKeyPrefix: requestRecord?.idempotencyKeyPrefix ?? null,
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
    operationId: supportOperationFor(request.method(), url.pathname),
    failure: request.failure()?.errorText ?? 'unknown',
    hadResponse: requestsWithResponse.has(request),
  });
});

const waitForApiResponse = (method, pathname, status) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === method &&
      url.pathname === pathname &&
      (status === undefined || response.status() === status)
    );
  });
const navigate = async (pathname) => {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};

const operationResponses = (operationId) =>
  apiResponses.filter((response) => response.operationId === operationId);

try {
  await page.goto(`${originUrl}/w/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="dev-preview-controls"]').waitFor();
  const expandPreview = page.getByRole('button', { name: 'Mở công cụ xem trước' });
  if (await expandPreview.count()) await expandPreview.click();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(serviceWorkerControlled, true, 'The local preview service worker must control the page.');

  await page.locator('#preview-persona').selectOption('support');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.locator('[data-testid="dev-preview-controls"]').getByText('support@vittrade.local').waitFor();
  const personaApplied = true;
  const collapsePreview = page.getByRole('button', { name: 'Thu gọn' });
  if (await collapsePreview.count()) await collapsePreview.click();

  const newsResponsePromise = waitForApiResponse('GET', '/api/content/news', 200);
  await navigate('/w/news');
  const newsResponse = await newsResponsePromise;
  assert.equal(newsResponse.fromServiceWorker(), true);
  await page.getByText('Tin tức', { exact: true }).waitFor();
  const newsItemCount = await page.locator('h2').count();
  assert.ok(newsItemCount > 0, 'News success data must render.');
  await page.screenshot({ path: screenshotPaths.news, fullPage: true });

  const notificationsResponsePromise = waitForApiResponse('GET', '/api/notifications', 200);
  await navigate('/w/notifications');
  const notificationsResponse = await notificationsResponsePromise;
  assert.equal(notificationsResponse.fromServiceWorker(), true);
  await page.getByRole('main').getByText('Thông báo', { exact: true }).waitFor();
  const unreadSummary = page.getByText(/^\d+ chưa đọc$/).first();
  const unreadCountBefore = Number((await unreadSummary.innerText()).match(/^\d+/)?.[0]);
  assert.ok(Number.isFinite(unreadCountBefore) && unreadCountBefore > 0);
  const markReadButton = page.getByRole('button', { name: 'Đã đọc' }).first();
  await markReadButton.waitFor({ state: 'visible' });
  assert.equal(await markReadButton.isEnabled(), true, 'Support persona must expose mark-read action.');
  const markReadResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return response.request().method() === 'POST' && /^\/api\/notifications\/[^/]+\/read$/.test(url.pathname);
  });
  const notificationRefreshPromise = waitForApiResponse('GET', '/api/notifications', 200);
  await markReadButton.click();
  const markReadResponse = await markReadResponsePromise;
  const notificationRefreshResponse = await notificationRefreshPromise;
  assert.equal(markReadResponse.status(), 204);
  assert.equal(markReadResponse.fromServiceWorker(), true);
  assert.equal(notificationRefreshResponse.fromServiceWorker(), true);
  await page.getByText(`${unreadCountBefore - 1} chưa đọc`, { exact: true }).waitFor();
  const notificationsNavText = await page
    .locator('button.web-sidebar-item')
    .filter({ hasText: 'Thông báo' })
    .first()
    .innerText();
  const sidebarNotificationBadgeCount = Number(notificationsNavText.match(/\b\d+\b/)?.[0]);
  assert.ok(Number.isFinite(sidebarNotificationBadgeCount));
  await page.screenshot({ path: screenshotPaths.notifications, fullPage: true });

  const helpResponsePromise = waitForApiResponse('GET', '/api/support/help', 200);
  await navigate('/w/support/help');
  const helpResponse = await helpResponsePromise;
  assert.equal(helpResponse.fromServiceWorker(), true);
  await page.getByText('Trung tâm trợ giúp', { exact: true }).waitFor();
  const helpArticleCount = await page.locator('h2').count();
  assert.ok(helpArticleCount > 0, 'Help center success data must render.');
  await page.screenshot({ path: screenshotPaths.help, fullPage: true });

  const ticketsResponsePromise = waitForApiResponse('GET', '/api/support/tickets', 200);
  await navigate('/w/support');
  const ticketsResponse = await ticketsResponsePromise;
  assert.equal(ticketsResponse.fromServiceWorker(), true);
  await page.getByRole('heading', { name: 'Tạo yêu cầu hỗ trợ' }).waitFor();
  const subject = `A06 support success ${date}`;
  const description = 'Local MSW browser verification; no backend request.';
  const subjectField = page.getByRole('textbox', { name: 'Tiêu đề ticket' });
  const descriptionField = page.getByRole('textbox', { name: 'Nội dung ticket' });
  assert.equal(await subjectField.isEnabled(), true, 'Support persona must expose ticket creation.');
  const initialTicketCount = await page.locator('h2').count();
  await subjectField.fill(subject);
  await descriptionField.fill(description);
  const ticketCreateResponsePromise = waitForApiResponse('POST', '/api/support/tickets', 201);
  const ticketRefreshResponsePromise = waitForApiResponse('GET', '/api/support/tickets', 200);
  await page.getByRole('button', { name: 'Gửi ticket' }).click();
  const ticketCreateResponse = await ticketCreateResponsePromise;
  const ticketRefreshResponse = await ticketRefreshResponsePromise;
  assert.equal(ticketCreateResponse.fromServiceWorker(), true);
  assert.equal(ticketRefreshResponse.fromServiceWorker(), true);
  const createdTicket = await ticketCreateResponse.json();
  assert.equal(createdTicket.subject, subject);
  assert.equal(createdTicket.description, description);
  await page.getByRole('heading', { name: subject }).waitFor();
  await page.screenshot({ path: screenshotPaths.tickets, fullPage: true });

  await Promise.all(responseTasks);
  const operationIds = [
    'listNews',
    'listNotifications',
    'markNotificationRead',
    'getHelpCenter',
    'listSupportTickets',
    'createSupportTicket',
  ];
  const observedOperationIds = [...new Set(apiResponses.map((response) => response.operationId).filter(Boolean))];
  const supportResponses = apiResponses.filter((response) => response.operationId);
  const supportRequests = apiRequests.filter((request) => request.operationId);
  const supportFailures = apiFailures.filter((failure) => failure.operationId);
  const supportTransportFailures = supportFailures.filter((failure) => !failure.hadResponse);
  const supportPostResponseAbortEvents = supportFailures.filter((failure) => failure.hadResponse);
  const markReadRecord = operationResponses('markNotificationRead')[0];
  const createTicketRecord = operationResponses('createSupportTicket')[0];
  const idempotencyFingerprints = [
    markReadRecord?.idempotencyKeyFingerprint,
    createTicketRecord?.idempotencyKeyFingerprint,
  ];

  if (supportFailures.length > 0) {
    console.log('Support request failure events (including post-response aborts):', JSON.stringify(supportFailures, null, 2));
  }
  assert.deepEqual(observedOperationIds.sort(), [...operationIds].sort());
  assert.equal(supportResponses.length, 8, 'Expected 8 Support API responses including two refetches.');
  assert.equal(supportRequests.length, supportResponses.length);
  assert.equal(supportResponses.every((response) => response.fromServiceWorker), true);
  assert.equal(supportTransportFailures.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);
  assert.ok(markReadRecord?.idempotencyKeyPresent);
  assert.ok(createTicketRecord?.idempotencyKeyPresent);
  assert.notEqual(idempotencyFingerprints[0], idempotencyFingerprints[1]);
  assert.equal(await page.locator('h2').count(), initialTicketCount + 1);

  const checkedAfter = new Date().toISOString();
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: 'Chromium via Playwright',
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: 'support.success',
      status: 'passed',
      persona: 'support (development preview)',
      operationIds,
      observedOperationIds,
      expectedDomainOperationCount: operationIds.length,
      coverage: 'full_scenario_operations_browser_observed',
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      allObservedResponsesFromServiceWorker: apiResponses.every((response) => response.fromServiceWorker),
      observedNetworkApiResponseCount: apiResponses.length,
      localMockMutationCount: 2,
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins].sort(),
      pageErrorCount: pageErrors.length,
      requestFailureCount: apiFailures.filter((failure) => !failure.hadResponse).length,
      postResponseAbortEventCount: apiFailures.filter((failure) => failure.hadResponse).length,
      supportOperationRequestFailureCount: supportTransportFailures.length,
      supportPostResponseAbortEventCount: supportPostResponseAbortEvents.length,
    },
    authorizationLimitations: {
      persona: 'support',
      mockSourcePermissions: ['support:read', 'support:write', 'notifications:read', 'notifications:write'],
      uiActionsEnabledForPersona: true,
      mswEnforcesSupportPermissions: false,
      backendAuthorizationVerified: false,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      completedAt: checkedAfter,
      apiRequestCount: apiRequests.length,
      apiResponseCount: apiResponses.length,
      supportOperationRequestCounts: Object.fromEntries(
        operationIds.map((id) => [id, supportRequests.filter((request) => request.operationId === id).length]),
      ),
      supportOperationResponseCounts: Object.fromEntries(
        operationIds.map((id) => [id, operationResponses(id).length]),
      ),
      notificationMarkReadStatus: markReadRecord.status,
      unreadCountBefore,
      unreadCountAfter: unreadCountBefore - 1,
      supportTicketCreateStatus: createTicketRecord.status,
      initialTicketHeadingCount: initialTicketCount,
      createdTicketId: createdTicket.id,
      createdTicketSubject: createdTicket.subject,
      idempotencyKeysPresent: {
        markNotificationRead: markReadRecord.idempotencyKeyPresent,
        createSupportTicket: createTicketRecord.idempotencyKeyPresent,
      },
      idempotencyKeyFingerprints: idempotencyFingerprints,
      externalApiOriginCount: externalApiOrigins.size,
      requestFailureCount: apiFailures.filter((failure) => !failure.hadResponse).length,
      postResponseAbortEventCount: apiFailures.filter((failure) => failure.hadResponse).length,
      supportOperationRequestFailureCount: supportTransportFailures.length,
      supportPostResponseAbortEventCount: supportPostResponseAbortEvents.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      personaApplied,
      news: { route: '/w/news', status: newsResponse.status(), visibleArticleCount: newsItemCount },
      notifications: {
        route: '/w/notifications', initialStatus: notificationsResponse.status(),
        markReadStatus: markReadRecord.status, refreshStatus: notificationRefreshResponse.status(),
        unreadCountBefore, unreadCountAfter: unreadCountBefore - 1,
        sidebarBadgeCount: sidebarNotificationBadgeCount,
        sidebarBadgeMatchesUnreadCount: sidebarNotificationBadgeCount === unreadCountBefore - 1,
      },
      help: { route: '/w/support/help', status: helpResponse.status(), visibleArticleCount: helpArticleCount },
      tickets: {
        route: '/w/support', initialStatus: ticketsResponse.status(),
        createStatus: createTicketRecord.status, refetchStatus: ticketRefreshResponse.status(),
        createdTicketId: createdTicket.id, createdTicketVisible: true,
      },
      apiResponses: supportResponses,
    },
    apiRequests,
    apiResponses,
    apiFailures,
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([name, file]) => [name, path.basename(file)]),
    ),
    sourceHashes,
    limitations: [
      'Two UI writes were confined to the browser service-worker MSW fixtures and in-memory data for this local preview.',
      'The mock handlers do not enforce authorization, idempotency replay, persistence or server-side validation guarantees.',
      'This run does not establish backend, staging, production or user-acceptance readiness.',
    ],
  };
  const formatted = await prettier.format(`${JSON.stringify(report)}\n`, { parser: 'json' });
  await fs.writeFile(reportPath, formatted, 'utf8');
  console.log(
    JSON.stringify(
      {
        reportPath: path.relative(root, reportPath),
        screenshotPaths: Object.fromEntries(
          Object.entries(screenshotPaths).map(([name, file]) => [name, path.relative(root, file)]),
        ),
        observedOperationIds,
        apiRequestCount: apiRequests.length,
        apiResponseCount: apiResponses.length,
        totalFlowMs: report.measurements.totalFlowMs,
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  await browser.close();
}

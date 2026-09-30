import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import prettier from "prettier";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../../../../");
const origin = new URL(process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4173");
assert.ok(
  ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname),
  "Loopback preview only.",
);
assert.equal(
  origin.pathname,
  "/",
  "PREVIEW_BASE_URL must be an origin without a path.",
);

const originUrl = origin.origin;
const checkedAt = new Date().toISOString();
const date = checkedAt.slice(0, 10);
const operationIds = [
  "listNews",
  "listNotifications",
  "markNotificationRead",
  "getHelpCenter",
  "listSupportTickets",
  "createSupportTicket",
];
const screenshotPaths = {
  news: path.join(directory, `preview-support-empty-news-${date}.png`),
  notifications: path.join(
    directory,
    `preview-support-empty-notifications-${date}.png`,
  ),
  help: path.join(directory, `preview-support-empty-help-${date}.png`),
  tickets: path.join(directory, `preview-support-empty-tickets-${date}.png`),
  createdTicket: path.join(
    directory,
    `preview-support-empty-created-ticket-${date}.png`,
  ),
};
const reportPath = path.join(
  directory,
  `support-empty-browser-check-${date}.json`,
);
const sourceFiles = [
  "contracts/openapi/support.yaml",
  "src/app/routeConfig.ts",
  "src/app/routes.ts",
  "src/app/components/layout/WebSidebar.tsx",
  "src/dev/PreviewControls.tsx",
  "src/dev/mocks/browser.ts",
  "src/dev/mocks/handlers.ts",
  "src/dev/mocks/personas.ts",
  "src/dev/mocks/scenario-runtime.ts",
  "src/dev/mocks/trading-fixtures.ts",
  "src/features/support/api/support-api.ts",
  "src/features/support/model/support-queries.ts",
  "src/features/support/model/support-types.ts",
  "src/features/support/pages/HelpCenterContractPage.tsx",
  "src/features/support/pages/NewsContractPage.tsx",
  "src/features/support/pages/NotificationsContractPage.tsx",
  "src/features/support/pages/SupportContractPage.tsx",
  "src/shared/api/app-client.ts",
  "src/shared/api/client.ts",
  "src/shared/api/http-client.ts",
  "src/shared/api/query-client.ts",
  "src/shared/session/useAuth.ts",
  "src/shared/ui/layout/Header.tsx",
  "src/main.tsx",
  "docs/architecture/production-readiness/evidence/A06/run-support-empty-browser-check.mjs",
];
const sha256 = async (file) =>
  crypto
    .createHash("sha256")
    .update(await fs.readFile(path.join(root, file)))
    .digest("hex");
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (file) => [file, await sha256(file)]),
  ),
);
const sourceHead = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd: root,
  encoding: "utf8",
}).trim();

const operationFor = (method, pathname) => {
  if (method === "GET" && pathname === "/api/content/news") return "listNews";
  if (method === "GET" && pathname === "/api/notifications")
    return "listNotifications";
  if (
    method === "POST" &&
    /^\/api\/notifications\/[^/]+\/read$/.test(pathname)
  ) {
    return "markNotificationRead";
  }
  if (method === "GET" && pathname === "/api/support/help")
    return "getHelpCenter";
  if (method === "GET" && pathname === "/api/support/tickets")
    return "listSupportTickets";
  if (method === "POST" && pathname === "/api/support/tickets")
    return "createSupportTicket";
  return null;
};
const isSupportScenarioPath = (pathname) =>
  pathname.startsWith("/api/content/") ||
  pathname.startsWith("/api/notifications") ||
  pathname.startsWith("/api/support/");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);

const startedAt = Date.now();
const apiRequests = [];
const apiResponses = [];
const apiFailures = [];
const unexpectedRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];
const requestRecords = new Map();
const requestsWithResponse = new Set();
const responseTasks = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("request", (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith("/api/")) return;
  const idempotencyKey = request.headers()["idempotency-key"] ?? "";
  const record = {
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname),
    idempotencyKeyPresent: Boolean(idempotencyKey),
    idempotencyKeyFingerprint: idempotencyKey
      ? crypto
          .createHash("sha256")
          .update(idempotencyKey)
          .digest("hex")
          .slice(0, 16)
      : null,
    startedAt: Date.now(),
  };
  requestRecords.set(request, record);
  apiRequests.push(record);
  if (isSupportScenarioPath(url.pathname) && !record.operationId)
    unexpectedRequests.push(record);
  if (url.origin !== originUrl) externalApiOrigins.add(url.origin);
});
page.on("response", (response) => {
  const task = (async () => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/api/")) return;
    const request = response.request();
    requestsWithResponse.add(request);
    const record = requestRecords.get(request);
    const idempotencyKey = request.headers()["idempotency-key"] ?? "";
    apiResponses.push({
      method: request.method(),
      path: url.pathname,
      operationId: record?.operationId ?? null,
      status: response.status(),
      fromServiceWorker: await response.fromServiceWorker(),
      elapsedMs: Date.now() - (record?.startedAt ?? Date.now()),
      idempotencyKeyPresent: Boolean(idempotencyKey),
      idempotencyKeyFingerprint: record?.idempotencyKeyFingerprint ?? null,
    });
  })();
  responseTasks.push(task);
});
page.on("requestfailed", (request) => {
  const url = new URL(request.url());
  if (!url.pathname.startsWith("/api/")) return;
  apiFailures.push({
    method: request.method(),
    path: url.pathname,
    operationId: operationFor(request.method(), url.pathname),
    failure: request.failure()?.errorText ?? "unknown",
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
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, pathname);
  await page.waitForURL((url) => url.pathname === pathname);
};
const responseFor = (operationId) =>
  apiResponses.filter((response) => response.operationId === operationId);

try {
  await page.goto(`${originUrl}/w/home`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="dev-preview-controls"]').waitFor();
  const expandPreview = page.getByRole("button", {
    name: "Mở công cụ xem trước",
  });
  if (await expandPreview.count()) await expandPreview.click();
  await page.waitForFunction(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  const serviceWorkerControlled = await page.evaluate(() =>
    Boolean(navigator.serviceWorker?.controller),
  );
  assert.equal(
    serviceWorkerControlled,
    true,
    "The local preview service worker must control the page.",
  );

  await page.locator("#preview-persona").selectOption("support");
  await page.getByRole("button", { name: "Áp dụng tài khoản" }).click();
  await page
    .locator('[data-testid="dev-preview-controls"]')
    .getByText("support@vittrade.local")
    .waitFor();
  await page.locator("#preview-domain").selectOption("support");
  await page.locator("#preview-state").selectOption("empty");
  await page.getByRole("button", { name: "Áp dụng trạng thái API" }).click();
  await page
    .getByTestId("active-preview-scenario")
    .getByText("support.empty")
    .waitFor();
  const personaAndScenarioApplied = true;
  const collapsePreview = page.getByRole("button", { name: "Thu gọn" });
  if (await collapsePreview.count()) await collapsePreview.click();

  const newsResponsePromise = waitForApiResponse(
    "GET",
    "/api/content/news",
    200,
  );
  await navigate("/w/news");
  const newsResponse = await newsResponsePromise;
  assert.equal(newsResponse.fromServiceWorker(), true);
  await page.getByText("Tin tức", { exact: true }).waitFor();
  const newsItemCount = await page.locator("h2").count();
  assert.ok(newsItemCount > 0);
  await page.screenshot({ path: screenshotPaths.news, fullPage: true });

  const notificationsResponsePromise = waitForApiResponse(
    "GET",
    "/api/notifications",
    200,
  );
  await navigate("/w/notifications");
  const notificationsResponse = await notificationsResponsePromise;
  assert.equal(notificationsResponse.fromServiceWorker(), true);
  const unreadSummary = page.getByText(/^\d+ chưa đọc$/).first();
  const unreadCountBefore = Number(
    (await unreadSummary.innerText()).match(/^\d+/)?.[0],
  );
  assert.ok(Number.isFinite(unreadCountBefore) && unreadCountBefore > 0);
  const markReadResponsePromise = page.waitForResponse(
    (response) =>
      operationFor(
        response.request().method(),
        new URL(response.url()).pathname,
      ) === "markNotificationRead",
  );
  const notificationRefreshPromise = waitForApiResponse(
    "GET",
    "/api/notifications",
    200,
  );
  await page.getByRole("button", { name: "Đã đọc" }).first().click();
  const markReadResponse = await markReadResponsePromise;
  const notificationRefreshResponse = await notificationRefreshPromise;
  assert.equal(markReadResponse.status(), 204);
  assert.equal(markReadResponse.fromServiceWorker(), true);
  assert.equal(notificationRefreshResponse.fromServiceWorker(), true);
  const unreadCountAfter = unreadCountBefore - 1;
  await page
    .getByText(`${unreadCountAfter} chưa đọc`, { exact: true })
    .waitFor();
  const notificationsNavText = await page
    .locator("button.web-sidebar-item")
    .filter({ hasText: "Thông báo" })
    .first()
    .innerText();
  const sidebarNotificationBadgeCount = Number(
    notificationsNavText.match(/\b\d+\b/)?.[0],
  );
  assert.ok(Number.isFinite(sidebarNotificationBadgeCount));
  await page.screenshot({
    path: screenshotPaths.notifications,
    fullPage: true,
  });

  const helpResponsePromise = waitForApiResponse(
    "GET",
    "/api/support/help",
    200,
  );
  await navigate("/w/support/help");
  const helpResponse = await helpResponsePromise;
  assert.equal(helpResponse.fromServiceWorker(), true);
  await page
    .getByRole("heading", { name: "Cách tạo tài khoản VitTrade" })
    .waitFor();
  const helpArticleCount = await page.locator("h2").count();
  assert.ok(helpArticleCount > 0);
  await page.screenshot({ path: screenshotPaths.help, fullPage: true });

  const ticketListResponsePromise = waitForApiResponse(
    "GET",
    "/api/support/tickets",
    200,
  );
  await navigate("/w/support");
  const ticketListResponse = await ticketListResponsePromise;
  const emptyTicketList = await ticketListResponse.json();
  assert.equal(ticketListResponse.fromServiceWorker(), true);
  assert.deepEqual(emptyTicketList, { items: [] });
  await page
    .getByText("Bạn chưa có yêu cầu hỗ trợ nào.", { exact: true })
    .waitFor();
  assert.equal(await page.getByRole("button", { name: "Thử lại" }).count(), 0);
  await page.screenshot({ path: screenshotPaths.tickets, fullPage: true });
  const subject = `A06 support empty ${date}`;
  await page.getByLabel("Tiêu đề ticket").fill(subject);
  await page
    .getByLabel("Nội dung ticket")
    .fill("Local MSW preview verification; no backend request.");
  const submitTicket = page.getByRole("button", { name: "Gửi ticket" });
  await submitTicket.waitFor({ state: "visible" });
  assert.equal(await submitTicket.isEnabled(), true);

  const createTicketResponsePromise = waitForApiResponse(
    "POST",
    "/api/support/tickets",
    201,
  );
  const refreshedTicketResponsePromise = waitForApiResponse(
    "GET",
    "/api/support/tickets",
    200,
  );
  await submitTicket.click();
  const [createTicketResponse, refreshedTicketResponse] = await Promise.all([
    createTicketResponsePromise,
    refreshedTicketResponsePromise,
  ]);
  const createdTicket = await createTicketResponse.json();
  const refreshedTicketList = await refreshedTicketResponse.json();
  assert.equal(createTicketResponse.fromServiceWorker(), true);
  assert.equal(refreshedTicketResponse.fromServiceWorker(), true);
  assert.equal(createdTicket.subject, subject);
  assert.equal(createdTicket.status, "open");
  assert.equal(
    refreshedTicketList.items.some((ticket) => ticket.id === createdTicket.id),
    true,
  );
  await page.getByRole("heading", { name: subject }).waitFor();
  await page.getByText("Đã gửi yêu cầu hỗ trợ.").last().waitFor();
  await page.screenshot({
    path: screenshotPaths.createdTicket,
    fullPage: true,
  });

  await Promise.all(responseTasks);
  const observedOperationIds = [
    ...new Set(
      apiResponses.map((response) => response.operationId).filter(Boolean),
    ),
  ];
  const scenarioResponses = apiResponses.filter(
    (response) => response.operationId,
  );
  const scenarioRequests = apiRequests.filter((request) => request.operationId);
  const scopedFailures = apiFailures.filter((failure) => failure.operationId);
  const transportFailures = scopedFailures.filter(
    (failure) => !failure.hadResponse,
  );
  const postResponseAbortEvents = scopedFailures.filter(
    (failure) => failure.hadResponse,
  );
  const markReadRecord = responseFor("markNotificationRead")[0];
  const createTicketRecord = responseFor("createSupportTicket")[0];
  assert.deepEqual(observedOperationIds.sort(), [...operationIds].sort());
  assert.deepEqual(
    Object.fromEntries(
      operationIds.map((id) => [
        id,
        scenarioRequests.filter((request) => request.operationId === id).length,
      ]),
    ),
    {
      listNews: 1,
      listNotifications: 2,
      markNotificationRead: 1,
      getHelpCenter: 1,
      listSupportTickets: 2,
      createSupportTicket: 1,
    },
  );
  assert.equal(scenarioResponses.length, 8);
  assert.equal(scenarioRequests.length, scenarioResponses.length);
  assert.equal(
    scenarioResponses.every((response) => response.fromServiceWorker),
    true,
  );
  assert.equal(unexpectedRequests.length, 0);
  assert.equal(transportFailures.length, 0);
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(pageErrors.length, 0);
  assert.ok(markReadRecord?.idempotencyKeyPresent);
  assert.ok(createTicketRecord?.idempotencyKeyPresent);
  assert.equal(new URL(page.url()).pathname, "/w/support");

  const checkedAfter = new Date().toISOString();
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceHead,
    branch,
    origin: originUrl,
    browser: "Chromium via Playwright",
    viewport: { width: 1440, height: 900 },
    scenario: {
      id: "support.empty",
      status: "passed",
      persona: "support (development preview)",
      operationIds,
      observedOperationIds,
      expectedDomainOperationCount: operationIds.length,
      coverage: "full_scenario_operations_browser_observed",
    },
    fixtureBoundary: {
      serviceWorkerControlled,
      personaAndScenarioApplied,
      allObservedResponsesFromServiceWorker: scenarioResponses.every(
        (response) => response.fromServiceWorker,
      ),
      observedScenarioResponseCount: scenarioResponses.length,
      localMockMutationCount: 2,
      realBackendRequestSent: false,
      realBackendMutationSent: false,
      externalApiOrigins: [...externalApiOrigins].sort(),
      unexpectedScenarioRequestCount: unexpectedRequests.length,
      pageErrorCount: pageErrors.length,
      scenarioTransportFailureCount: transportFailures.length,
      scenarioPostResponseAbortEventCount: postResponseAbortEvents.length,
    },
    measurements: {
      totalFlowMs: Date.now() - startedAt,
      completedAt: checkedAfter,
      scenarioRequestCount: scenarioRequests.length,
      scenarioResponseCount: scenarioResponses.length,
      scenarioOperationRequestCounts: Object.fromEntries(
        operationIds.map((id) => [
          id,
          scenarioRequests.filter((request) => request.operationId === id)
            .length,
        ]),
      ),
      scenarioOperationResponseCounts: Object.fromEntries(
        operationIds.map((id) => [id, responseFor(id).length]),
      ),
      notificationMarkReadStatus: markReadRecord.status,
      unreadCountBefore,
      unreadCountAfter,
      sidebarNotificationBadgeCount,
      sidebarBadgeMatchesUnreadCount:
        sidebarNotificationBadgeCount === unreadCountAfter,
      initialTicketListStatus: ticketListResponse.status(),
      initialTicketListItemCount: emptyTicketList.items.length,
      ticketCreateStatus: createTicketRecord.status,
      createdTicketId: createdTicket.id,
      createdTicketSubject: createdTicket.subject,
      refreshedTicketCount: refreshedTicketList.items.length,
      idempotencyKeysPresent: {
        markNotificationRead: markReadRecord.idempotencyKeyPresent,
        createSupportTicket: createTicketRecord.idempotencyKeyPresent,
      },
      idempotencyKeyFingerprints: [
        markReadRecord.idempotencyKeyFingerprint,
        createTicketRecord.idempotencyKeyFingerprint,
      ],
      externalApiOriginCount: externalApiOrigins.size,
      scenarioTransportFailureCount: transportFailures.length,
      scenarioPostResponseAbortEventCount: postResponseAbortEvents.length,
      pageErrorCount: pageErrors.length,
    },
    assertions: {
      news: {
        route: "/w/news",
        status: newsResponse.status(),
        visibleHeadingCount: newsItemCount,
      },
      notifications: {
        route: "/w/notifications",
        initialStatus: notificationsResponse.status(),
        markReadStatus: markReadResponse.status(),
        refreshStatus: notificationRefreshResponse.status(),
        unreadCountBefore,
        unreadCountAfter,
        sidebarNotificationBadgeCount,
        sidebarBadgeMatchesUnreadCount:
          sidebarNotificationBadgeCount === unreadCountAfter,
      },
      help: {
        route: "/w/support/help",
        status: helpResponse.status(),
        visibleArticleCount: helpArticleCount,
      },
      tickets: {
        route: "/w/support",
        initialStatus: ticketListResponse.status(),
        initialItemCount: emptyTicketList.items.length,
        emptyGuidanceVisible: true,
        retryActionVisible: false,
        createStatus: createTicketResponse.status(),
        refetchStatus: refreshedTicketResponse.status(),
        createdTicketVisible: true,
      },
      apiResponses: scenarioResponses,
    },
    apiRequests,
    apiResponses,
    apiFailures,
    screenshots: Object.fromEntries(
      Object.entries(screenshotPaths).map(([name, file]) => [
        name,
        path.basename(file),
      ]),
    ),
    sourceHashes,
    limitations: [
      "The notification-read and ticket-create writes were handled only by the local service-worker MSW fixture.",
      "The notification-read POST emitted net::ERR_ABORTED after HTTP 204; it had a response and no Support scenario request failed before an HTTP response.",
      "MSW does not prove backend authorization, persistence, idempotency replay, server validation or production behavior.",
      "This browser run does not constitute user acceptance or backend/staging evidence.",
    ],
  };
  const formatted = await prettier.format(`${JSON.stringify(report)}\n`, {
    parser: "json",
  });
  await fs.writeFile(reportPath, formatted, "utf8");
  console.log(
    JSON.stringify(
      {
        reportPath: path.relative(root, reportPath),
        screenshotPaths: Object.fromEntries(
          Object.entries(screenshotPaths).map(([name, file]) => [
            name,
            path.relative(root, file),
          ]),
        ),
        observedOperationIds,
        scenarioRequestCount: scenarioRequests.length,
        scenarioResponseCount: scenarioResponses.length,
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

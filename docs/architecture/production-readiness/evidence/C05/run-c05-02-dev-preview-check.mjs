import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const baseUrl = process.env.C05_PREVIEW_URL ?? 'http://127.0.0.1:5189';
const origin = new URL(baseUrl).origin;
const sourceFiles = [
  'src/main.tsx',
  'src/shared/config/env.ts',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/browser-policy.ts',
  'vite.config.ts',
];
const hashFile = (relativePath) =>
  createHash('sha256')
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest('hex');
const observations = {
  schemaVersion: 1,
  taskId: 'C05',
  stepId: 'C05.02',
  observedAt: new Date().toISOString(),
  environment: {
    os: 'Windows',
    runtime: process.version,
    browser: null,
    url: origin,
    apiDataSource: 'mock',
    backendConnected: false,
    cleanBrowserContext: true,
  },
  routes: [],
  serviceWorkers: [],
  apiRequests: [],
  apiResponses: [],
  nonApiRequests: [],
  failedRequests: [],
  pageErrors: [],
  consoleErrors: [],
  sourceSha256: Object.fromEntries(sourceFiles.map((file) => [file, hashFile(file)])),
  screenshots: [],
};

const browser = await chromium.launch({ headless: true });
observations.environment.browser = `Chromium ${browser.version()}`;
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

page.on('request', (request) => {
  const requestUrl = new URL(request.url());
  if (requestUrl.pathname.startsWith('/api/')) {
    observations.apiRequests.push({
      method: request.method(),
      url: request.url(),
      origin: requestUrl.origin,
      crossOrigin: requestUrl.origin !== origin,
    });
  } else if (requestUrl.protocol.startsWith('http')) {
    observations.nonApiRequests.push({ method: request.method(), url: request.url() });
  }
});
page.on('requestfailed', (request) => {
  observations.failedRequests.push({
    method: request.method(),
    url: request.url(),
    error: request.failure()?.errorText ?? 'unknown',
  });
});
page.on('pageerror', (error) => observations.pageErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') observations.consoleErrors.push(message.text());
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/')) return;
  observations.apiResponses.push({
    method: response.request().method(),
    url: response.url(),
    origin: url.origin,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
});

try {
  const routes = [
    {
      id: 'ROUTE-626b52f4ed7c',
      path: '/w/markets',
      screenshot: 'c05-02-dev-market-2026-09-30.png',
    },
    {
      id: 'ROUTE-1f4f526bb861',
      path: '/w/auth/login',
      screenshot: 'c05-02-dev-login-2026-09-30.png',
    },
  ];

  for (const route of routes) {
    const apiRequestStart = observations.apiRequests.length;
    const apiResponseStart = observations.apiResponses.length;
    const response = await page.goto(new URL(route.path, baseUrl).href, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2500);
    const pageState = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      headings: [...document.querySelectorAll('h1,h2')]
        .map((element) => element.textContent?.trim())
        .filter(Boolean),
      mockBannerVisible: [...document.querySelectorAll('body *')].some(
        (element) =>
          element.childElementCount === 0 && /DỮ LIỆU MÔ PHỎNG/i.test(element.textContent ?? ''),
      ),
      loginInputCount: document.querySelectorAll('input[type="email"],input[name="email"]').length,
      serviceWorkerController: navigator.serviceWorker?.controller?.scriptURL ?? null,
    }));
    observations.routes.push({
      routeId: route.id,
      requestedPath: route.path,
      finalPath: new URL(pageState.url).pathname,
      status: response?.status() ?? null,
      ...pageState,
      apiRequests: observations.apiRequests.slice(apiRequestStart),
      apiResponses: observations.apiResponses.slice(apiResponseStart),
    });
    await page.screenshot({ path: path.join(directory, route.screenshot), fullPage: true });
    observations.screenshots.push(route.screenshot);
  }

  observations.serviceWorkers = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return [];
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map((registration) => ({
      scope: registration.scope,
      activeScriptUrl: registration.active?.scriptURL ?? null,
      waitingScriptUrl: registration.waiting?.scriptURL ?? null,
    }));
  });
  const workerRegistered = observations.serviceWorkers.some((registration) =>
    registration.activeScriptUrl?.endsWith('/mockServiceWorker.js'),
  );
  const guestSessionUnauthorizedResponses = observations.apiResponses.filter((response) => {
    const url = new URL(response.url);
    return url.pathname === '/api/auth/session' && response.status === 401;
  });
  const unexpectedConsoleErrors = observations.consoleErrors.filter(
    (message) => !/status of 401 \(Unauthorized\)/i.test(message),
  );
  const assertions = {
    routePagesRendered: observations.routes.every((route) => route.status === 200),
    mockBannerVisibleOnAllRoutes: observations.routes.every((route) => route.mockBannerVisible),
    mockServiceWorkerRegistered: workerRegistered,
    apiResponsesObserved: observations.apiResponses.length > 0,
    allApiResponsesFromServiceWorker:
      observations.apiResponses.length > 0 &&
      observations.apiResponses.every((response) => response.fromServiceWorker),
    noCrossOriginApiRequests: [...observations.apiRequests, ...observations.apiResponses].every(
      (request) => request.origin === origin,
    ),
    guestSession401MatchesConsoleSignals:
      guestSessionUnauthorizedResponses.length === observations.routes.length &&
      unexpectedConsoleErrors.length === 0 &&
      observations.consoleErrors.length === guestSessionUnauthorizedResponses.length,
    noFailedApiRequests: observations.failedRequests.every(
      (request) => !new URL(request.url).pathname.startsWith('/api/'),
    ),
    noUncaughtPageErrors: observations.pageErrors.length === 0,
  };
  observations.guestSessionUnauthorizedResponses = guestSessionUnauthorizedResponses.length;
  observations.unexpectedConsoleErrors = unexpectedConsoleErrors;
  observations.assertions = assertions;
  observations.result = Object.values(assertions).every(Boolean) ? 'pass' : 'fail';
  observations.limitations = [
    'This is a local development/mock check on two representative routes, not all 427 routes or 128 user-acceptance pages.',
    'MSW responses and local fixtures do not verify backend, persistence, authorization, staging, production, or user acceptance.',
    'Non-API browser requests are retained as observations; only API requests are used for the no-backend assertion.',
  ];
  fs.writeFileSync(
    path.join(directory, 'c05-02-dev-preview-browser-check-2026-09-30.json'),
    `${JSON.stringify(observations, null, 2)}\n`,
  );
  console.log(
    JSON.stringify(
      {
        result: observations.result,
        assertions,
        routes: observations.routes.map((route) => ({
          routeId: route.routeId,
          requestedPath: route.requestedPath,
          finalPath: route.finalPath,
          status: route.status,
          mockBannerVisible: route.mockBannerVisible,
          apiRequests: route.apiRequests,
          apiResponses: route.apiResponses,
        })),
        serviceWorkers: observations.serviceWorkers,
        apiResponses: observations.apiResponses,
        failedRequests: observations.failedRequests.length,
        pageErrors: observations.pageErrors.length,
        consoleErrors: observations.consoleErrors.length,
        unexpectedConsoleErrors: unexpectedConsoleErrors.length,
        screenshots: observations.screenshots,
      },
      null,
      2,
    ),
  );
  if (observations.result !== 'pass') process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}

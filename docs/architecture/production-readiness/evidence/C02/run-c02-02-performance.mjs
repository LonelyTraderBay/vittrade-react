import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = process.cwd();
const baseUrl = process.env.C02_BASE_URL ?? 'http://127.0.0.1:4173';
const password = process.env.C02_PREVIEW_PASSWORD;
const trialsPerProfile = Number(process.env.C02_TRIALS ?? 5);
const productionDocs = 'docs/architecture/production-readiness';
const evidenceDirectory = path.join(root, productionDocs, 'evidence/C02');
const journeys = [
  { id: 'login', path: '/w/auth/login', persona: null, mode: 'document' },
  { id: 'markets', path: '/w/markets/overview', persona: 'market', api: '/api/market/overview' },
  {
    id: 'terminal',
    path: '/w/trade/btcusdt',
    persona: 'developer',
    api: '/api/market/pairs/btcusdt',
  },
  { id: 'wallet', path: '/w/wallet', persona: 'wallet', api: '/api/wallet/assets' },
  {
    id: 'p2p-order-room',
    path: '/w/p2p/order/p2p001',
    persona: 'developer',
    api: '/api/p2p/orders/p2p001',
  },
  { id: 'dca-savings', path: '/w/earn/savings/dca', persona: 'dca', api: '/api/dca/snapshot' },
];

if (!Number.isInteger(trialsPerProfile) || trialsPerProfile < 5) {
  throw new Error('C02_TRIALS must be an integer of at least 5.');
}
if (journeys.some((journey) => journey.persona) && !password) {
  throw new Error(
    'Set C02_PREVIEW_PASSWORD to the local preview fixture password; it is never written to evidence.',
  );
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

async function sourceHashes() {
  const sources = [
    'src/app/routes.ts',
    'src/app/routes/tradingProtectedRoutes.ts',
    'src/app/components/layout/WebSidebar.tsx',
    'src/features/auth/pages/WebLoginPage.tsx',
    'src/features/market/routes.ts',
    'src/features/trading/routes.ts',
    'src/features/wallet/routes.ts',
    'src/features/p2p/routes.ts',
    'src/features/dca/routes.ts',
    'src/dev/mocks/personas.ts',
    'src/dev/mocks/handlers.ts',
    'src/dev/mocks/trading-fixtures.ts',
    'src/dev/mocks/market-overview-fixtures.ts',
    'src/dev/mocks/dca-fixtures.ts',
    'src/shared/config/env.ts',
    'docs/architecture/page-inventory.json',
    'docs/architecture/production-readiness/PERFORMANCE.md',
    'docs/architecture/production-readiness/evidence/C02/run-c02-02-performance.mjs',
  ];
  return Object.fromEntries(
    await Promise.all(
      sources.map(async (source) => [source, sha256(await readFile(path.join(root, source)))]),
    ),
  );
}

function summarizeRows(value, prefix = '$', rows = []) {
  if (Array.isArray(value)) {
    rows.push({ path: prefix, count: value.length });
    for (const [index, item] of value.slice(0, 3).entries())
      summarizeRows(item, `${prefix}[${index}]`, rows);
  } else if (value && typeof value === 'object' && rows.length < 40) {
    for (const [key, item] of Object.entries(value)) summarizeRows(item, `${prefix}.${key}`, rows);
  }
  return rows.slice(0, 40);
}

function metricMap(entries) {
  return Object.fromEntries(entries.map(({ name, value }) => [name, value]));
}

function deltaMetric(before, after, name, multiplier = 1000) {
  if (typeof before[name] !== 'number' || typeof after[name] !== 'number') return null;
  return Number(((after[name] - before[name]) * multiplier).toFixed(3));
}

async function newMeasurementPage(context) {
  const page = await context.newPage();
  const requestEvents = [];
  const responseEvents = [];
  const requestFailures = [];
  const pageErrors = [];
  const responseTasks = [];

  await page.addInitScript(() => {
    window.__c02LongTasks = [];
    if (
      'PerformanceObserver' in window &&
      PerformanceObserver.supportedEntryTypes?.includes('longtask')
    ) {
      new PerformanceObserver((list) =>
        window.__c02LongTasks.push(
          ...list.getEntries().map((entry) => ({
            startTime: entry.startTime,
            duration: entry.duration,
          })),
        ),
      ).observe({ type: 'longtask', buffered: true });
    }
  });

  page.on('request', (request) => {
    const url = new URL(request.url());
    requestEvents.push({
      method: request.method(),
      path: url.pathname,
      origin: url.origin,
      resourceType: request.resourceType(),
    });
  });
  page.on('requestfailed', (request) => {
    requestFailures.push({
      path: new URL(request.url()).pathname,
      error: request.failure()?.errorText ?? 'unknown',
    });
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/')) return;
    const timing = response.request().timing();
    const item = {
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      durationMs:
        timing.responseEnd >= 0
          ? Number((timing.responseEnd - timing.requestStart).toFixed(3))
          : null,
      bodyShape: null,
      rowCounts: [],
      bodyParseError: null,
    };
    responseEvents.push(item);
    responseTasks.push(
      response
        .json()
        .then((body) => {
          item.bodyShape = Array.isArray(body)
            ? { type: 'array', count: body.length }
            : body && typeof body === 'object'
              ? { type: 'object', keys: Object.keys(body).sort() }
              : { type: typeof body };
          item.rowCounts = summarizeRows(body);
        })
        .catch((error) => {
          item.bodyParseError = error instanceof Error ? error.message : String(error);
        }),
    );
  });

  let cdp = null;
  try {
    cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
  } catch {
    cdp = null;
  }
  return { page, requestEvents, responseEvents, requestFailures, pageErrors, responseTasks, cdp };
}

async function cdpMetrics(cdp) {
  if (!cdp) return {};
  try {
    return metricMap((await cdp.send('Performance.getMetrics')).metrics);
  } catch {
    return {};
  }
}

async function profileData(page, startMark, endMark) {
  return page.evaluate(
    ({ startMark, endMark }) => {
      const start = performance.getEntriesByName(startMark, 'mark').at(-1)?.startTime ?? 0;
      const end =
        performance.getEntriesByName(endMark, 'mark').at(-1)?.startTime ?? performance.now();
      const resources = performance
        .getEntriesByType('resource')
        .filter((entry) => entry.startTime >= start && entry.startTime <= end)
        .map((entry) => ({
          name: entry.name,
          initiatorType: entry.initiatorType,
          startTime: entry.startTime,
          responseEnd: entry.responseEnd,
          duration: entry.duration,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
        }));
      const scripts = resources.filter(
        (entry) =>
          entry.initiatorType === 'script' || /\.(?:m?js|tsx?)(?:[?#]|$)/i.test(entry.name),
      );
      const stylesheets = resources.filter(
        (entry) => entry.initiatorType === 'css' || /\.css(?:[?#]|$)/i.test(entry.name),
      );
      const tasks = (window.__c02LongTasks ?? []).filter(
        (entry) => entry.startTime >= start && entry.startTime <= end,
      );
      const apiResources = resources.filter((entry) =>
        new URL(entry.name).pathname.startsWith('/api/'),
      );
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1);
      return {
        routeRenderMs: Number((end - start).toFixed(3)),
        resources,
        scriptResourceCount: scripts.length,
        jsTransferBytes: scripts.reduce((sum, entry) => sum + entry.transferSize, 0),
        jsEncodedBytes: scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
        scriptResources: scripts.map((entry) => ({
          path: new URL(entry.name).pathname,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
        })),
        cssResourceCount: stylesheets.length,
        cssTransferBytes: stylesheets.reduce((sum, entry) => sum + entry.transferSize, 0),
        cssEncodedBytes: stylesheets.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
        stylesheetResources: stylesheets.map((entry) => ({
          path: new URL(entry.name).pathname,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
        })),
        apiResources: apiResources.map(
          ({
            name,
            initiatorType,
            startTime,
            responseEnd,
            duration,
            transferSize,
            encodedBodySize,
          }) => ({
            path: new URL(name).pathname,
            initiatorType,
            startTime: Number(startTime.toFixed(3)),
            responseEnd: Number(responseEnd.toFixed(3)),
            durationMs: Number(duration.toFixed(3)),
            transferSize,
            encodedBodySize,
          }),
        ),
        longTaskCount: tasks.length,
        longTaskTotalMs: Number(tasks.reduce((sum, task) => sum + task.duration, 0).toFixed(3)),
        longTaskMaxMs: tasks.length
          ? Number(Math.max(...tasks.map((task) => task.duration)).toFixed(3))
          : 0,
        documentNavigation: nav
          ? {
              responseStartMs: Number(nav.responseStart.toFixed(3)),
              domContentLoadedMs: Number(nav.domContentLoadedEventEnd.toFixed(3)),
              loadMs: Number(nav.loadEventEnd.toFixed(3)),
              fcpMs:
                paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? null,
              documentLcpMs: lcp?.startTime ?? null,
            }
          : null,
      };
    },
    { startMark, endMark },
  );
}

async function waitForJourney(page, journey) {
  if (journey.id === 'login') {
    await page
      .locator('[data-testid="auth-submit"]')
      .waitFor({ state: 'visible', timeout: 15_000 });
    return;
  }
  await page.waitForFunction(
    (id) => {
      const body = document.body?.innerText ?? '';
      switch (id) {
        case 'markets':
          return body.includes('Hiệu suất ngành');
        case 'terminal':
          return (
            body.includes('Đặt lệnh') &&
            body.includes('BTC/USDT') &&
            !body.includes('Đang tải dữ liệu thị trường')
          );
        case 'wallet':
          return body.includes('Recent activity') && body.includes('Assets (');
        case 'p2p-order-room':
          return body.includes('Order #VT-P2P-20240223-001');
        case 'dca-savings':
          return body.includes('Savings DCA');
        default:
          return false;
      }
    },
    journey.id,
    { timeout: 15_000 },
  );
}

async function authenticate(page, persona) {
  await page.goto(new URL('/w/auth/login', baseUrl).href, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="auth-email"]').fill(`${persona}@vittrade.local`);
  await page.locator('[data-testid="auth-password"]').fill(password);
  await page.locator('[data-testid="auth-submit"]').click();
  await page.waitForURL((url) => url.pathname === '/w/home', { timeout: 15_000 });
  await page.waitForTimeout(150);
}

async function navigateSpa(page, journey, measurement) {
  const requestStart = measurement.requestEvents.length;
  const responseStart = measurement.responseEvents.length;
  const failureStart = measurement.requestFailures.length;
  const pageErrorStart = measurement.pageErrors.length;
  const metricsBefore = await cdpMetrics(measurement.cdp);
  const startedAt = new Date().toISOString();
  const hostStarted = process.hrtime.bigint();
  await page.evaluate((route) => {
    performance.mark('c02-route-start');
    history.pushState({}, '', route);
    dispatchEvent(new PopStateEvent('popstate'));
  }, journey.path);
  await waitForJourney(page, journey);
  await page.evaluate(() => performance.mark('c02-route-end'));
  const hostDurationMs = Number((Number(process.hrtime.bigint() - hostStarted) / 1e6).toFixed(3));
  await page.waitForTimeout(100);
  const metricsAfter = await cdpMetrics(measurement.cdp);
  await Promise.allSettled(measurement.responseTasks.slice(responseStart));
  const profile = await profileData(page, 'c02-route-start', 'c02-route-end');
  const routeRequests = measurement.requestEvents.slice(requestStart);
  const apiResponses = measurement.responseEvents.slice(responseStart);
  const requiredResponse = apiResponses.find(
    (response) => response.path === journey.api && response.status === 200,
  );
  const bodyText = await page.locator('body').innerText();
  return {
    observedAt: startedAt,
    journey: journey.id,
    persona: journey.persona,
    route: journey.path,
    navigationKind: 'client-side history.pushState + popstate; shell click selection time excluded',
    routeRenderMs: profile.routeRenderMs,
    hostObservedMs: hostDurationMs,
    responseStatuses: apiResponses.map(
      ({
        method,
        path,
        status,
        fromServiceWorker,
        durationMs,
        bodyShape,
        rowCounts,
        bodyParseError,
      }) => ({
        method,
        path,
        status,
        fromServiceWorker,
        playwrightRequestDurationMs: durationMs,
        browserResourceDurationMs:
          profile.apiResources.find((resource) => resource.path === path)?.durationMs ?? null,
        bodyShape,
        rowCounts,
        bodyParseError,
      }),
    ),
    routeResponseCounts: apiResponses.map(({ path, rowCounts }) => ({ path, rowCounts })),
    requestCount: routeRequests.length,
    requestPaths: routeRequests.map(({ method, path, origin, resourceType }) => ({
      method,
      path,
      origin,
      resourceType,
    })),
    apiRequestCount: routeRequests.filter((request) => request.path.startsWith('/api/')).length,
    apiOrigins: [
      ...new Set(
        routeRequests
          .filter((request) => request.path.startsWith('/api/'))
          .map((request) => request.origin),
      ),
    ],
    requestFailures: measurement.requestFailures.slice(failureStart),
    pageErrors: measurement.pageErrors.slice(pageErrorStart),
    scriptDurationMs: deltaMetric(metricsBefore, metricsAfter, 'ScriptDuration'),
    taskDurationMs: deltaMetric(metricsBefore, metricsAfter, 'TaskDuration'),
    jsHeapUsedBytes:
      typeof metricsAfter.JSHeapUsedSize === 'number'
        ? Math.round(metricsAfter.JSHeapUsedSize)
        : null,
    longTaskCount: profile.longTaskCount,
    longTaskTotalMs: profile.longTaskTotalMs,
    longTaskMaxMs: profile.longTaskMaxMs,
    scriptResourceCount: profile.scriptResourceCount,
    scriptResources: profile.scriptResources,
    jsTransferBytes: profile.jsTransferBytes,
    jsEncodedBytes: profile.jsEncodedBytes,
    cssResourceCount: profile.cssResourceCount,
    stylesheetResources: profile.stylesheetResources,
    cssTransferBytes: profile.cssTransferBytes,
    cssEncodedBytes: profile.cssEncodedBytes,
    resourceCount: profile.resources.length,
    apiResources: profile.apiResources,
    stableUiMarker:
      journey.id === 'markets'
        ? 'Hiệu suất ngành'
        : journey.id === 'terminal'
          ? 'BTC/USDT + Đặt lệnh'
          : journey.id === 'wallet'
            ? 'Recent activity + Assets'
            : journey.id === 'p2p-order-room'
              ? 'Order #VT-P2P-20240223-001'
              : 'Savings DCA',
    markerObserved:
      journey.id === 'markets'
        ? bodyText.includes('Hiệu suất ngành')
        : journey.id === 'terminal'
          ? bodyText.includes('Đặt lệnh') && bodyText.includes('BTC/USDT')
          : journey.id === 'wallet'
            ? bodyText.includes('Recent activity') && bodyText.includes('Assets (')
            : journey.id === 'p2p-order-room'
              ? bodyText.includes('Order #VT-P2P-20240223-001')
              : bodyText.includes('Savings DCA'),
    requiredApiResponseObserved: Boolean(requiredResponse),
    requiredApiStatus:
      apiResponses.find((response) => response.path === journey.api)?.status ?? null,
  };
}

async function navigateDocument(page, journey, runType, trial) {
  const requestStart = page.__c02.requestEvents.length;
  const responseStart = page.__c02.responseEvents.length;
  const failureStart = page.__c02.requestFailures.length;
  const pageErrorStart = page.__c02.pageErrors.length;
  const metricsBefore = await cdpMetrics(page.__c02.cdp);
  const startedAt = new Date().toISOString();
  const hostStarted = process.hrtime.bigint();
  await page.goto(new URL(journey.path, baseUrl).href, { waitUntil: 'domcontentloaded' });
  await waitForJourney(page, journey);
  const hostDurationMs = Number((Number(process.hrtime.bigint() - hostStarted) / 1e6).toFixed(3));
  await page.waitForTimeout(100);
  const metricsAfter = await cdpMetrics(page.__c02.cdp);
  await Promise.allSettled(page.__c02.responseTasks.slice(responseStart));
  const profile = await profileData(page, 'navigation-start', 'navigation-end').catch(async () =>
    page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource').map((entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        startTime: entry.startTime,
        responseEnd: entry.responseEnd,
        duration: entry.duration,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
      }));
      const scripts = resources.filter(
        (entry) =>
          entry.initiatorType === 'script' || /\.(?:m?js|tsx?)(?:[?#]|$)/i.test(entry.name),
      );
      const stylesheets = resources.filter(
        (entry) => entry.initiatorType === 'css' || /\.css(?:[?#]|$)/i.test(entry.name),
      );
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1);
      const tasks = window.__c02LongTasks ?? [];
      return {
        routeRenderMs: null,
        resources,
        scriptResourceCount: scripts.length,
        jsTransferBytes: scripts.reduce((sum, entry) => sum + entry.transferSize, 0),
        jsEncodedBytes: scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
        scriptResources: scripts.map((entry) => ({
          path: new URL(entry.name).pathname,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
        })),
        cssResourceCount: stylesheets.length,
        cssTransferBytes: stylesheets.reduce((sum, entry) => sum + entry.transferSize, 0),
        cssEncodedBytes: stylesheets.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
        stylesheetResources: stylesheets.map((entry) => ({
          path: new URL(entry.name).pathname,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
        })),
        apiResources: resources
          .filter((entry) => new URL(entry.name).pathname.startsWith('/api/'))
          .map(
            ({
              name,
              initiatorType,
              startTime,
              responseEnd,
              duration,
              transferSize,
              encodedBodySize,
            }) => ({
              path: new URL(name).pathname,
              initiatorType,
              startTime: Number(startTime.toFixed(3)),
              responseEnd: Number(responseEnd.toFixed(3)),
              durationMs: Number(duration.toFixed(3)),
              transferSize,
              encodedBodySize,
            }),
          ),
        longTaskCount: tasks.length,
        longTaskTotalMs: Number(tasks.reduce((sum, entry) => sum + entry.duration, 0).toFixed(3)),
        longTaskMaxMs: tasks.length
          ? Number(Math.max(...tasks.map((entry) => entry.duration)).toFixed(3))
          : 0,
        documentNavigation: nav
          ? {
              responseStartMs: Number(nav.responseStart.toFixed(3)),
              domContentLoadedMs: Number(nav.domContentLoadedEventEnd.toFixed(3)),
              loadMs: Number(nav.loadEventEnd.toFixed(3)),
              fcpMs:
                paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? null,
              documentLcpMs: lcp?.startTime ?? null,
            }
          : null,
      };
    }),
  );
  const routeRequests = page.__c02.requestEvents.slice(requestStart);
  const apiResponses = page.__c02.responseEvents.slice(responseStart);
  return {
    observedAt: startedAt,
    journey: journey.id,
    persona: 'public-unauthenticated-login-form',
    route: journey.path,
    navigationKind: 'document navigation; navigation-to-login-form render',
    hostObservedMs: hostDurationMs,
    documentNavigation: profile.documentNavigation,
    responseStatuses: apiResponses.map(
      ({
        method,
        path,
        status,
        fromServiceWorker,
        durationMs,
        bodyShape,
        rowCounts,
        bodyParseError,
      }) => ({
        method,
        path,
        status,
        fromServiceWorker,
        playwrightRequestDurationMs: durationMs,
        browserResourceDurationMs:
          profile.apiResources.find((resource) => resource.path === path)?.durationMs ?? null,
        bodyShape,
        rowCounts,
        bodyParseError,
      }),
    ),
    routeResponseCounts: apiResponses.map(({ path, rowCounts }) => ({ path, rowCounts })),
    requestCount: routeRequests.length,
    requestPaths: routeRequests.map(({ method, path, origin, resourceType }) => ({
      method,
      path,
      origin,
      resourceType,
    })),
    apiRequestCount: routeRequests.filter((request) => request.path.startsWith('/api/')).length,
    apiOrigins: [
      ...new Set(
        routeRequests
          .filter((request) => request.path.startsWith('/api/'))
          .map((request) => request.origin),
      ),
    ],
    requestFailures: page.__c02.requestFailures.slice(failureStart),
    pageErrors: page.__c02.pageErrors.slice(pageErrorStart),
    scriptDurationMs: null,
    taskDurationMs: null,
    jsHeapUsedBytes:
      typeof metricsAfter.JSHeapUsedSize === 'number'
        ? Math.round(metricsAfter.JSHeapUsedSize)
        : null,
    longTaskCount: profile.longTaskCount,
    longTaskTotalMs: profile.longTaskTotalMs,
    longTaskMaxMs: profile.longTaskMaxMs,
    scriptResourceCount: profile.scriptResourceCount,
    scriptResources: profile.scriptResources,
    jsTransferBytes: profile.jsTransferBytes,
    jsEncodedBytes: profile.jsEncodedBytes,
    cssResourceCount: profile.cssResourceCount,
    stylesheetResources: profile.stylesheetResources,
    cssTransferBytes: profile.cssTransferBytes,
    cssEncodedBytes: profile.cssEncodedBytes,
    resourceCount: profile.resources.length,
    apiResources: profile.apiResources,
    stableUiMarker: 'auth-submit button + Đăng nhập heading',
    markerObserved: true,
    requiredApiResponseObserved: true,
    requiredApiStatus: null,
    trialType: runType,
    trial,
  };
}

async function openContext(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    serviceWorkers: 'allow',
  });
  const measurement = await newMeasurementPage(context);
  measurement.page.__c02 = measurement;
  return { context, measurement };
}

async function runDocumentJourney(browser, journey, results) {
  for (let trial = 1; trial <= trialsPerProfile; trial += 1) {
    const { context, measurement } = await openContext(browser);
    try {
      results.push({
        profile: 'cold',
        trial,
        ...(await navigateDocument(measurement.page, journey, 'cold', trial)),
      });
    } catch (error) {
      results.push({
        profile: 'cold',
        trial,
        journey: journey.id,
        route: journey.path,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await context.close();
    }
  }

  const { context, measurement } = await openContext(browser);
  try {
    await measurement.page.goto(new URL(journey.path, baseUrl).href, {
      waitUntil: 'domcontentloaded',
    });
    await waitForJourney(measurement.page, journey);
    for (let trial = 1; trial <= trialsPerProfile; trial += 1) {
      results.push({
        profile: 'warm',
        trial,
        ...(await navigateDocument(measurement.page, journey, 'warm', trial)),
      });
    }
  } finally {
    await context.close();
  }
}

async function runAuthenticatedJourney(browser, journey, results) {
  for (let trial = 1; trial <= trialsPerProfile; trial += 1) {
    const { context, measurement } = await openContext(browser);
    try {
      await authenticate(measurement.page, journey.persona);
      const result = await navigateSpa(measurement.page, journey, measurement);
      results.push({ profile: 'cold', trial, ...result });
    } catch (error) {
      results.push({
        profile: 'cold',
        trial,
        journey: journey.id,
        persona: journey.persona,
        route: journey.path,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await context.close();
    }
  }

  const { context, measurement } = await openContext(browser);
  try {
    await authenticate(measurement.page, journey.persona);
    await navigateSpa(measurement.page, journey, measurement);
    for (let trial = 1; trial <= trialsPerProfile; trial += 1) {
      await measurement.page.evaluate(() => {
        history.pushState({}, '', '/w/home');
        dispatchEvent(new PopStateEvent('popstate'));
      });
      await measurement.page.waitForTimeout(150);
      try {
        const result = await navigateSpa(measurement.page, journey, measurement);
        results.push({ profile: 'warm', trial, ...result });
      } catch (error) {
        results.push({
          profile: 'warm',
          trial,
          journey: journey.id,
          persona: journey.persona,
          route: journey.path,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    await context.close();
  }
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return Number(
    (sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2).toFixed(3),
  );
}

function summarize(results) {
  return journeys.flatMap((journey) =>
    ['cold', 'warm'].map((profile) => {
      const valid = results.filter(
        (row) =>
          row.journey === journey.id &&
          row.profile === profile &&
          typeof row.hostObservedMs === 'number',
      );
      const renderTimes = valid.map((row) => row.routeRenderMs ?? row.hostObservedMs);
      const requestCounts = valid.map((row) => row.requestCount);
      const jsBytes = valid.map((row) => row.jsTransferBytes);
      const scriptTimes = valid
        .map((row) => row.scriptDurationMs)
        .filter((value) => value !== null);
      return {
        journey: journey.id,
        route: journey.path,
        profile,
        completedTrials: valid.length,
        requiredTrials: trialsPerProfile,
        renderMs: valid.length
          ? {
              median: median(renderTimes),
              min: Math.min(...renderTimes),
              max: Math.max(...renderTimes),
            }
          : null,
        requestCount: valid.length
          ? {
              median: median(requestCounts),
              min: Math.min(...requestCounts),
              max: Math.max(...requestCounts),
            }
          : null,
        apiRequestCount: valid.length
          ? {
              median: median(valid.map((row) => row.apiRequestCount)),
              min: Math.min(...valid.map((row) => row.apiRequestCount)),
              max: Math.max(...valid.map((row) => row.apiRequestCount)),
            }
          : null,
        jsTransferBytes: valid.length
          ? { median: median(jsBytes), min: Math.min(...jsBytes), max: Math.max(...jsBytes) }
          : null,
        jsEncodedBytes: valid.length
          ? {
              median: median(valid.map((row) => row.jsEncodedBytes)),
              min: Math.min(...valid.map((row) => row.jsEncodedBytes)),
              max: Math.max(...valid.map((row) => row.jsEncodedBytes)),
            }
          : null,
        scriptDurationMs: scriptTimes.length
          ? {
              median: median(scriptTimes),
              min: Math.min(...scriptTimes),
              max: Math.max(...scriptTimes),
            }
          : null,
        allStableMarkersObserved:
          valid.length === trialsPerProfile && valid.every((row) => row.markerObserved),
        allRequiredApiResponsesObserved: journey.api
          ? valid.every((row) => row.requiredApiResponseObserved)
          : null,
        failedTrials: results
          .filter((row) => row.journey === journey.id && row.profile === profile && row.error)
          .map(({ trial, error }) => ({ trial, error })),
      };
    }),
  );
}

const observedAt = new Date().toISOString();
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const journey of journeys) {
    if (journey.mode === 'document') await runDocumentJourney(browser, journey, results);
    else await runAuthenticatedJourney(browser, journey, results);
  }
} finally {
  await browser.close();
}

const summary = summarize(results);
const complete =
  summary.every(
    (profile) => profile.completedTrials === trialsPerProfile && profile.allStableMarkersObserved,
  ) &&
  journeys
    .filter((journey) => journey.api)
    .every((journey) => {
      const coldRows = results.filter(
        (row) => row.journey === journey.id && row.profile === 'cold',
      );
      return (
        coldRows.length === trialsPerProfile &&
        coldRows.every((row) => row.requiredApiResponseObserved && row.requiredApiStatus === 200)
      );
    }) &&
  results.every(
    (row) =>
      !row.error &&
      row.pageErrors?.length === 0 &&
      row.requestFailures?.length === 0 &&
      row.apiOrigins?.every((origin) => origin === new URL(baseUrl).origin) &&
      row.responseStatuses?.every((response) => response.method === 'GET'),
  );
const report = {
  evidenceId: 'EV-20260929-451',
  taskId: 'C02',
  stepId: 'C02.02',
  status: complete ? 'complete' : 'incomplete',
  observedAt,
  sourceHead,
  environment: {
    mode: 'existing Vite development server with local MSW service worker; no server/build restart',
    baseUrl,
    browser: `Chromium ${browser.version()}`,
    viewport: { width: 1440, height: 900, dpr: 1 },
    operatingSystem: `${os.type()} ${os.release()}`,
    cpuModel: os.cpus()[0]?.model ?? 'unknown',
    logicalCpus: os.cpus().length,
    throttling:
      'No CPU/network throttling configured; loopback only. MSW is local mock time, not backend latency.',
    apiDataSource: 'mock',
  },
  methodology: {
    trialsPerProfile,
    cold: 'Each authenticated cold trial starts in a new context with empty site storage; perform mock login before timing the SPA route so login/API setup is excluded. The public login route uses a new context and full document navigation.',
    warm: 'Repeat after the first successful route render in the same context; authenticated journeys navigate back to /w/home and return via pushState + popstate; the public login route is reloaded in the same context.',
    navigationTiming:
      'Route render duration starts immediately before client-side history navigation and ends when the route-specific stable marker is present. Login records document Navigation Timing and host-observed navigation-to-form render.',
    responseTiming:
      'Playwright request timing may be unavailable for service-worker responses; when unavailable, browser Resource Timing duration is recorded. Both are local MSW timing, never backend latency.',
    javascriptWork:
      'CDP ScriptDuration/TaskDuration deltas and Long Task API totals are browser main-thread proxies, not CPU-profile attribution. JS/CSS transfer and encoded bytes are also recorded.',
    apiSafety:
      'GET-only route navigation; no business mutation requests were triggered. Request bodies, credentials, response values and token material are not written to evidence; only paths, statuses, timings and array row counts are kept.',
    dynamicFixture:
      'DCA row counts and observedAt are retained per trial because its mock clock is wall-time based.',
  },
  selectedJourneys: journeys.map(({ id, path: route, persona, api }) => ({
    journey: id,
    route,
    persona: persona ?? 'public-unauthenticated-login-form',
    expectedApi: api ?? null,
  })),
  summary,
  trials: results,
  sourceHashes: await sourceHashes(),
  limits: [
    'Only local development/MSW browser behavior was measured. Backend, staging, production RUM and user acceptance were not exercised.',
    'Authenticated cold timings include the already-running Vite app/login setup but start timing after mock login; they measure first SPA route arrival in an empty browser context rather than first-page document navigation.',
    'Synthetic pushState/popstate excludes pointer and shell-menu interaction time.',
    'Main-thread metrics are aggregate browser counters; no CPU trace attribution or memory-retention conclusion is claimed.',
    'The /w/trade/btc-usdt probe returned 404; measured route was corrected to source-backed /w/trade/btcusdt from WebSidebar.tsx and fixture IDs.',
  ],
};

const date = observedAt.slice(0, 10);
const outputPath = path.join(evidenceDirectory, `c02-02-performance-runs-${date}.json`);
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    { outputPath: path.relative(root, outputPath), status: report.status, summary: report.summary },
    null,
    2,
  ),
);
if (!complete) process.exitCode = 1;

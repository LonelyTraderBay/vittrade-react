import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = process.cwd();
const baseUrl = process.env.C02_BASE_URL ?? 'http://127.0.0.1:4173';
const password = process.env.C02_PREVIEW_PASSWORD;
const interactionCycles = Number(process.env.C02_INTERACTION_CYCLES ?? 8);
const mountCycles = Number(process.env.C02_MOUNT_CYCLES ?? 10);
const evidenceDirectory = path.join(root, 'docs/architecture/production-readiness/evidence/C02');
const observedAt = new Date().toISOString();
const sourcePaths = [
  'src/features/trading/components/TradeTerminal.tsx',
  'src/features/trading/components/TradingMarketPanel.tsx',
  'src/features/trading/components/QuickPairSwitcher.tsx',
  'src/features/market/model/market-queries.ts',
  'src/features/market/api/market-stream.ts',
  'src/shared/ui/BottomSheetV2.tsx',
  'src/features/trading/routes.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/legacy/trading/providers/MarketDataWSProvider.tsx',
  'src/dev/mocks/trading-fixtures.ts',
  'src/dev/mocks/personas.ts',
  'docs/architecture/production-readiness/evidence/C02/run-c02-03-interaction-profile.mjs',
];

if (!password) {
  throw new Error(
    'Set C02_PREVIEW_PASSWORD to the local developer preview fixture password; it is never written to evidence.',
  );
}
if (!Number.isInteger(interactionCycles) || interactionCycles < 5) {
  throw new Error('C02_INTERACTION_CYCLES must be an integer of at least 5.');
}
if (!Number.isInteger(mountCycles) || mountCycles < 5) {
  throw new Error('C02_MOUNT_CYCLES must be an integer of at least 5.');
}

const sha256 = (contents) => createHash('sha256').update(contents).digest('hex');
const round = (value) => Number(value.toFixed(3));

async function getSourceHashes() {
  return Object.fromEntries(
    await Promise.all(
      sourcePaths.map(async (source) => [source, sha256(await readFile(path.join(root, source)))]),
    ),
  );
}

function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(ratio * sorted.length) - 1)];
}

function summarizeDurations(rows) {
  return Object.fromEntries(
    [...new Set(rows.map((row) => row.kind))].map((kind) => {
      const values = rows.filter((row) => row.kind === kind).map((row) => row.actionToTwoPaintsMs);
      return [
        kind,
        {
          samples: values.length,
          medianMs: percentile(values, 0.5),
          p95Ms: percentile(values, 0.95),
          minMs: Math.min(...values),
          maxMs: Math.max(...values),
        },
      ];
    }),
  );
}

function summarizeEventTiming(rows) {
  const interactions = rows.flatMap((row) => row.eventTimingEntries ?? []);
  const durations = interactions.map((entry) => entry.durationMs);
  return {
    observedInteractions: interactions.length,
    p75Ms: percentile(durations, 0.75),
    p95Ms: percentile(durations, 0.95),
    maxMs: durations.length ? Math.max(...durations) : null,
  };
}

function summarizeTrace(events) {
  const completeEvents = events.filter(
    (event) => event.ph === 'X' && typeof event.dur === 'number',
  );
  const mainThread = new Map();
  for (const event of completeEvents) {
    const key = event.name;
    const current = mainThread.get(key) ?? { count: 0, totalUs: 0, maxUs: 0 };
    current.count += 1;
    current.totalUs += event.dur;
    current.maxUs = Math.max(current.maxUs, event.dur);
    mainThread.set(key, current);
  }
  return [...mainThread.entries()]
    .map(([name, value]) => ({ name, ...value, totalMs: round(value.totalUs / 1000) }))
    .sort((a, b) => b.totalUs - a.totalUs)
    .slice(0, 20);
}

async function waitForTerminal(page, pairSymbol) {
  await page.waitForFunction(
    (symbol) => {
      const text = document.body?.innerText ?? '';
      return (
        text.includes('Đặt lệnh') &&
        text.includes(symbol) &&
        !text.includes('Đang tải dữ liệu thị trường')
      );
    },
    pairSymbol,
    { timeout: 15_000 },
  );
}

async function waitForPairReady(page, pairSymbol) {
  await waitForTerminal(page, pairSymbol);
  await page.getByRole('dialog', { name: 'Chọn cặp giao dịch' }).waitFor({ state: 'hidden' });
}

async function waitForDialogRows(page, expectedCount) {
  await page.waitForFunction(
    (count) => {
      const dialog = document.querySelector('[role="dialog"][aria-label="Chọn cặp giao dịch"]');
      if (!dialog) return false;
      const rows = [...dialog.querySelectorAll('button')].filter((button) =>
        /[A-Z0-9]+\/USDT/.test(button.innerText),
      );
      return rows.length === count;
    },
    expectedCount,
    { timeout: 10_000 },
  );
}

async function collectMemorySnapshot(cdp, label) {
  const result = { label, observedAt: new Date().toISOString() };
  try {
    await cdp.send('HeapProfiler.collectGarbage');
    result.garbageCollectionRequested = true;
  } catch {
    result.garbageCollectionRequested = false;
  }
  try {
    const [heap, dom, performance] = await Promise.all([
      cdp.send('Runtime.getHeapUsage'),
      cdp.send('Memory.getDOMCounters'),
      cdp.send('Performance.getMetrics'),
    ]);
    result.heap = {
      usedSizeBytes: heap.usedSize,
      totalSizeBytes: heap.totalSize,
      embedderHeapUsedSizeBytes: heap.embedderHeapUsedSize,
    };
    result.dom = dom;
    const metrics = Object.fromEntries(performance.metrics.map(({ name, value }) => [name, value]));
    result.metrics = {
      jsHeapUsedBytes: metrics.JSHeapUsedSize == null ? null : Math.round(metrics.JSHeapUsedSize),
      documents: metrics.Documents ?? null,
      nodes: metrics.Nodes ?? null,
      jsEventListeners: metrics.JSEventListeners ?? null,
    };
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }
  return result;
}

async function browserTiming(page, label, action, validate) {
  const startMark = `c0203-${label}-start`;
  const endMark = `c0203-${label}-end`;
  const requestsBefore = page.__c0203.responses.length;
  const hostStart = process.hrtime.bigint();
  await page.evaluate((mark) => performance.mark(mark), startMark);
  await action();
  await validate();
  const paintTiming = await page.evaluate(
    ({ startMark, endMark }) =>
      new Promise((resolve) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            performance.mark(endMark);
            const start = performance.getEntriesByName(startMark, 'mark').at(-1)?.startTime ?? 0;
            const end = performance.getEntriesByName(endMark, 'mark').at(-1)?.startTime ?? 0;
            resolve({ actionToTwoPaintsMs: Number((end - start).toFixed(3)), start, end });
          }),
        );
      }),
    { startMark, endMark },
  );
  const hostObservedMs = round(Number(process.hrtime.bigint() - hostStart) / 1e6);
  const interactionEvents = await page.evaluate(({ start, end }) => {
    const grouped = new Map();
    for (const entry of window.__c0203EventTiming ?? []) {
      if (entry.startTime < start || entry.startTime > end || entry.interactionId <= 0) continue;
      const current = grouped.get(entry.interactionId) ?? {
        interactionId: entry.interactionId,
        startTime: entry.startTime,
        durationMs: 0,
        eventNames: [],
        presentationTimeMs: null,
      };
      current.startTime = Math.min(current.startTime, entry.startTime);
      current.durationMs = Math.max(current.durationMs, entry.durationMs);
      if (!current.eventNames.includes(entry.name)) current.eventNames.push(entry.name);
      if (entry.presentationTimeMs != null) current.presentationTimeMs = entry.presentationTimeMs;
      grouped.set(entry.interactionId, current);
    }
    return [...grouped.values()];
  }, paintTiming);
  return {
    kind: label,
    observedAt: new Date().toISOString(),
    ...paintTiming,
    hostObservedMs,
    eventTimingEntries: interactionEvents,
    apiResponsesDuringAction: page.__c0203.responses.slice(requestsBefore),
  };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.__c0203 = { requests: [], responses: [], failures: [], pageErrors: [], websocketUrls: [] };
page.on('request', (request) => {
  const url = new URL(request.url());
  page.__c0203.requests.push({
    method: request.method(),
    path: url.pathname,
    origin: url.origin,
    resourceType: request.resourceType(),
  });
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (url.pathname.startsWith('/api/')) {
    page.__c0203.responses.push({
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  }
});
page.on('requestfailed', (request) =>
  page.__c0203.failures.push({
    path: new URL(request.url()).pathname,
    error: request.failure()?.errorText ?? 'unknown',
  }),
);
page.on('pageerror', (error) => page.__c0203.pageErrors.push(error.message));
page.on('websocket', (socket) => {
  const url = new URL(socket.url());
  page.__c0203.websocketUrls.push({ origin: url.origin, path: url.pathname });
});
await page.addInitScript(() => {
  window.__c0203EventTiming = [];
  try {
    new PerformanceObserver((list) => {
      window.__c0203EventTiming.push(
        ...list.getEntries().map((entry) => ({
          name: entry.name,
          startTime: Number(entry.startTime.toFixed(3)),
          durationMs: Number(entry.duration.toFixed(3)),
          processingStartMs: Number(entry.processingStart.toFixed(3)),
          processingEndMs: Number(entry.processingEnd.toFixed(3)),
          presentationTimeMs: entry.presentationTime
            ? Number(entry.presentationTime.toFixed(3))
            : null,
          interactionId: entry.interactionId ?? null,
        })),
      );
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch {
    window.__c0203EventTimingAvailable = false;
  }
});

let cdp;
const interactions = [];
const memorySnapshots = [];
const traceEvents = [];
let cpuProfile = null;
let traceError = null;
let finalState;

try {
  cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Profiler.enable');

  await page.goto(new URL('/w/auth/login', baseUrl).href, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="auth-email"]').fill('developer@vittrade.local');
  await page.locator('[data-testid="auth-password"]').fill(password);
  await page.locator('[data-testid="auth-submit"]').click();
  await page.waitForURL((url) => url.pathname === '/w/home', { timeout: 15_000 });
  await page.evaluate((route) => {
    history.pushState({}, '', route);
    dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/btcusdt');
  await waitForTerminal(page, 'BTC/USDT');
  await page.waitForTimeout(120);
  memorySnapshots.push(await collectMemorySnapshot(cdp, 'baseline-terminal-btc-after-gc'));

  for (let cycle = 0; cycle < interactionCycles; cycle += 1) {
    const dialog = page.getByRole('dialog', { name: 'Chọn cặp giao dịch' });
    await browserTiming(
      page,
      'open-pair-switcher',
      () => page.getByRole('button', { name: /^BTC BTC\/USDT$/ }).click(),
      async () => {
        await dialog.waitFor({ state: 'visible' });
        await page.waitForTimeout(350);
      },
    ).then((row) => interactions.push({ cycle, ...row }));

    const initialRowCount = await dialog
      .locator('button')
      .filter({ hasText: /[A-Z0-9]+\/USDT/ })
      .count();
    await browserTiming(
      page,
      'filter-category-defi',
      () => dialog.getByRole('button', { name: 'DeFi', exact: true }).click(),
      () => waitForDialogRows(page, 0),
    ).then(async (row) => {
      const categoryRowCount = await dialog
        .locator('button')
        .filter({ hasText: /[A-Z0-9]+\/USDT/ })
        .count();
      interactions.push({
        cycle,
        initialPairRows: initialRowCount,
        categoryPairRows: categoryRowCount,
        ...row,
      });
    });

    await browserTiming(
      page,
      'filter-category-layer-1',
      () => dialog.getByRole('button', { name: 'Layer 1', exact: true }).click(),
      () => waitForDialogRows(page, initialRowCount),
    ).then((row) => interactions.push({ cycle, ...row }));

    const search = dialog.getByPlaceholder('Tìm BTC, ETH, SOL...');
    await browserTiming(
      page,
      'filter-search-eth',
      () => search.fill('ETH'),
      async () => {
        await page.waitForFunction(() => {
          const dialogNode = document.querySelector(
            '[role="dialog"][aria-label="Chọn cặp giao dịch"]',
          );
          return (
            dialogNode &&
            [...dialogNode.querySelectorAll('button')].filter((button) =>
              /[A-Z0-9]+\/USDT/.test(button.innerText),
            ).length === 1
          );
        });
      },
    ).then((row) => interactions.push({ cycle, ...row }));

    const ethRow = dialog.getByRole('button').filter({ hasText: 'ETH/USDT' }).first();
    await browserTiming(
      page,
      'select-pair-ethusdt',
      () => ethRow.click(),
      () => waitForPairReady(page, 'ETH/USDT'),
    ).then((row) => interactions.push({ cycle, ...row }));

    await browserTiming(
      page,
      'open-pair-switcher',
      () => page.getByRole('button', { name: /^ETH ETH\/USDT$/ }).click(),
      async () => {
        await dialog.waitFor({ state: 'visible' });
        await page.waitForTimeout(350);
      },
    ).then((row) => interactions.push({ cycle, ...row }));

    await browserTiming(
      page,
      'filter-search-btc',
      () => dialog.getByPlaceholder('Tìm BTC, ETH, SOL...').fill('BTC'),
      async () => {
        await page.waitForFunction(() => {
          const dialogNode = document.querySelector(
            '[role="dialog"][aria-label="Chọn cặp giao dịch"]',
          );
          return (
            dialogNode &&
            [...dialogNode.querySelectorAll('button')].filter((button) =>
              /[A-Z0-9]+\/USDT/.test(button.innerText),
            ).length === 1
          );
        });
      },
    ).then((row) => interactions.push({ cycle, ...row }));

    const btcRow = dialog.getByRole('button').filter({ hasText: 'BTC/USDT' }).first();
    await browserTiming(
      page,
      'select-pair-btcusdt',
      () => btcRow.click(),
      () => waitForPairReady(page, 'BTC/USDT'),
    ).then((row) => interactions.push({ cycle, ...row }));

    memorySnapshots.push(await collectMemorySnapshot(cdp, `after-interaction-cycle-${cycle + 1}`));
  }

  for (let cycle = 0; cycle < mountCycles; cycle += 1) {
    await page.evaluate((route) => {
      history.pushState({}, '', route);
      dispatchEvent(new PopStateEvent('popstate'));
    }, '/w/markets/overview');
    await page.waitForFunction(() => (document.body?.innerText ?? '').includes('Hiệu suất ngành'), {
      timeout: 15_000,
    });
    await page.evaluate((route) => {
      history.pushState({}, '', route);
      dispatchEvent(new PopStateEvent('popstate'));
    }, '/w/trade/btcusdt');
    await waitForTerminal(page, 'BTC/USDT');
    await page.waitForTimeout(350);
    memorySnapshots.push(
      await collectMemorySnapshot(cdp, `after-route-mount-unmount-${cycle + 1}`),
    );
  }

  await cdp.send('Profiler.start');
  const profilerMark = interactions.length;
  const profileDialog = page.getByRole('dialog', { name: 'Chọn cặp giao dịch' });
  const traceDone = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
  cdp.on('Tracing.dataCollected', ({ value }) => {
    for (const event of value) {
      const safe = { cat: event.cat, name: event.name, ph: event.ph, ts: event.ts };
      for (const key of ['dur', 'pid', 'tid']) if (event[key] != null) safe[key] = event[key];
      traceEvents.push(safe);
    }
  });
  await cdp.send('Tracing.start', {
    categories:
      'devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline.frame',
    transferMode: 'ReportEvents',
    options: 'record-as-much-as-possible',
  });
  const tracedOpen = await browserTiming(
    page,
    'profile-open-pair-switcher',
    () => page.getByRole('button', { name: /^BTC BTC\/USDT$/ }).click(),
    async () => {
      await profileDialog.waitFor({ state: 'visible' });
      await page.waitForTimeout(350);
    },
  );
  const tracedSearch = await browserTiming(
    page,
    'profile-filter-search-eth',
    () => profileDialog.getByPlaceholder('Tìm BTC, ETH, SOL...').fill('ETH'),
    async () => {
      await page.waitForFunction(() => {
        const dialogNode = document.querySelector(
          '[role="dialog"][aria-label="Chọn cặp giao dịch"]',
        );
        return (
          dialogNode &&
          [...dialogNode.querySelectorAll('button')].filter((button) =>
            /[A-Z0-9]+\/USDT/.test(button.innerText),
          ).length === 1
        );
      });
    },
  );
  const tracedSelect = await browserTiming(
    page,
    'profile-select-pair-ethusdt',
    () => profileDialog.getByRole('button').filter({ hasText: 'ETH/USDT' }).first().click(),
    () => waitForPairReady(page, 'ETH/USDT'),
  );
  interactions.push(
    { cycle: 'profile', ...tracedOpen },
    { cycle: 'profile', ...tracedSearch },
    { cycle: 'profile', ...tracedSelect },
  );
  await cdp.send('Tracing.end');
  await traceDone;
  const { profile } = await cdp.send('Profiler.stop');
  cpuProfile = {
    startTime: profile.startTime,
    endTime: profile.endTime,
    sampleCount: profile.samples?.length ?? 0,
    topFunctions: (profile.nodes ?? [])
      .filter((node) => node.callFrame?.functionName)
      .map((node) => ({
        functionName: node.callFrame.functionName,
        url: node.callFrame.url,
        lineNumber: node.callFrame.lineNumber,
        selfHitCount: node.hitCount ?? 0,
      }))
      .sort((a, b) => b.selfHitCount - a.selfHitCount)
      .slice(0, 30),
    measuredAfterInteractionIndex: profilerMark,
  };

  await page.evaluate((route) => {
    history.pushState({}, '', route);
    dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/btcusdt');
  await waitForTerminal(page, 'BTC/USDT');
  await page.waitForTimeout(350);
  memorySnapshots.push(await collectMemorySnapshot(cdp, 'after-spa-reset-to-btc'));
  finalState = {
    url: page.url(),
    terminalMarkerObserved: (await page.locator('body').innerText()).includes('BTC/USDT'),
    resetKind:
      'SPA navigation from profiled ETH terminal to baseline BTC terminal; document reload excluded because the local preview session does not persist as a stable authenticated route across reload.',
    apiResponseCount: page.__c0203.responses.length,
    apiRequestCount: page.__c0203.requests.filter((request) => request.path.startsWith('/api/'))
      .length,
    nonGetApiRequests: page.__c0203.requests.filter(
      (request) => request.path.startsWith('/api/') && request.method !== 'GET',
    ),
    externalApiRequests: page.__c0203.requests.filter(
      (request) => request.path.startsWith('/api/') && request.origin !== new URL(baseUrl).origin,
    ),
    websocketConnectionCount: page.__c0203.websocketUrls.length,
    websocketConnections: page.__c0203.websocketUrls,
    eventTimingAvailable: await page.evaluate(() => window.__c0203EventTimingAvailable !== false),
    eventTimingEntryCount: await page.evaluate(() => window.__c0203EventTiming?.length ?? 0),
    requestFailures: page.__c0203.failures,
    pageErrors: page.__c0203.pageErrors,
  };
} finally {
  await browser.close();
}

const traceFilename = 'c02-03-interaction-profile-trace-2026-09-29.json';
const reportFilename = 'c02-03-interaction-profile-2026-09-29.json';
const tracePath = path.join(evidenceDirectory, traceFilename);
const reportPath = path.join(evidenceDirectory, reportFilename);
const report = {
  schemaVersion: 1,
  stepId: 'C02.03',
  observedAt,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  environment: {
    baseUrl,
    dataSource: 'Vite development + local MSW fixtures',
    browser: browser.version(),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    platform: process.platform,
    osRelease: os.release(),
    architecture: os.arch(),
    logicalCpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model ?? null,
    hardwareConcurrency: 24,
    throttling: 'none configured; loopback',
  },
  methodology: {
    persona: 'developer local preview fixture',
    interactionCycles,
    mountCycles,
    actionToTwoPaints:
      'Performance marks around Playwright user interaction; stop after target DOM is observed and two requestAnimationFrame callbacks.',
    interactionTiming:
      'Chromium PerformanceEventTiming entries are sampled only when available and duration >= 16 ms.',
    memory:
      'Request V8 garbage collection, then sample Runtime.getHeapUsage, Memory.getDOMCounters and Performance metrics after each interaction or route cycle. Browser GC is non-deterministic; treat as lab observations.',
    profiling:
      'Separate traced pass uses Chromium CDP Tracing and V8 CPU Profiler; trace event args are omitted from saved artifact.',
    routeCycle:
      'SPA navigation /w/trade/btcusdt -> /w/markets/overview -> /w/trade/btcusdt, repeated without a full reload.',
    finalReset:
      'After the profiler pass, SPA navigate from ETH/USDT back to the baseline BTC/USDT terminal, wait for the route marker and motion to settle, request GC, then capture the final heap/DOM/listener snapshot. A hard document reload is excluded because the local preview auth state does not persist into a stable protected route.',
    stream:
      'Observe WebSocket creation during the active Trading route; source search finds no production feature consumer of connectMarketStream.',
    writes: 'Only preview login POST; no order, watchlist, wallet or other business mutation.',
    clock: 'Local wall clock; no mocked network throttling.',
  },
  sourceHashes: await getSourceHashes(),
  interactionSummary: summarizeDurations(interactions),
  eventTimingSummary: summarizeEventTiming(interactions),
  interactions,
  memorySnapshots,
  finalState,
  trace: {
    file: traceFilename,
    eventCount: traceEvents.length,
    topCompleteEvents: summarizeTrace(traceEvents),
    cpuProfile,
    error: traceError,
  },
  limitations: [
    'Results describe this Windows development browser and local MSW fixtures; they are not production build, backend or RUM measurements.',
    'The active TradeTerminal route did not create a WebSocket in this run; no real stream render cost or stream lifecycle memory can be measured until a product route consumes the adapter.',
    'Runtime.getHeapUsage and DOM/listener counters after requested GC are snapshots, not proof of a leak or leak-free behavior; compare trends and verify with longer soak tests before setting a budget.',
    'Two animation frames after target DOM observation are a repeatable interaction-to-paint proxy, not a React Profiler commit duration or a user-perceived INP guarantee.',
  ],
};

await writeFile(
  tracePath,
  `${JSON.stringify({ schemaVersion: 1, observedAt, events: traceEvents }, null, 2)}\n`,
);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      report: reportFilename,
      trace: traceFilename,
      interactionSummary: report.interactionSummary,
      memorySnapshotCount: report.memorySnapshots.length,
      traceEventCount: report.trace.eventCount,
      cpuSampleCount: report.trace.cpuProfile?.sampleCount ?? 0,
      finalState: report.finalState,
    },
    null,
    2,
  ),
);

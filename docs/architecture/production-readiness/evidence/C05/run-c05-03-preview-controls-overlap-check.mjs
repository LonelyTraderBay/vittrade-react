import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../../');
const baseUrl = process.env.C05_PREVIEW_URL ?? 'http://127.0.0.1:5193';
const origin = new URL(baseUrl).origin;
const reportPath = path.join(directory, 'c05-03-preview-controls-browser-check-2026-10-03.json');
const afterScreenshotPath = path.join(directory, 'c05-03-preview-controls-after-2026-10-03.png');
const beforeScreenshot =
  'docs/architecture/production-readiness/evidence/U01/u01-03-auth-login-preview.png';
const sourceFiles = [
  'src/app/components/layout/PlatformSwitcher.tsx',
  'src/app/components/layout/PlatformSwitcher.test.tsx',
  'src/app/components/layout/RootLayout.tsx',
  'src/app/components/layout/RootLayout.test.tsx',
  'src/dev/PreviewControls.tsx',
  'docs/architecture/production-readiness/evidence/C05/run-c05-03-preview-controls-overlap-check.mjs',
];
const normalizeText = (value) => value.replace(/\r\n?/g, '\n');
const hashText = (value) => createHash('sha256').update(normalizeText(value)).digest('hex');
const hashFile = (relativePath) => hashText(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

const report = {
  schemaVersion: 1,
  id: 'EV-20261003-004',
  taskId: 'C05',
  stepId: 'C05.03',
  kind: 'c05-preview-controls-overlap-current-source-browser-check',
  observedAt: new Date().toISOString(),
  sourceHead: git(['rev-parse', 'HEAD']),
  sourceBranch: git(['branch', '--show-current']),
  environment: {
    os: 'Windows',
    runtime: process.version,
    browser: null,
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    url: origin,
    dataSource: 'mock',
    backendConnected: false,
    cleanBrowserContext: true,
  },
  expected:
    'On the Web login route at 1440x900, the platform badge stays clear of the mock-data warning and its preview button. Keyboard activation still opens the preview controls.',
  actual: null,
  result: 'fail',
  artifact: path.relative(root, reportPath).replaceAll(path.sep, '/'),
  commandOrSteps:
    'Start a local Vite development server with VITE_DATA_SOURCE=mock; run this script with C05_PREVIEW_URL pointing to that loopback server. Open /w/auth/login, measure the rendered badge/warning rectangles, save the screenshot, then open the preview controls with Enter.',
  previewBaseUrl: origin,
  beforeScreenshot,
  afterScreenshot: path.relative(root, afterScreenshotPath).replaceAll(path.sep, '/'),
  sourceHashes: Object.fromEntries(sourceFiles.map((file) => [file, hashFile(file)])),
  dirtyFileHashes: {},
  observations: {},
  assertions: {},
  limitations: [
    'This is a local Chromium/MSW layout check for one Web route and one desktop viewport; it is not user acceptance.',
    'Mock Service Worker and local fixtures do not verify backend, staging, production, session persistence, or other device sizes.',
  ],
};

const browser = await chromium.launch({ headless: true });
report.environment.browser = `Chromium ${browser.version()}`;
const context = await browser.newContext({
  viewport: report.environment.viewport,
  deviceScaleFactor: report.environment.viewport.deviceScaleFactor,
});
const page = await context.newPage();
const apiResponses = [];
const failedApiRequests = [];
const pageErrors = [];
const externalApiOrigins = new Set();

page.on('response', (response) => {
  const responseUrl = new URL(response.url());
  if (!responseUrl.pathname.startsWith('/api/')) return;
  apiResponses.push({
    method: response.request().method(),
    path: responseUrl.pathname,
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
  });
  if (responseUrl.origin !== origin) externalApiOrigins.add(responseUrl.origin);
});
page.on('requestfailed', (request) => {
  const requestUrl = new URL(request.url());
  if (requestUrl.pathname.startsWith('/api/')) {
    failedApiRequests.push({ method: request.method(), path: requestUrl.pathname });
    if (requestUrl.origin !== origin) externalApiOrigins.add(requestUrl.origin);
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  const warmupResponse = await page.goto(new URL('/w/markets', baseUrl).href, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller?.scriptURL.endsWith('/mockServiceWorker.js'),
    { timeout: 10_000 },
  );

  const response = await page.goto(new URL('/w/auth/login', baseUrl).href, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  const controls = page.getByTestId('dev-preview-controls');
  const toggle = controls.locator('button[aria-controls="dev-preview-panel"]');
  await controls.waitFor({ state: 'visible' });
  await toggle.waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'Đăng nhập' }).waitFor({ state: 'visible' });

  const layout = await page.evaluate(() => {
    const controlsElement = document.querySelector('[data-testid="dev-preview-controls"]');
    const warning = controlsElement?.querySelector('[aria-label="Mock data warning"]');
    const button = controlsElement?.querySelector('button[aria-controls="dev-preview-panel"]');
    const badge = [...document.querySelectorAll('div.fixed')].find(
      (element) => element.textContent?.trim() === 'Web',
    );
    if (!controlsElement || !warning || !button || !badge) {
      throw new Error('Could not locate the preview warning, toggle button, or Web badge.');
    }
    const box = (element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height, right: x + width, bottom: y + height };
    };
    return {
      warningText: warning.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      warning: box(warning),
      toggle: box(button),
      badge: box(badge),
      previewZIndex: getComputedStyle(controlsElement).zIndex,
      badgeZIndex: getComputedStyle(badge).zIndex,
    };
  });
  await page.screenshot({ path: afterScreenshotPath, fullPage: true });

  await toggle.focus();
  await page.keyboard.press('Enter');
  const panel = controls.getByRole('region', { name: 'Công cụ xem trước' });
  await panel.waitFor({ state: 'visible' });
  const keyboardExpanded = (await toggle.getAttribute('aria-expanded')) === 'true';
  const badgePointIsCoveredByPreviewPanel = await page.evaluate(
    (point) => {
      const controlsElement = document.querySelector('[data-testid="dev-preview-controls"]');
      const topElement = document.elementFromPoint(point.x, point.y);
      return Boolean(controlsElement && topElement && controlsElement.contains(topElement));
    },
    { x: layout.badge.x + layout.badge.width / 2, y: layout.badge.y + layout.badge.height / 2 },
  );

  report.observations = {
    warmupStatus: warmupResponse?.status() ?? null,
    route: '/w/auth/login',
    responseStatus: response?.status() ?? null,
    warningText: layout.warningText,
    warningBox: layout.warning,
    toggleBox: layout.toggle,
    badgeBox: layout.badge,
    verticalGapPixels: Math.round(layout.warning.y - layout.badge.bottom),
    previewZIndex: layout.previewZIndex,
    badgeZIndex: layout.badgeZIndex,
    keyboardExpanded,
    badgePointIsCoveredByPreviewPanel,
    apiResponses,
    failedApiRequests,
    pageErrors,
    externalApiOrigins: [...externalApiOrigins],
    serviceWorkerController: await page.evaluate(
      () => navigator.serviceWorker?.controller?.scriptURL ?? null,
    ),
  };
  report.assertions = {
    routeRendered: response?.status() === 200,
    mockWarningVisible: layout.warningText.includes('DỮ LIỆU MÔ PHỎNG'),
    badgeDoesNotOverlapWarning: layout.warning.y - layout.badge.bottom >= 8,
    badgeDoesNotOverlapToggle:
      layout.badge.right <= layout.toggle.x ||
      layout.badge.x >= layout.toggle.right ||
      layout.badge.bottom <= layout.toggle.y ||
      layout.badge.y >= layout.toggle.bottom,
    keyboardOpensControls: keyboardExpanded,
    expandedControlsCoverDecorativeBadge: badgePointIsCoveredByPreviewPanel,
    allObservedApiResponsesFromServiceWorker:
      apiResponses.length > 0 && apiResponses.every((item) => item.fromServiceWorker),
    noFailedApiRequests: failedApiRequests.length === 0,
    noExternalApiOrigins: externalApiOrigins.size === 0,
    noPageErrors: pageErrors.length === 0,
  };
  report.actual = `The badge/warning gap measured ${report.observations.verticalGapPixels}px; keyboard activation opened the preview panel. ${apiResponses.length} API response(s) came from MSW, with ${failedApiRequests.length} failed API requests and ${pageErrors.length} page errors.`;
  report.dirtyFileHashes = Object.fromEntries(
    sourceFiles.filter((file) => file.startsWith('src/')).map((file) => [file, hashFile(file)]),
  );
  report.result = Object.values(report.assertions).every(Boolean) ? 'pass' : 'fail';
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(
    JSON.stringify(
      {
        result: report.result,
        assertions: report.assertions,
        observations: report.observations,
        artifact: report.artifact,
        afterScreenshot: report.afterScreenshot,
      },
      null,
      2,
    ),
  );
  if (report.result !== 'pass') process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}

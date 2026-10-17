const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const root = process.cwd();
const baseUrl = process.env.UI_A11Y_BASE_URL || 'http://127.0.0.1:4173';
const outputDir = process.env.UI_A11Y_OUTPUT;
const themeName = process.env.UI_A11Y_THEME === 'dark' ? 'dark' : 'light';
const viewportWidth = Number(process.env.UI_A11Y_VIEWPORT_WIDTH || 1440);
const viewportHeight = Number(process.env.UI_A11Y_VIEWPORT_HEIGHT || 900);

if (!outputDir) throw new Error('Set UI_A11Y_OUTPUT to a run-owned evidence directory.');
if (!['127.0.0.1', 'localhost'].includes(new URL(baseUrl).hostname)) {
  throw new Error('The UI review runner only accepts a local preview host.');
}
if (
  !Number.isInteger(viewportWidth) ||
  viewportWidth < 320 ||
  !Number.isInteger(viewportHeight) ||
  viewportHeight < 480
) {
  throw new Error('Set a valid UI_A11Y_VIEWPORT_WIDTH and UI_A11Y_VIEWPORT_HEIGHT.');
}

const changedPaths = [];
const gitStatus = execFileSync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], {
  cwd: root,
  encoding: 'utf8',
});
const statusEntries = gitStatus.split('\0').filter(Boolean);
for (let index = 0; index < statusEntries.length; index += 1) {
  const entry = statusEntries[index];
  const status = entry.slice(0, 2);
  const relativePath = entry.slice(3);
  if (relativePath) changedPaths.push(relativePath);
  if (status.includes('R') || status.includes('C')) index += 1;
}
const dirtyFileHashes = Object.fromEntries(
  changedPaths.flatMap((relativePath) => {
    const absolutePath = path.resolve(root, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return [];
    const hash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
    return [[relativePath.replaceAll(path.sep, '/'), hash]];
  }),
);
const routeSettleTimeoutMs = 8000;

function noVisibleLoadingState() {
  const loadingText = document.body.innerText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => /^(?:Đang tải|Loading\b|Fetching\b)/i.test(line));
  const loadingElement = [
    ...document.querySelectorAll('[aria-busy="true"], [role="progressbar"]'),
  ].some((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return (
      rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    );
  });
  return !loadingText && !loadingElement;
}

async function readLoadingIndicators(page) {
  return page.evaluate(() => {
    const text = document.body.innerText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^(?:Đang tải|Loading\b|Fetching\b)/i.test(line));
    const elements = [...document.querySelectorAll('[aria-busy="true"], [role="progressbar"]')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none'
        );
      })
      .map((element) => ({
        role: element.getAttribute('role'),
        label: element.getAttribute('aria-label'),
      }));
    return { text, elements };
  });
}

const tracking = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/architecture/production-readiness/TRACKING.json'), 'utf8'),
);
const byUrl = new Map();
for (const route of tracking.routes ?? []) {
  for (const url of route.resolvedUrls ?? []) {
    if (!url.startsWith('/w/')) continue;
    if (!byUrl.has(url)) {
      byUrl.set(url, {
        routeId: route.id,
        source: route.source,
        declarationPath: route.path,
        component: route.component,
        pageTarget: route.pageTarget,
        developmentOnly: route.developmentOnly === true,
        url,
      });
    }
  }
}
const routes = [...byUrl.values()].sort((left, right) => left.url.localeCompare(right.url));
if (routes.length === 0) throw new Error('TRACKING.json contains no resolved /w/ routes.');
const adminRoutes = routes.filter(
  (route) => route.url === '/w/admin' || route.url.startsWith('/w/admin/'),
);
const routesPerTheme = routes.length + adminRoutes.length;

fs.mkdirSync(outputDir, { recursive: true });

function trimText(value, max = 320) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function routeErrors(pageErrors, consoleErrors, apiResponses, externalRequests) {
  const result = {
    pageErrors: pageErrors.splice(0),
    consoleErrors: consoleErrors.splice(0),
    apiResponses: apiResponses.splice(0),
    externalRequests: externalRequests.splice(0),
  };
  return result;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'],
  });
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const adminContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    reducedMotion: 'reduce',
  });
  const adminPage = await adminContext.newPage();
  const otpContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    reducedMotion: 'reduce',
  });
  const otpPage = await otpContext.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const apiResponses = [];
  const externalRequests = [];

  const watchPage = async (auditPage) => {
    auditPage.on('pageerror', (error) => pageErrors.push(String(error)));
    auditPage.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    auditPage.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
        externalRequests.push({ url: request.url(), resourceType: request.resourceType() });
      }
    });
    auditPage.on('response', (response) => {
      const url = new URL(response.url());
      if (url.pathname.startsWith('/api/')) {
        apiResponses.push({ status: response.status(), path: url.pathname });
      }
    });
    await auditPage.route('**/*', (route) => {
      const url = new URL(route.request().url());
      return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
    });
  };
  await Promise.all([watchPage(page), watchPage(adminPage), watchPage(otpPage)]);

  await page.goto(`${baseUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/w/home');
  await page.evaluate((theme) => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, themeName);

  // /w/auth/otp requires an actual login challenge in router state; direct navigation correctly returns to login.
  await otpPage.goto(`${baseUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await otpPage.getByLabel('Email').fill('mfa@vittrade.local');
  await otpPage.getByTestId('auth-password').fill('Preview-123!');
  await otpPage.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await otpPage.waitForURL('**/w/auth/otp');
  await otpPage.evaluate((theme) => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, themeName);
  pageErrors.splice(0);
  consoleErrors.splice(0);
  apiResponses.splice(0);
  externalRequests.splice(0);

  const results = [];
  const scanRoute = async (route, index, persona, auditPage) => {
    if (route.url !== '/w/auth/otp') {
      await auditPage.evaluate((url) => {
        history.pushState({}, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, route.url);
    }
    await auditPage.waitForTimeout(500);
    const initialLoadingIndicators = await readLoadingIndicators(auditPage);
    let loadingNotSettled = false;
    if (initialLoadingIndicators.text.length > 0 || initialLoadingIndicators.elements.length > 0) {
      try {
        await auditPage.waitForFunction(noVisibleLoadingState, undefined, {
          timeout: routeSettleTimeoutMs,
        });
      } catch {
        loadingNotSettled = true;
      }
    }
    const loadingIndicators = await readLoadingIndicators(auditPage);

    const pageState = await auditPage.evaluate(() => {
      const trim = (value, max = 320) =>
        String(value ?? '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, max);
      const headings = [...document.querySelectorAll('h1, h2')]
        .map((node) => trim(node.textContent))
        .filter(Boolean);
      const h1 = [...document.querySelectorAll('h1')].map((node) => trim(node.textContent));
      const body = trim(document.body.innerText, 420);
      const width = window.innerWidth;
      const documentWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;
      return {
        path: window.location.pathname,
        title: document.title,
        h1,
        headings,
        body,
        width,
        documentWidth,
        bodyWidth,
        overflow: documentWidth > width || bodyWidth > width,
        main: Boolean(document.querySelector('main,[role="main"]')),
        themeClasses: document.documentElement.className,
        notFound: h1.some((heading) => /404\s*[—-]\s*Not Found/i.test(heading)),
      };
    });
    const axe = await new AxeBuilder({ page: auditPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const violations = axe.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        summary: trimText(node.failureSummary, 280),
        data: [...node.any, ...node.all, ...node.none].map((item) => item.data).filter(Boolean),
      })),
    }));
    const errors = routeErrors(pageErrors, consoleErrors, apiResponses, externalRequests);
    const result = {
      ...route,
      persona,
      ...pageState,
      loadingNotSettled,
      loadingIndicators,
      violations,
      passes: axe.passes.length,
      incomplete: axe.incomplete.map((item) => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.length,
      })),
      ...errors,
    };

    if (
      result.notFound ||
      result.overflow ||
      result.loadingNotSettled ||
      errors.pageErrors.length ||
      violations.length > 0
    ) {
      const screenshot = path.join(
        outputDir,
        `${persona}-${String(index + 1).padStart(3, '0')}-${route.url.replaceAll('/', '_').replace(/^_/, '')}.png`,
      );
      await auditPage.screenshot({ path: screenshot, fullPage: false });
      result.screenshot = screenshot;
    }
    results.push(result);
    if ((index + 1) % 20 === 0 || index + 1 === routes.length) {
      console.log(
        JSON.stringify({
          checked: index + 1,
          total: routes.length,
          route: route.url,
          violations: violations.reduce((sum, violation) => sum + violation.nodes.length, 0),
          notFound: result.notFound,
          overflow: result.overflow,
          pageErrors: errors.pageErrors.length,
        }),
      );
    }
  };

  for (const [index, route] of routes.entries()) {
    const auditPage = route.url === '/w/auth/otp' ? otpPage : page;
    await scanRoute(route, index, route.url === '/w/auth/otp' ? 'mfa' : 'developer', auditPage);
  }

  await adminPage.goto(`${baseUrl}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await adminPage.getByLabel('Email').fill('developer@vittrade.local');
  await adminPage.getByTestId('auth-password').fill('Preview-123!');
  await adminPage.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await adminPage.waitForURL('**/w/home');
  const previewToggle = adminPage.getByRole('button', { name: 'Mở công cụ xem trước' });
  if (await previewToggle.count()) await previewToggle.click();
  await adminPage.locator('#preview-persona').selectOption('admin');
  await adminPage.getByRole('button', { name: 'Áp dụng tài khoản', exact: true }).click();
  await adminPage.getByText(/persona Admin/).waitFor({ timeout: 15000 });
  await adminPage.evaluate((theme) => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, themeName);
  const closePreview = adminPage.getByRole('button', { name: 'Thu gọn' });
  if (await closePreview.count()) await closePreview.click();
  pageErrors.splice(0);
  consoleErrors.splice(0);
  apiResponses.splice(0);
  externalRequests.splice(0);
  for (const route of adminRoutes) {
    const index = routes.indexOf(route);
    await scanRoute(route, index, 'admin', adminPage);
  }
  await adminContext.close();

  const report = {
    schemaVersion: 1,
    observedAt: new Date().toISOString(),
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    sourceState: changedPaths.length === 0 ? 'clean' : 'dirty',
    dirtyFileHashes,
    environment: {
      baseUrl,
      browser: 'Playwright Chromium',
      viewport: `${viewportWidth}x${viewportHeight}`,
      theme: `${themeName} class forced on document root after local mock login`,
      networkIsolation:
        'Chromium host resolver maps external DNS names to NOTFOUND; Playwright also aborts non-loopback requests.',
      externalRequestsBlocked: true,
      backend: 'not contacted; local development mock/MSW only',
    },
    plannedResults: routesPerTheme,
    completedResults: results.length,
    routeCatalog: 'docs/architecture/production-readiness/TRACKING.json routes[].resolvedUrls',
    summary: {
      routes: results.length,
      plannedRoutes: routesPerTheme,
      personaThemeCounts: Object.fromEntries(
        [...new Set(results.map((item) => `${item.persona}/${themeName}`))].map((key) => [
          key,
          results.filter((item) => `${item.persona}/${themeName}` === key).length,
        ]),
      ),
      routeMismatches: results.filter((item) => item.path !== item.url).map((item) => item.url),
      notFoundRoutes: results.filter((item) => item.notFound).map((item) => item.url),
      horizontalOverflow: results.filter((item) => item.overflow).map((item) => item.url),
      pageErrors: results.flatMap((item) => item.pageErrors),
      loadingNotSettledRoutes: results
        .filter((item) => item.loadingNotSettled)
        .map((item) => ({
          url: item.url,
          persona: item.persona,
          indicators: item.loadingIndicators,
        })),
      consoleErrorCount: results.reduce((sum, item) => sum + item.consoleErrors.length, 0),
      consoleErrorsByMessage: Object.fromEntries(
        [...new Set(results.flatMap((item) => item.consoleErrors))].map((message) => [
          message,
          results.flatMap((item) => item.consoleErrors).filter((item) => item === message).length,
        ]),
      ),
      externalRequestAttemptsBlocked: results.flatMap((item) => item.externalRequests).length,
      externalRequestAttemptsByHost: Object.fromEntries(
        [
          ...new Set(
            results.flatMap((item) =>
              item.externalRequests.map(({ url }) => new URL(url).hostname),
            ),
          ),
        ].map((host) => [
          host,
          results
            .flatMap((item) => item.externalRequests)
            .filter(({ url }) => new URL(url).hostname === host).length,
        ]),
      ),
      axeIncompleteByRule: Object.fromEntries(
        [...new Set(results.flatMap((item) => item.incomplete.map(({ id }) => id)))].map((id) => [
          id,
          results
            .flatMap((item) => item.incomplete)
            .reduce(
              (counts, item) => {
                if (item.id === id) {
                  counts.routeChecks += 1;
                  counts.nodeChecks += item.nodes;
                }
                return counts;
              },
              { routeChecks: 0, nodeChecks: 0 },
            ),
        ]),
      ),
      axeViolationNodes: results.reduce(
        (sum, item) =>
          sum + item.violations.reduce((inner, violation) => inner + violation.nodes.length, 0),
        0,
      ),
      axeViolationsById: Object.fromEntries(
        [
          ...new Set(results.flatMap((item) => item.violations.map((violation) => violation.id))),
        ].map((id) => [
          id,
          results
            .flatMap((item) => item.violations)
            .filter((violation) => violation.id === id)
            .reduce((sum, violation) => sum + violation.nodes.length, 0),
        ]),
      ),
    },
    results,
  };
  fs.writeFileSync(
    path.join(outputDir, 'ui-a11y-wide-report.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(`REPORT ${path.join(outputDir, 'ui-a11y-wide-report.json')}`);
  console.log(`SUMMARY ${JSON.stringify(report.summary)}`);
  await otpContext.close();
  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { resizeAuthenticatedHome } from './helpers/resize-home';
import { expect, test, type Locator } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paint } from './helpers/semantic-control-paint';

async function measured(control: Locator) {
  await control.scrollIntoViewIfNeeded();
  let result = await paint(control);
  await expect
    .poll(async () => {
      result = await paint(control);
      return { supported: result.supported, alpha: result.nominalAlpha, pressed: result.pressed };
    })
    .toEqual({ supported: true, alpha: 33, pressed: 'true' });
  expect(result.ratio).toBeGreaterThanOrEqual(4.5);
  expect(result.height).toBeGreaterThanOrEqual(36);
  expect(result.textWithin).toBe(true);
  expect(result.hits).toEqual([true, true, true]);
  return result;
}

for (const theme of ['light', 'dark'])
  for (const width of [390, 1440])
    test(`Analytics period focus Web${width} ${theme} @ui-mock`, async ({ page }, info) => {
      let writes = 0;
      page.on('request', (request) => {
        if (
          !['GET', 'HEAD', 'OPTIONS'].includes(request.method()) &&
          !new URL(request.url()).pathname.includes('/auth/')
        )
          writes++;
      });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/w/auth/login');
      await page.getByTestId('auth-email').fill('developer@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(page).toHaveURL('/w/home');
      if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
      await expect(page.locator('html')).toHaveClass(new RegExp('\\b' + theme + '\\b'));
      await resizeAuthenticatedHome(page, { width, height: 900 });
      await page.evaluate(async (moduleUrl) => {
        const { router } = await import(moduleUrl);
        await router.navigate('/w/trade/analytics');
      }, '/src/app/router/index.ts');
      await expect(page.getByText('Period 1M', { exact: true })).toBeVisible();
      const overview = page.getByRole('button', { name: /^overview$/i });
      const activePaint = await measured(overview);
      await page.getByRole('button', { name: /^assets$/i }).click();
      await expect(page.getByRole('heading', { name: 'Asset breakdown' })).toBeVisible();
      const period = page.getByRole('button', { name: '7D', exact: true });
      const original = await period.elementHandle();
      await period.focus();
      const response = page.waitForResponse((r) => {
        const url = new URL(r.url());
        return (
          url.pathname.endsWith('/trading/analytics') && url.searchParams.get('period') === '7D'
        );
      });
      await period.press('Enter');
      const received = await response;
      expect(received.status()).toBe(200);
      expect(received.fromServiceWorker()).toBe(true);
      await expect(page.getByText('Period 7D', { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Asset breakdown' })).toBeVisible();
      const retained = await original!.evaluate((element) => ({
        connected: element.isConnected,
        focused: document.activeElement === element,
      }));
      await period.hover();
      const selectedPeriodPaint = await measured(period);
      expect(selectedPeriodPaint.focusVisible).toBe(true);
      expect(selectedPeriodPaint.outlineStyle).not.toBe('none');
      const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
      const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
      expect(dependencyUrl).toBeTruthy();
      await page.evaluate(
        async ({ dependencyUrl, workerUrl, fixtureUrl }) => {
          const { worker } = await import(workerUrl);
          const { http, HttpResponse } = await import(dependencyUrl);
          const { getTradingAnalytics } = await import(fixtureUrl);
          worker.use(
            http.get('*/trading/analytics', ({ request }: { request: Request }) => {
              const period = new URL(request.url).searchParams.get('period') ?? '1M';
              return period === '3M'
                ? HttpResponse.json({ code: 'ANALYTICS_UNAVAILABLE' }, { status: 503 })
                : HttpResponse.json(getTradingAnalytics(period));
            }),
          );
        },
        {
          dependencyUrl: dependencyUrl!,
          workerUrl: '/src/dev/mocks/browser.ts',
          fixtureUrl: '/src/dev/mocks/trading-analytics-fixtures.ts',
        },
      );
      const failingPeriod = page.getByRole('button', { name: '3M', exact: true });
      await failingPeriod.focus();
      await failingPeriod.press('Enter');
      await expect(page.getByRole('alert')).toContainText('Có lỗi xảy ra');
      await expect(failingPeriod).toBeFocused();
      await expect(failingPeriod).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('Performance summary', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Assets', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      const recovery = page.getByRole('button', { name: '1Y', exact: true });
      await recovery.focus();
      await recovery.press('Enter');
      await expect(page.getByText('Period 1Y', { exact: true })).toBeVisible();
      await expect(recovery).toBeFocused();
      await expect(page.getByRole('heading', { name: 'Asset breakdown' })).toBeVisible();
      const observation = {
        route: '/w/trade/analytics',
        shell: 'Web',
        width,
        theme,
        activePaint,
        selectedPeriodPaint,
        retained,
        errorFilterFocusRetained: true,
        recoveredByPeriod: '1Y',
        activeElement: await page.evaluate(() => document.activeElement?.tagName),
        responseStatus: received.status(),
        fromWorker: received.fromServiceWorker(),
        writes,
      };
      await writeFile(
        info.outputPath('analytics-controls.json'),
        JSON.stringify(observation, null, 2),
      );
      console.log('C06_ANALYTICS_CONTROLS', JSON.stringify(observation));
      await page.screenshot({ path: info.outputPath('analytics-controls.png'), fullPage: true });
      expect(writes).toBe(0);
      expect(retained).toEqual({ connected: true, focused: true });
    });

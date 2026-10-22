import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paint } from './helpers/semantic-control-paint';

for (const theme of ['light', 'dark'])
  for (const profile of [
    { name: 'phone', prefix: '', width: 390 },
    { name: 'web', prefix: '/w', width: 1440 },
  ])
    for (const kind of [
      'launchpad',
      'prediction',
      'copy',
      'leaderboard-risk',
      'leaderboard-sort',
      'leaderboard-verified',
    ])
      test(`Discovery controls ${kind} ${profile.name} ${theme} @ui-mock`, async ({
        page,
      }, info) => {
        let writes = 0,
          failedReads = 0,
          workerReads = 0;
        const endpoint =
          kind === 'launchpad'
            ? '/launchpad/projects'
            : kind === 'prediction'
              ? '/predictions/events'
              : '/trading/copy/providers';
        page.on('request', (request) => {
          if (
            !['GET', 'HEAD', 'OPTIONS'].includes(request.method()) &&
            !new URL(request.url()).pathname.includes('/auth/')
          )
            writes++;
        });
        page.on('response', (response) => {
          if (new URL(response.url()).pathname.endsWith(endpoint)) {
            expect(response.fromServiceWorker()).toBe(true);
            workerReads++;
            if (response.status() === 503) failedReads++;
          }
        });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/w/auth/login');
        await page.getByTestId('auth-email').fill('developer@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(page).toHaveURL('/w/home');
        if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
        await page.setViewportSize({ width: profile.width, height: 900 });
        const route =
          kind === 'launchpad'
            ? '/launchpad'
            : kind === 'prediction'
              ? '/markets/predictions/search'
              : kind === 'copy'
                ? profile.name === 'web'
                  ? '/trade/copy'
                  : '/trade/copy-trading'
                : '/trade/copy-trading/leaderboard';
        const target = profile.prefix + route;
        await page.evaluate(
          async ({ url, target }) => {
            const { router } = await import(url);
            await router.navigate(target);
          },
          { url: '/src/app/router/index.ts', target },
        );
        await expect(page).toHaveURL(target);
        const resultName =
          kind === 'launchpad'
            ? 'Kết quả Launchpad'
            : kind === 'prediction'
              ? 'Kết quả prediction market'
              : kind === 'copy'
                ? 'Kết quả Copy Trading'
                : 'Kết quả bảng xếp hạng provider';
        const region = page.getByRole('region', { name: resultName, exact: true });
        await expect(region).toHaveAttribute('aria-busy', 'false');
        const control =
          kind === 'prediction'
            ? page.getByRole('textbox', { name: 'Tìm prediction market', exact: true })
            : kind === 'leaderboard-verified'
              ? page.getByRole('button', { name: /Chỉ hiện provider đã xác minh/ })
              : page.getByRole('button', {
                  name:
                    kind === 'launchpad'
                      ? 'Sắp tới'
                      : kind === 'copy'
                        ? 'Ổn định nhất'
                        : kind === 'leaderboard-sort'
                          ? 'Sharpe'
                          : 'Trung bình',
                  exact: true,
                });
        await expect(control).toBeVisible();
        await control.focus();
        const node = await control.elementHandle();
        if (!node) throw new Error('Control element is missing');
        expect(await node.evaluate((element) => element === document.activeElement)).toBe(true);
        const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
        const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
        if (!dependencyUrl) throw new Error('MSW dependency URL is missing');
        await page.evaluate(
          async ({ dependencyUrl, workerUrl, endpoint, kind }) => {
            const { worker } = await import(workerUrl);
            const { http, HttpResponse } = await import(dependencyUrl);
            let released = false;
            document.documentElement.dataset.uiDiscoveryMode = 'failure';
            worker.use(
              http.get('*' + endpoint, async ({ request }: { request: Request }) => {
                const params = new URL(request.url).searchParams;
                const selected =
                  kind === 'launchpad'
                    ? params.get('status') === 'upcoming'
                    : kind === 'prediction'
                      ? params.get('search') === 'btc'
                      : kind === 'copy' || kind === 'leaderboard-sort'
                        ? params.get('sort') === 'sharpe'
                        : kind === 'leaderboard-verified'
                          ? params.get('verified') === 'true'
                          : params.get('risk') === 'medium';
                if (!selected) return;
                document.documentElement.dataset.uiDiscoveryParameters = params.toString();
                if (!released) {
                  document.documentElement.dataset.uiDiscoveryWaiting = 'true';
                  await new Promise<void>((resolve) =>
                    window.addEventListener(
                      'ui-discovery-release',
                      () => {
                        released = true;
                        resolve();
                      },
                      { once: true },
                    ),
                  );
                  delete document.documentElement.dataset.uiDiscoveryWaiting;
                }
                if (document.documentElement.dataset.uiDiscoveryMode === 'failure')
                  return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
                return HttpResponse.json(
                  kind === 'launchpad' ? { projects: [], total: 0, activeCount: 0 } : { items: [] },
                );
              }),
            );
          },
          { dependencyUrl, workerUrl: '/src/dev/mocks/browser.ts', endpoint, kind },
        );
        let pending;
        try {
          if (kind === 'prediction') await control.pressSequentially('btc');
          else await control.press('Enter');
          await expect(page.locator('html')).toHaveAttribute('data-ui-discovery-waiting', 'true');
          await expect(region).toHaveAttribute('aria-busy', 'true');
          await expect(region.getByRole('status')).toBeVisible();
          pending = await node.evaluate((element) => ({
            connected: element.isConnected,
            focused: element === document.activeElement,
          }));
          expect(pending).toEqual({ connected: true, focused: true });
        } finally {
          await page.evaluate(() => window.dispatchEvent(new Event('ui-discovery-release')));
        }
        await expect(region.getByRole('alert')).toBeVisible();
        await expect(region).toHaveAttribute('aria-busy', 'false');
        const error = await node.evaluate((element) => ({
          connected: element.isConnected,
          focused: element === document.activeElement,
        }));
        expect(error).toEqual({ connected: true, focused: true });
        expect(await region.getByRole('button').count()).toBe(1);
        if (kind === 'prediction') await expect(control).toHaveValue('btc');
        else await expect(control).toHaveAttribute('aria-pressed', 'true');
        const measuredPaint = await paint(control);
        expect(measuredPaint.supported).toBe(true);
        expect(measuredPaint.ratio).toBeGreaterThanOrEqual(4.5);
        expect(measuredPaint.textWithin).toBe(true);
        expect(measuredPaint.hits).toEqual([true, true, true]);
        const focus = await node.evaluate((element) => {
          const owner = element.closest('.tr-search-bar-control') ?? element,
            style = getComputedStyle(owner),
            r = element.getBoundingClientRect();
          return {
            visible: element.matches(':focus-visible'),
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            fullyInViewport:
              r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
          };
        });
        expect(focus.visible).toBe(true);
        expect(focus.outlineStyle).not.toBe('none');
        expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
        expect(focus.fullyInViewport).toBe(true);
        const parameters = await page.locator('html').getAttribute('data-ui-discovery-parameters');
        const query = new URLSearchParams(parameters ?? '');
        expect(
          query.get(
            kind === 'launchpad'
              ? 'status'
              : kind === 'prediction'
                ? 'search'
                : kind === 'leaderboard-risk'
                  ? 'risk'
                  : kind === 'leaderboard-verified'
                    ? 'verified'
                    : 'sort',
          ),
        ).toBe(
          kind === 'launchpad'
            ? 'upcoming'
            : kind === 'prediction'
              ? 'btc'
              : kind === 'leaderboard-risk'
                ? 'medium'
                : kind === 'leaderboard-verified'
                  ? 'true'
                  : 'sharpe',
        );
        if (kind === 'prediction') expect(query.get('status')).toBe('active');
        await page.screenshot({ path: info.outputPath('discovery-error.png') });
        await page.evaluate(() => {
          document.documentElement.dataset.uiDiscoveryMode = 'recovered';
        });
        await region.getByRole('button', { name: 'Thử lại', exact: true }).click();
        await expect(region.getByRole('alert')).toHaveCount(0);
        await expect(region).toHaveAttribute('aria-busy', 'false');
        await expect(
          region.getByText(
            kind === 'launchpad'
              ? 'Không có dự án phù hợp.'
              : kind === 'prediction'
                ? 'Không có prediction market phù hợp.'
                : 'Không có provider phù hợp.',
            { exact: true },
          ),
        ).toBeVisible();
        expect(await node.evaluate((element) => element.isConnected)).toBe(true);
        if (kind === 'prediction') {
          await page.getByRole('button', { name: 'Xóa tìm kiếm', exact: true }).click();
          await expect(control).toHaveValue('');
          await expect(control).toBeFocused();
        } else await expect(control).toHaveAttribute('aria-pressed', 'true');
        expect(writes).toBe(0);
        expect(failedReads).toBeGreaterThan(0);
        expect(workerReads).toBeGreaterThan(failedReads);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const observation = {
          target,
          kind,
          theme,
          profile,
          pending,
          error,
          paint: measuredPaint,
          focus,
          parameters,
          retryRecovered: true,
          writes,
          failedReads,
          workerReads,
          scope:
            'Actual app/routes/providers and shipped MSW; held selected GET then503 and explicit empty-success retry. Native keyboard/focus/paint in two viewports/themes. Synthetic read only; not backend, AT, zoom, UAT, every alias or human visual approval.',
        };
        await writeFile(
          info.outputPath('discovery-controls.json'),
          JSON.stringify(observation, null, 2),
        );
        console.log('C06_DISCOVERY_CONTROLS', JSON.stringify(observation));
      });

import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import type { DCAOverview } from '@/features/dca';

for (const mode of ['light', 'dark'] as const) {
  for (const width of [320, 440]) {
    test(`DCA hero loading grid ${width} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      let writes = 0;
      page.on('request', (request) => {
        if (request.method() !== 'GET' && new URL(request.url()).pathname.includes('/dca/'))
          writes++;
      });
      await page.goto('/dev/dca-overview', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'DCA Overview Card Demo', exact: true }),
      ).toBeVisible();
      await page.locator('html').evaluate((html, mode) => {
        html.classList.toggle('light', mode === 'light');
        html.classList.toggle('dark', mode === 'dark');
      }, mode);
      await page.evaluate(() => document.fonts.ready);
      const cards = page.locator(
        '[data-slot="tr-card"]:not([data-slot="tr-card"] [data-slot="tr-card"])',
      );
      await expect(cards).toHaveCount(6);
      const loaded = await cards
        .first()
        .locator('.grid')
        .evaluate((grid) => ({
          columns: getComputedStyle(grid).gridTemplateColumns,
          width: grid.getBoundingClientRect().width,
          cells: [...grid.children].map((cell) => cell.getBoundingClientRect().width),
        }));
      await page.getByRole('button', { name: 'Show Loading', exact: true }).press('Enter');
      await expect(cards).toHaveCount(7);
      const pending = await cards
        .first()
        .locator('.grid')
        .evaluate((grid) => ({
          columns: getComputedStyle(grid).gridTemplateColumns,
          width: grid.getBoundingClientRect().width,
          cells: [...grid.children].map((cell) => cell.getBoundingClientRect().width),
        }));
      expect.soft(pending.cells).toHaveLength(3);
      expect.soft(loaded.columns.split(/\s+/)).toHaveLength(width === 320 ? 1 : 2);
      expect.soft(pending.columns).toBe(loaded.columns);
      expect.soft(pending.width).toBe(loaded.width);
      expect.soft(pending.cells).toEqual(loaded.cells);
      await page.getByRole('button', { name: 'Hide Loading', exact: true }).press('Enter');
      await expect(cards).toHaveCount(6);
      expect(writes).toBe(0);
      await writeFile(
        info.outputPath('dca-hero-loading-grid.json'),
        JSON.stringify({ mode, width, loaded, pending, writes }, null, 2),
      );
      console.log(
        'C06_DCA_HERO_LOADING_GRID',
        JSON.stringify({ mode, width, loaded, pending, writes }),
      );
    });
  }
}

type Scenario = 'default' | 'large' | 'loss-mixed' | 'no-next';
const profiles = [
  {
    name: 'phone320',
    prefix: '',
    width: 320,
    height: 900,
    states: ['default', 'large', 'loss-mixed', 'no-next'],
  },
  { name: 'phone390', prefix: '', width: 390, height: 844, states: ['default'] },
  { name: 'phone440', prefix: '', width: 440, height: 900, states: ['default'] },
  { name: 'tablet900', prefix: '/t', width: 900, height: 900, states: ['large'] },
  { name: 'web1440', prefix: '/w', width: 1440, height: 900, states: ['large'] },
  ...[375, 376, 767, 768, 1023, 1024].map((width) => ({
    name: 'responsive' + width,
    prefix: '/r',
    width,
    height: 900,
    states: ['default'],
  })),
];

for (const mode of ['light', 'dark'] as const)
  for (const profile of profiles)
    for (const scenario of profile.states) {
      const state = scenario as Scenario;
      test(`DCA hero layout ${profile.name} ${mode} ${state} @ui-mock`, async ({ page }, info) => {
        await page.setViewportSize({ width: profile.width, height: profile.height });
        let writes = 0;
        page.on('request', (request) => {
          if (request.method() !== 'GET' && new URL(request.url()).pathname.includes('/dca/'))
            writes++;
        });
        await page.goto(profile.prefix + '/dca', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('auth-email')).toBeVisible();
        const source = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
        const dependencyUrl = source.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
        expect(dependencyUrl).toBeTruthy();
        const overview = await page.evaluate(
          async ({ state, dependencyUrl, workerUrl, fixtureUrl }) => {
            const { worker } = await import(workerUrl);
            const { http, HttpResponse } = await import(dependencyUrl);
            const { INITIAL_DCA_PLANS, getTestDcaSnapshot } = await import(fixtureUrl);
            const plans = INITIAL_DCA_PLANS.map(
              (
                plan: { currentHoldings: number; totalInvested: number; averageCost: number },
                index: number,
              ) => ({
                ...plan,
                ...(state === 'large'
                  ? { currentHoldings: plan.currentHoldings * 1000 }
                  : state === 'loss-mixed'
                    ? {
                        totalInvested: plan.totalInvested * 1000,
                        averageCost: plan.averageCost * 1000,
                        status: ['active', 'paused', 'error'][index],
                      }
                    : state === 'no-next'
                      ? { status: 'paused' }
                      : {}),
              }),
            );
            const snapshot = getTestDcaSnapshot(plans);
            worker.use(http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)));
            return snapshot.overview as DCAOverview;
          },
          {
            state,
            dependencyUrl: dependencyUrl!,
            workerUrl: '/src/dev/mocks/browser.ts',
            fixtureUrl: '/src/dev/mocks/dca-fixtures.ts',
          },
        );
        await page.getByTestId('auth-email').fill('dca@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(
          page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true }),
        ).toBeVisible();
        await expect.poll(() => new URL(page.url()).pathname).toBe(profile.prefix + '/dca');
        await page.locator('html').evaluate((html, mode) => {
          html.classList.toggle('light', mode === 'light');
          html.classList.toggle('dark', mode === 'dark');
        }, mode);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            document
              .getAnimations()
              .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
              .map((animation) => animation.finished.catch(() => undefined)),
          );
        });
        const card = page
          .getByText('Tổng danh mục DCA (VND)', { exact: true })
          .locator('xpath=ancestor::*[@data-slot="tr-card"][1]');
        const fullBalance =
          '₫' + new Intl.NumberFormat('vi-VN').format(Math.round(overview.currentValue));
        await expect(card.getByText(fullBalance, { exact: true })).toBeVisible();
        if (state === 'no-next')
          await expect(card.getByText('Không có lịch mua', { exact: true })).toBeVisible();
        if (state === 'loss-mixed')
          for (const status of ['1 đang chạy', '1 tạm dừng', '1 lỗi'])
            await expect(card.getByTitle(status, { exact: true })).toBeVisible();
        const geometry = await card.evaluate((card) => {
          const svg = card.querySelector<SVGSVGElement>(
            'button[aria-label="Xem biểu đồ chi tiết"] svg',
          )!;
          const path = svg.querySelector<SVGPathElement>('path[stroke]')!;
          const matrix = path.getScreenCTM()!,
            length = path.getTotalLength(),
            chart = svg.getBoundingClientRect(),
            bounds = card.getBoundingClientRect();
          const points = [];
          for (let i = 0; i <= Math.ceil(length * 4); i++) {
            const point = path.getPointAtLength(Math.min(length, i / 4));
            const transformed = new DOMPoint(point.x, point.y).matrixTransform(matrix);
            points.push({ x: transformed.x, y: transformed.y });
          }
          const rect = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
          const metricLabels = ['Kế hoạch', 'Đã đầu tư', 'TB/plan'];
          const tiles = [...card.querySelectorAll('span')]
            .filter((node) => metricLabels.includes(node.textContent?.trim() ?? ''))
            .map((label) => label.parentElement!.parentElement!);
          const values = [],
            walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode,
              text = node.textContent?.trim() ?? '';
            if (!text || !/[\d₫]/.test(text)) continue;
            const tile = tiles.find((tile) => tile.contains(node));
            const clipped = node.parentElement!.closest('p.truncate');
            const owner = (tile ?? clipped ?? card).getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const r of range.getClientRects()) {
              const overlapsChart =
                Math.min(r.right, chart.right) - Math.max(r.left, chart.left) > 0.01 &&
                Math.min(r.bottom, chart.bottom) - Math.max(r.top, chart.top) > 0.01;
              const samples = points.filter(
                (point) =>
                  point.x >= r.left &&
                  point.x <= r.right &&
                  point.y >= r.top &&
                  point.y <= r.bottom,
              ).length;
              values.push({
                text,
                rect: rect(r),
                owner: rect(owner),
                chartPathSamplesInsideTextRange: samples,
                overlapsChart,
                outsideOwner: r.left < owner.left - 0.5 || r.right > owner.right + 0.5,
              });
            }
          }
          return {
            card: rect(bounds),
            chart: rect(chart),
            values,
            metricCount: tiles.length,
            documentOverflow: document.documentElement.scrollWidth > innerWidth,
            scope:
              'Actual numeric text range boxes, metric/ellipsis boundaries and SVG bounds/path samples. Not glyph-pixel, AT or whole-page WCAG proof.',
          };
        });
        expect.soft(geometry.metricCount).toBe(3);
        expect.soft(geometry.documentOverflow).toBe(false);
        expect
          .soft(
            geometry.values.filter(
              (value) => value.overlapsChart || value.chartPathSamplesInsideTextRange > 0,
            ),
          )
          .toEqual([]);
        expect.soft(geometry.values.filter((value) => value.outsideOwner)).toEqual([]);
        await card.getByRole('button', { name: 'Ẩn số dư', exact: true }).press('Enter');
        await expect(card.getByText('••••••', { exact: true })).toBeVisible();
        await card.getByRole('button', { name: 'Hiện số dư', exact: true }).press('Enter');
        await expect(card.getByText(fullBalance, { exact: true })).toBeVisible();
        expect(writes).toBe(0);
        const observation = { profile, mode, state, overview, writes, geometry };
        await writeFile(
          info.outputPath('dca-hero-layout.json'),
          JSON.stringify(observation, null, 2),
        );
        await page.screenshot({
          path: info.outputPath('dca-hero-layout.png'),
          fullPage: true,
          animations: 'disabled',
        });
        console.log('C06_DCA_HERO_LAYOUT', JSON.stringify(observation));
      });
    }

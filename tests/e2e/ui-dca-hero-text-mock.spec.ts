import { expect, test, type Locator } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { measureNativeTextSurface } from './helpers/text-surface-paint';

const profiles = [
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'web', prefix: '/w', width: 1440, height: 900 },
] as const;

for (const mode of ['light', 'dark'] as const) {
  for (const state of ['profit', 'loss-mixed-status'] as const) {
    for (const profile of profiles) {
      test(`DCA hero text ${profile.name} ${mode} ${state} @ui-mock`, async ({ page }, info) => {
        await page.setViewportSize({ width: profile.width, height: profile.height });
        let writes = 0;
        page.on('request', (request) => {
          if (request.method() !== 'GET' && new URL(request.url()).pathname.includes('/dca/'))
            writes++;
        });
        await page.goto(`${profile.prefix}/dca`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('auth-email')).toBeVisible();
        const handlers = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
        const dependencyUrl = handlers.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
        expect(dependencyUrl, 'Use the MSW instance loaded by the real Vite app').toBeTruthy();
        // Override the read before login/first snapshot; calculations come from the existing fixture.
        const overview = await page.evaluate(
          async ({ dependencyUrl, state, workerUrl, fixtureUrl }) => {
            const { worker } = await import(workerUrl);
            const { http, HttpResponse } = await import(dependencyUrl);
            const { INITIAL_DCA_PLANS, getTestDcaSnapshot } = await import(fixtureUrl);
            const plans =
              state === 'profit'
                ? INITIAL_DCA_PLANS
                : INITIAL_DCA_PLANS.map(
                    (plan: { totalInvested: number; averageCost: number }, index: number) => ({
                      ...plan,
                      status: ['active', 'paused', 'error'][index],
                      totalInvested: plan.totalInvested * 1000,
                      averageCost: plan.averageCost * 1000,
                    }),
                  );
            const snapshot = getTestDcaSnapshot(plans);
            worker.use(http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)));
            return snapshot.overview as {
              currentValue: number;
              profitLoss: number;
              profitLossPercent: number;
              activePlans: number;
              pausedPlans: number;
              errorPlans: number;
            };
          },
          {
            dependencyUrl: dependencyUrl!,
            state,
            workerUrl: '/src/dev/mocks/browser.ts',
            fixtureUrl: '/src/dev/mocks/dca-fixtures.ts',
          },
        );
        expect(overview.profitLoss >= 0).toBe(state === 'profit');
        await page.getByTestId('auth-email').fill('dca@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(
          page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true }),
        ).toBeVisible();
        await expect.poll(() => new URL(page.url()).pathname).toBe(`${profile.prefix}/dca`);
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
        const balanceText =
          '₫' + new Intl.NumberFormat('vi-VN').format(Math.round(overview.currentValue));
        const balance = card.getByText(balanceText, { exact: true });
        await expect(balance).toBeVisible();
        const metric = (label: string) =>
          card.getByText(label, { exact: true }).locator('../..').locator(':scope > div').nth(1);
        const pnl = card
          .getByText('tổng lãi/lỗ', { exact: true })
          .locator('..')
          .locator(':scope > div')
          .first();
        const expectedProfit =
          (overview.profitLoss >= 0 ? '+' : '') +
          new Intl.NumberFormat('vi-VN').format(Math.round(overview.profitLoss));
        await expect(pnl).toContainText(expectedProfit);
        await expect(pnl.locator(':scope > span')).toHaveText(
          '(' +
            (overview.profitLossPercent >= 0 ? '+' : '') +
            overview.profitLossPercent.toFixed(1).replace('.', ',') +
            '%)',
        );
        const targets: [string, Locator][] = [
          ['balance', balance],
          ['plans', metric('Kế hoạch')],
          ['invested', metric('Đã đầu tư')],
          ['average', metric('TB/plan')],
          [
            'next',
            card
              .getByText('Lần mua tiếp', { exact: true })
              .locator('..')
              .locator(':scope > p')
              .nth(1),
          ],
          ['pnl', pnl],
          ['percent', pnl.locator(':scope > span')],
          ['chartCaption', card.getByText('90 ngày', { exact: true })],
          [
            'activeBadge',
            card.getByTitle(overview.activePlans + ' đang chạy', { exact: true }).locator('span'),
          ],
        ];
        if (state === 'loss-mixed-status') {
          targets.push(
            ['pausedBadge', card.getByTitle('1 tạm dừng', { exact: true }).locator('span')],
            ['errorBadge', card.getByTitle('1 lỗi', { exact: true }).locator('span')],
          );
        }
        const rows = [];
        for (const [name, target] of targets)
          rows.push(await measureNativeTextSurface(page, target, name, info));
        // Nominal font colors over native rendered gradient/tints. Does not measure SVG/glyph overlap.
        for (const row of rows) {
          expect.soft(row.minimumRatio, row.name).toBeGreaterThanOrEqual(row.threshold);
          expect(row.surfaceOwnerCount, row.name).toBe(
            ['plans', 'invested', 'average'].includes(row.name) ? 2 : 1,
          );
        }
        await card.getByRole('button', { name: 'Ẩn số dư', exact: true }).press('Enter');
        await expect(card.getByText('••••••', { exact: true })).toBeVisible();
        await expect(balance).toHaveCount(0);
        await card.getByRole('button', { name: 'Hiện số dư', exact: true }).press('Enter');
        await expect(balance).toBeVisible();
        expect(writes).toBe(0);
        const observation = {
          profile,
          mode,
          state,
          overview,
          writes,
          rows,
          scope:
            'Local MSW read-only snapshot; CSS modes, not persistence. No backend, AT, whole-page contrast or human approval.',
        };
        await writeFile(
          info.outputPath('dca-hero-text.json'),
          JSON.stringify(observation, null, 2),
        );
        await page.screenshot({
          path: info.outputPath('dca-hero-product.png'),
          fullPage: true,
          animations: 'disabled',
        });
        console.log('C06_DCA_HERO_TEXT', JSON.stringify(observation));
      });
    }
  }
}

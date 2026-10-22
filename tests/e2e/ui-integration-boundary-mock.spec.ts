import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  ...[320, 767, 1024, 1440].map((width) => ({ route: '/onboarding', width })),
  { route: '/trade/convert', width: 390 },
  { route: '/t/trade/convert', width: 900 },
  { route: '/w/trade/convert', width: 1440 },
  { route: '/r/trade/convert', width: 767 },
];

async function start(page: Page, theme: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w/p2p/my-ads');
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/w/p2p/my-ads');
  if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
  await expect(page.locator('html')).toHaveClass(new RegExp('\\b' + theme + '\\b'));
}

for (const theme of ['light', 'dark']) {
  for (const profile of profiles) {
    test(`Integration boundary tint ${profile.route} ${profile.width} ${theme} @ui-mock`, async ({
      page,
    }, info) => {
      let nonAuthWrites = 0;
      page.on('request', (r) => {
        if (
          /POST|PATCH|PUT|DELETE/.test(r.method()) &&
          new URL(r.url()).pathname.startsWith('/api/') &&
          !new URL(r.url()).pathname.includes('/auth/')
        )
          nonAuthWrites++;
      });
      await start(page, theme);
      await page.setViewportSize({ width: profile.width, height: 900 });
      await page.evaluate(
        async ({ target, moduleUrl }) => {
          const { router } = await import(moduleUrl);
          await router.navigate(target);
        },
        { target: profile.route, moduleUrl: '/src/app/router/index.ts' },
      );
      await expect(page).toHaveURL(profile.route);
      await expect(
        page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production', exact: true }),
      ).toBeVisible();
      await expect(page.getByText(profile.route, { exact: true })).toBeVisible();
      await expect(page.getByText(/Không có dữ liệu giả/)).toBeVisible();
      const icon = page.locator('svg.lucide-database');
      const paint = await icon.evaluate((svg) => {
        const element = svg.parentElement!;
        const style = getComputedStyle(element);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d')!;
        const sample = (color: string) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data];
        };
        const control = document.createElement('div');
        control.setAttribute('aria-hidden', 'true');
        control.style.position = 'fixed';
        control.style.left = '-10000px';
        control.style.background = 'var(--tr-buy)18';
        document.body.append(control);
        try {
          const r = element.getBoundingClientRect();
          return {
            declared: element.style.background,
            computed: style.backgroundColor,
            rgba: sample(style.backgroundColor),
            invalidControl: sample(getComputedStyle(control).backgroundColor),
            size: { width: r.width, height: r.height },
          };
        } finally {
          control.remove();
        }
      });
      // Existing withAlpha rounds custom hex18 to9%; inspect actual browser paint.
      expect(paint.rgba[3]).toBe(23);
      expect(paint.invalidControl[3]).toBe(0);
      expect(paint.size).toEqual({ width: 48, height: 48 });
      const home = page.getByRole('button', { name: 'Về trang chính', exact: true });
      await home.scrollIntoViewIfNeeded();
      const bounds = await home.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return {
          height: r.height,
          hits: [0.1, 0.5, 0.9].map((x) => {
            const h = document.elementFromPoint(r.x + r.width * x, r.y + r.height / 2);
            return h === e || Boolean(h && e.contains(h));
          }),
        };
      });
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.hits).toEqual([true, true, true]);
      expect(nonAuthWrites).toBe(0);
      await page.screenshot({
        path: info.outputPath('integration-boundary.png'),
        animations: 'disabled',
      });
      await writeFile(
        info.outputPath('integration-boundary-paint.json'),
        JSON.stringify(
          {
            theme,
            profile,
            paint,
            bounds,
            nonAuthWrites,
          },
          null,
          2,
        ),
      );
    });
  }
}

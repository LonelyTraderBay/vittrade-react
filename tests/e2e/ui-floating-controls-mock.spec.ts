import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

async function start(page: Page, theme: string, route = '/dca') {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w' + route);
  await page
    .getByTestId('auth-email')
    .fill(route === '/dca' ? 'dca@vittrade.local' : 'developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(new RegExp('/w' + route + '$'));
  if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
  await expect(page.locator('html')).toHaveClass(new RegExp('\\b' + theme + '\\b'));
}

async function navigate(page: Page, url: string) {
  await page.evaluate(
    async ({ moduleUrl, target }) => {
      const { router } = await import(moduleUrl);
      await router.navigate(target);
    },
    { moduleUrl: '/src/app/router/index.ts', target: url },
  );
  await expect(page).toHaveURL(url);
}

for (const theme of ['light', 'dark']) {
  for (const motion of ['reduce', 'no-preference'] as const) {
    for (const size of [
      { width: 390, height: 900 },
      { width: 767, height: 900 },
      { width: 568, height: 320 },
    ]) {
      test(`Phone floating action ${size.width}x${size.height} ${theme} ${motion} @ui-mock`, async ({
        page,
      }, info) => {
        let writes = 0;
        page.on('request', (r) => {
          if (
            /POST|PATCH|PUT|DELETE/.test(r.method()) &&
            new URL(r.url()).pathname.includes('/dca/')
          )
            writes++;
        });
        await page.emulateMedia({ reducedMotion: motion });
        await start(page, theme);
        await page.setViewportSize(size);
        await navigate(page, '/dca');
        await expect(page.getByRole('button', { name: /^Kế hoạch \(/ })).toBeVisible();
        const fab = page.locator('button[aria-label="Cuộn lên đầu trang"]');
        const accessibleFab = page.getByRole('button', { name: 'Cuộn lên đầu trang', exact: true });
        await expect(fab).toBeDisabled();
        await expect(fab).toHaveAttribute('aria-hidden', 'true');
        await expect(accessibleFab).toHaveCount(0);
        const home = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', {
          name: 'Trang chủ',
          exact: true,
        });
        await home.focus();
        await page.keyboard.press('Shift+Tab');
        await expect(fab).not.toBeFocused();

        const scroll = page.locator('[data-pull-scroll]');
        await scroll.evaluate((e) => {
          e.scrollTop = 500;
        });
        await expect(accessibleFab).toHaveCount(1);
        await expect(fab).toBeEnabled();
        await expect
          .poll(() => fab.evaluate((e) => getComputedStyle(e).transform))
          .toBe('matrix(1, 0, 0, 1, 0, 0)');
        await expect.poll(() => fab.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
        const geometry = await fab.evaluate((e) => {
          const r = e.getBoundingClientRect();
          const f = document.querySelector('#app-layout-root')!.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return {
            rect: { x: r.x, y: r.y, width: r.width, height: r.height },
            insideFrame:
              r.left >= f.left && r.right <= f.right && r.top >= f.top && r.bottom <= f.bottom,
            hit: hit === e || Boolean(hit && e.contains(hit)),
            position: getComputedStyle(e).position,
          };
        });
        expect(geometry.insideFrame).toBe(true);
        expect(geometry.hit).toBe(true);
        expect(geometry.position).toBe('absolute');
        expect(geometry.rect.width).toBe(40);
        expect(geometry.rect.height).toBe(40);
        const cta = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
        const clearance = await cta.evaluate((e, f) => {
          const r = e.getBoundingClientRect();
          return {
            gap: r.top - (f.y + f.height),
            overlap:
              Math.max(0, Math.min(r.right, f.x + f.width) - Math.max(r.left, f.x)) *
              Math.max(0, Math.min(r.bottom, f.y + f.height) - Math.max(r.top, f.y)),
            hits: [0.1, 0.5, 0.98].map((x) => {
              const h = document.elementFromPoint(r.x + r.width * x, r.y + r.height / 2);
              return h === e || Boolean(h && e.contains(h));
            }),
          };
        }, geometry.rect);
        expect(clearance.overlap).toBe(0);
        expect(clearance.gap).toBeGreaterThanOrEqual(16);
        expect(clearance.hits).toEqual([true, true, true]);
        await page.screenshot({ path: info.outputPath('fab-visible.png'), animations: 'disabled' });
        await cta.click();
        const dialog = page.getByRole('dialog', { name: 'Tạo Kế Hoạch DCA Mới', exact: true });
        await expect(dialog).toBeVisible();
        const modal = await fab.evaluate((e) => {
          const r = e.getBoundingClientRect();
          const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return {
            backgroundHidden: Boolean(e.closest('[aria-hidden="true"],[inert]')),
            hit: h === e || Boolean(h && e.contains(h)),
            pointerEvents: getComputedStyle(e).pointerEvents,
          };
        });
        expect(modal.backgroundHidden).toBe(true);
        expect(modal.hit).toBe(false);
        for (let i = 0; i < 8; i++) {
          await page.keyboard.press('Tab');
          expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(true);
        }
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(cta).toBeFocused();
        // Record the real native call while still forwarding it to the browser.
        await scroll.evaluate((e) => {
          const original = e.scrollTo.bind(e);
          e.scrollTo = (options?: ScrollToOptions | number, y?: number) => {
            if (typeof options === 'number') {
              e.setAttribute('data-last-scroll-behavior', 'auto');
              original(options, y ?? 0);
            } else {
              e.setAttribute('data-last-scroll-behavior', options?.behavior ?? 'auto');
              original(options);
            }
          };
        });
        await fab.focus();
        await page.keyboard.press('Enter');
        await expect(scroll).toHaveAttribute(
          'data-last-scroll-behavior',
          motion === 'reduce' ? 'auto' : 'smooth',
        );
        await expect.poll(() => scroll.evaluate((e) => e.scrollTop)).toBe(0);
        await expect(fab).toBeDisabled();
        await expect(accessibleFab).toHaveCount(0);
        expect(writes).toBe(0);
        await writeFile(
          info.outputPath('floating-action.json'),
          JSON.stringify(
            {
              theme,
              motion,
              size,
              geometry,
              clearance,
              modal,
              writes,
            },
            null,
            2,
          ),
        );
      });
    }
  }

  for (const profile of [
    { prefix: '', width: 390 },
    { prefix: '/w', width: 1440 },
  ]) {
    test(`Toast keyboard focus ${profile.prefix || 'phone'} ${theme} @ui-mock`, async ({
      page,
    }, info) => {
      let writes = 0;
      page.on('request', (r) => {
        if (/POST|PATCH|PUT|DELETE/.test(r.method()) && new URL(r.url()).pathname.includes('/p2p/'))
          writes++;
      });
      await start(page, theme, '/p2p/my-ads');
      await page.setViewportSize({ width: profile.width, height: 900 });
      await navigate(page, profile.prefix + '/p2p/my-ads');
      await expect(
        page.getByRole('heading', { name: 'Quảng cáo của tôi', exact: true }),
      ).toBeVisible();
      const source = await (await page.request.get('/src/shared/ui/ThemedToaster.tsx')).text();
      const moduleUrl = source.match(/from ["']([^"']*sonner\.js[^"']*)["']/)?.[1];
      expect(moduleUrl).toBeTruthy();
      await page.evaluate(async (url) => {
        const { toast } = await import(url);
        toast.error('C06: kiểm tra focus', { id: 'float-focus', duration: 60_000 });
      }, moduleUrl!);
      const toast = page.locator('[data-sonner-toast]');
      await expect(toast).toHaveCount(1);
      const css = () =>
        toast.evaluate((e) => {
          const c = getComputedStyle(e);
          return {
            focusVisible: e.matches(':focus-visible'),
            outlineStyle: c.outlineStyle,
            outlineWidth: c.outlineWidth,
            outlineOffset: c.outlineOffset,
            outlineColor: c.outlineColor,
            radius: c.borderRadius,
            shadow: c.boxShadow,
          };
        });
      const before = await css();
      await page.keyboard.press('Alt+t');
      await expect(page.locator('[data-sonner-toaster]')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(toast).toBeFocused();
      const after = await css();
      expect(after.focusVisible).toBe(true);
      expect(after.outlineStyle).toBe('solid');
      expect(after.outlineWidth).toBe('2px');
      expect(after.outlineOffset).toBe('2px');
      expect(after.radius).toBe('14px');
      expect(after.shadow).toBe(before.shadow);
      expect(before.outlineStyle).toBe('none');
      await page.screenshot({ path: info.outputPath('toast-focus.png'), animations: 'disabled' });
      expect(writes).toBe(0);
      await writeFile(
        info.outputPath('toast-focus.json'),
        JSON.stringify({ theme, profile, before, after, writes }, null, 2),
      );
    });
  }
}

import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { prefix: '', width: 320, height: 844 },
  { prefix: '/t', width: 900, height: 900 },
  { prefix: '/w', width: 1440, height: 900 },
  { prefix: '/r', width: 1024, height: 900 },
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`DCA bounded coin images ${profile.prefix || 'phone'} ${theme} @ui-mock`, async ({
      page,
      context,
    }, info) => {
      await page.setViewportSize(profile);
      const imageRequests: string[] = [];
      let avatarRequests = 0;
      let writes = 0;
      await context.route(/^https?:\/\/(?:cryptologos\.cc|ui-avatars\.com)\//, async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.hostname === 'ui-avatars.com') {
          avatarRequests++;
          await route.abort('failed');
          return;
        }
        // MSW passthrough image loads can reach routing as worker-owned fetch requests.
        if (url.hostname === 'cryptologos.cc') {
          imageRequests.push(url.pathname);
          await route.abort('failed');
        }
      });
      page.on('request', (request) => {
        if (request.method() !== 'GET' && new URL(request.url()).pathname.includes('/dca/'))
          writes++;
      });

      await page.goto(`${profile.prefix}/dca`);
      await page.getByTestId('auth-email').fill('dca@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(
        page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true }),
      ).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${profile.prefix}/dca$`));
      await page.locator('html').evaluate((html, mode) => {
        html.classList.toggle('light', mode === 'light');
      }, theme);

      const planIcons = page.locator('span[role="img"][aria-label]');
      // The default DCA fixture owns three plans; wait for every failed image to reach fallback.
      await expect(planIcons).toHaveCount(3);
      const planCount = await planIcons.count();
      type IconBox = { width: number; height: number; label: string | null };
      let planBoxes: IconBox[] = [];
      await expect
        .poll(async () => {
          planBoxes = await planIcons.evaluateAll((elements) =>
            elements.map((element) => {
              const { width, height } = element.getBoundingClientRect();
              return { width, height, label: element.getAttribute('aria-label') };
            }),
          );
          return planBoxes.map(({ width, height }) => ({ width, height }));
        })
        .toEqual(Array.from({ length: planCount }, () => ({ width: 28, height: 28 })));
      expect(planCount).toBeGreaterThan(0);
      expect(planBoxes.every((box) => box.width === 28 && box.height === 28)).toBe(true);

      const create = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
      await create.scrollIntoViewIfNeeded();
      await create.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Tạo Kế Hoạch DCA Mới', exact: true });
      await expect(dialog).toBeVisible();
      const pickerIcons = dialog.locator('span[role="img"][aria-label]');
      await expect(pickerIcons).toHaveCount(5);
      // Capture readiness and geometry together, then retain that exact accepted sample.
      // A spring can cross scale=1 before settling; a second read can differ even 11ms later.
      let pickerBoxes: IconBox[] = [];
      let pickerMotion = { transform: '', opacity: '' };
      await expect
        .poll(async () => {
          const sample = await dialog.evaluate((panel) => {
            const style = getComputedStyle(panel);
            return {
              transform: style.transform,
              opacity: style.opacity,
              boxes: [...panel.querySelectorAll('span[role="img"][aria-label]')].map((element) => {
                const { width, height } = element.getBoundingClientRect();
                return { width, height, label: element.getAttribute('aria-label') };
              }),
            };
          });
          pickerBoxes = sample.boxes;
          pickerMotion = { transform: sample.transform, opacity: sample.opacity };
          return {
            ...pickerMotion,
            boxes: pickerBoxes.map(({ width, height }) => ({ width, height })),
          };
        })
        .toEqual({
          transform: 'none',
          opacity: '1',
          boxes: Array.from({ length: 5 }, () => ({ width: 32, height: 32 })),
        });
      expect(pickerBoxes.every((box) => box.width === 32 && box.height === 32)).toBe(true);
      const solana = dialog.getByRole('button', { name: /Solana/ });
      await solana.focus();
      await page.keyboard.press('Space');
      await expect(solana).toHaveAttribute('aria-pressed', 'true');
      await expect(dialog.locator('img')).toHaveCount(0);
      expect(imageRequests.length).toBeGreaterThan(0);
      expect(imageRequests.length).toBeLessThanOrEqual(planCount + 5);
      expect(avatarRequests).toBe(0);
      expect(writes).toBe(0);

      await page.screenshot({
        path: info.outputPath('dca-local-coin-fallbacks.png'),
        animations: 'disabled',
      });
      await writeFile(
        info.outputPath('dca-coin-images.json'),
        JSON.stringify(
          {
            profile,
            theme,
            planBoxes,
            pickerBoxes,
            pickerMotion,
            imageRequests,
            avatarRequests,
            writes,
            boundary:
              'Actual development MSW route; only external coin image requests are aborted. No DCA mutation.',
          },
          null,
          2,
        ),
      );
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    });
  }
}

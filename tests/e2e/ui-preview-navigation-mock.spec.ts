import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { name: 'phone-small', prefix: '', width: 320 },
  { name: 'phone', prefix: '', width: 390 },
  { name: 'phone-wide', prefix: '', width: 767 },
  { name: 'tablet', prefix: '/t', width: 768 },
  { name: 'responsive-phone', prefix: '/r', width: 390 },
  { name: 'responsive-below-tablet', prefix: '/r', width: 767 },
  { name: 'responsive-tablet', prefix: '/r', width: 768 },
  { name: 'responsive-below-web', prefix: '/r', width: 1023 },
  { name: 'responsive-web', prefix: '/r', width: 1024 },
  { name: 'web', prefix: '/w', width: 1440 },
] as const;

async function signIn(page: Page, prefix: string, theme: 'light' | 'dark') {
  await page.goto(`${prefix}/auth/login`);
  await page.getByTestId('auth-email').fill('wallet@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/login'),
  );
  await page.getByTestId('auth-submit').click();
  expect((await loginResponse).fromServiceWorker()).toBe(true);
  await expect(page).toHaveURL(new RegExp(`${prefix}/home$`));
  // URL changes before the concurrent route/preview layout has necessarily committed.
  await expect(page.getByTestId('dev-preview-controls')).toHaveCSS('position', 'relative');
  await expect(page.locator('[data-preview-chrome-host]')).toHaveCount(1);
  await expect(
    page.locator('[data-preview-chrome-host] [data-testid="dev-preview-controls"]'),
  ).toContainText('DỮ LIỆU MÔ PHỎNG');
  await page.locator('html').evaluate((html, mode) => {
    html.classList.toggle('dark', mode === 'dark');
    html.classList.toggle('light', mode === 'light');
  }, theme);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function measureWalletTarget(page: Page) {
  return page.getByRole('button', { name: 'Ví', exact: true }).evaluate((element) => {
    const rect = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
    };
    const wallet = rect(element);
    const warning = rect(document.querySelector('[aria-label="Mock data warning"]')!);
    const x = wallet.x + wallet.width / 2;
    const y = wallet.y + wallet.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      connected: element.isConnected,
      wallet,
      warning,
      center: { x, y },
      centerHitsWallet: Boolean(hit && (hit === element || element.contains(hit))),
      overlapsWarning:
        wallet.x < warning.right &&
        wallet.right > warning.x &&
        wallet.y < warning.bottom &&
        wallet.bottom > warning.y,
      bottomNavigationVisible: Boolean(
        document.querySelector('[role="navigation"][aria-label="Main navigation"]'),
      ),
      hitTag: hit?.tagName,
    };
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Preview navigation ${profile.name} ${theme} @ui-mock`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: profile.width, height: 900 });
      await signIn(page, profile.prefix, theme);
      await expect(page.getByRole('status', { name: 'Mock data warning' })).toBeVisible();
      const measurement = await measureWalletTarget(page);
      await writeFile(
        testInfo.outputPath('navigation-hit.json'),
        JSON.stringify(measurement, null, 2),
      );
      await page.screenshot({
        path: testInfo.outputPath(`preview-nav-${profile.name}-${theme}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      console.log('C06_PREVIEW_NAV_HIT', JSON.stringify({ profile, theme, measurement }));
      expect(measurement.centerHitsWallet).toBe(true);
      expect(measurement.connected).toBe(true);
      expect(measurement.wallet.width).toBeGreaterThan(0);
      expect(measurement.wallet.height).toBeGreaterThan(0);
      expect(measurement.overlapsWarning).toBe(false);
      await page.mouse.click(measurement.center.x, measurement.center.y);
      await expect(page).toHaveURL(new RegExp(`${profile.prefix}/wallet$`));
      const market = page.getByRole('button', { name: 'Thị trường', exact: true });
      await page.keyboard.press('Tab');
      await market.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${profile.prefix}/markets$`));
    });
  }

  test(`Preview follows responsive navigation through resize ${theme} @ui-mock`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await signIn(page, '/r', theme);
    const measurements = [];
    for (const width of [767, 768, 1023, 1024, 390]) {
      const previous = await page.getByRole('button', { name: 'Ví', exact: true }).elementHandle();
      await page.setViewportSize({ width, height: 900 });
      let hit: Awaited<ReturnType<typeof measureWalletTarget>> | undefined;
      await expect
        .poll(async () => {
          hit = await measureWalletTarget(page);
          return (
            hit.connected &&
            hit.wallet.width > 0 &&
            hit.wallet.height > 0 &&
            hit.bottomNavigationVisible === width < 1024 &&
            hit.centerHitsWallet &&
            !hit.overlapsWarning
          );
        })
        .toBe(true);
      const previousTarget = await previous?.evaluate((element) => ({
        connected: element.isConnected,
        width: element.getBoundingClientRect().width,
      }));
      measurements.push({ width, hit, previousTarget });
      await writeFile(
        testInfo.outputPath('resize-hits.json'),
        JSON.stringify(measurements, null, 2),
      );
      // A breakpoint can replace BottomNav with LeftRail after measurement. A real locator
      // click rechecks the current target's stability; cached coordinates can become (0,0).
      await page.getByRole('button', { name: 'Ví', exact: true }).click();
      await expect(page).toHaveURL('/r/wallet');
      await page.getByRole('button', { name: 'Trang chủ', exact: true }).click();
      await expect(page).toHaveURL('/r/home');
    }
    await writeFile(testInfo.outputPath('resize-hits.json'), JSON.stringify(measurements, null, 2));
  });
}

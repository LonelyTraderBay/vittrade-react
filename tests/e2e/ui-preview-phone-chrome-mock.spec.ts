import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 440, height: 900 },
  { width: 767, height: 900 },
  { width: 568, height: 320 },
  { width: 667, height: 375 },
] as const;

async function openAs(page: Page, path: string, persona: 'dca' | 'wallet', mode: string) {
  await page.goto(path);
  await page.getByTestId('auth-email').fill(`${persona}@vittrade.local`);
  await page.getByTestId('auth-password').fill('Preview-123!');
  const pending = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/login'),
  );
  await page.getByTestId('auth-submit').click();
  const response = await pending;
  expect(response.fromServiceWorker()).toBe(true);
  expect(response.status()).toBe(200);
  await expect.poll(() => new URL(page.url()).pathname).toBe(path);
  // CSS token modes; this is not a test of ThemeProvider persistence.
  await page.locator('html').evaluate((html, mode) => {
    html.classList.toggle('dark', mode === 'dark');
    html.classList.toggle('light', mode === 'light');
  }, mode);
}

async function settle(page: Page) {
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

for (const mode of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Phone preview chrome ${profile.width} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      const writes: string[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST' && /\/dca\//.test(request.url()))
          writes.push(request.url());
      });
      await openAs(page, '/dca', 'dca', mode);
      const title = page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true });
      await expect(title).toBeVisible();
      const cta = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
      await cta.scrollIntoViewIfNeeded();
      await settle(page);
      const observation = await cta.evaluate((element) => {
        const warning = document.querySelector('[aria-label="Mock data warning"]')!;
        const shell = document.querySelector('#app-layout-root')!;
        const c = element.getBoundingClientRect();
        const w = warning.getBoundingClientRect();
        const s = shell.getBoundingClientRect();
        const center = { x: c.x + c.width / 2, y: c.y + c.height / 2 };
        const hit = document.elementFromPoint(center.x, center.y);
        return {
          center,
          centerHitsCta: Boolean(hit && (element === hit || element.contains(hit))),
          warningInsideShell:
            w.x >= s.x && w.right <= s.right && w.y >= s.y && w.bottom <= s.bottom,
          overlap: !(w.right <= c.x || w.x >= c.right || w.bottom <= c.y || w.y >= c.bottom),
          warning: { x: w.x, y: w.y, right: w.right, bottom: w.bottom },
          cta: { x: c.x, y: c.y, right: c.right, bottom: c.bottom },
          hitTag: hit?.tagName,
          environment: {
            lang: document.documentElement.lang,
            locale: navigator.language,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            htmlClass: document.documentElement.className,
            bodyFont: getComputedStyle(document.body).fontFamily,
            reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
          },
        };
      });
      expect(observation.warningInsideShell).toBe(true);
      expect(observation.overlap).toBe(false);
      expect(observation.centerHitsCta).toBe(true);
      await page.screenshot({
        path: info.outputPath('phone-chrome.png'),
        fullPage: true,
        animations: 'disabled',
      });
      await page.mouse.click(observation.center.x, observation.center.y);
      const dialog = page.getByRole('dialog', { name: 'Tạo Kế Hoạch DCA Mới' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(cta).toBeFocused();
      await cta.press('Enter');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      const titleBefore = await title.boundingBox();
      await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
      const panel = page.getByRole('region', { name: 'Công cụ xem trước' });
      await expect(panel).toBeVisible();
      const panelBox = await panel.boundingBox();
      const shellBox = await page.locator('#app-layout-root').boundingBox();
      expect(panelBox!.x).toBeGreaterThanOrEqual(shellBox!.x);
      expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(shellBox!.x + shellBox!.width);
      expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(profile.height);
      expect(await title.boundingBox()).toEqual(titleBefore);
      await page.screenshot({
        path: info.outputPath('phone-panel.png'),
        fullPage: true,
        animations: 'disabled',
      });
      await page.getByRole('button', { name: 'Thu gọn', exact: true }).click();
      await expect(panel).toBeHidden();
      await expect(page.getByRole('status', { name: 'Mock data warning' })).toHaveCount(1);
      await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Ví', exact: true })
        .click();
      await expect.poll(() => new URL(page.url()).pathname).toBe('/wallet');
      await expect(page.getByRole('status', { name: 'Mock data warning' })).toHaveCount(1);
      expect(writes).toEqual([]);
      await writeFile(
        info.outputPath('phone-chrome.json'),
        JSON.stringify({ profile, mode, observation, panelBox, writes }, null, 2),
      );
      console.log(
        'C06_PHONE_CHROME',
        JSON.stringify({ profile, mode, observation, writes: writes.length }),
      );
    });
  }

  test(`Phone preview preserves flow under text spacing ${mode} @ui-mock`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openAs(page, '/dca', 'dca', mode);
    const title = page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true });
    await expect(title).toBeVisible();
    const warning = page.getByRole('status', { name: 'Mock data warning' });
    const trigger = page.getByRole('button', { name: 'Mở công cụ xem trước' });
    const panel = page.getByRole('region', { name: 'Công cụ xem trước' });
    const observations = [];
    for (const spacing of [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12]) {
      await warning.locator('strong').evaluate((element, value) => {
        element.style.letterSpacing = `${value}em`;
      }, spacing);
      await settle(page);
      const before = {
        title: await title.boundingBox(),
        warning: await warning.boundingBox(),
        trigger: await trigger.boundingBox(),
      };
      await trigger.press('Enter');
      await expect(panel).toBeVisible();
      await settle(page);
      const after = {
        title: await title.boundingBox(),
        warning: await warning.boundingBox(),
        trigger: await page.getByRole('button', { name: 'Thu gọn', exact: true }).boundingBox(),
      };
      observations.push({ spacing, before, after });
      await writeFile(
        info.outputPath('preview-text-spacing.json'),
        JSON.stringify({ mode, observations }, null, 2),
      );
      expect(after).toEqual(before);
      const close = page.getByRole('button', { name: 'Thu gọn', exact: true });
      await expect(close.locator('span').filter({ visible: true })).toHaveText('Thu gọn');
      await close.press('Space');
      await expect(panel).toBeHidden();
      expect(await title.boundingBox()).toEqual(before.title);
      await expect(trigger).toBeFocused();
    }
    console.log('C06_PREVIEW_TEXT_SPACING', JSON.stringify({ mode, observations }));
  });

  test(`Phone preview retains a Wallet draft through phone widths ${mode} @ui-mock`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let writes = 0;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname.endsWith('/wallet/transfers')
      )
        writes++;
    });
    await openAs(page, '/wallet/transfer', 'wallet', mode);
    const amount = page.getByTestId('wallet-transfer-amount');
    await expect(amount).toBeVisible();
    await amount.fill('12.3456789012');
    const original = await amount.elementHandle();
    for (const width of [440, 320, 767, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await settle(page);
      await expect(amount).toHaveValue('12.3456789012');
      expect(await amount.evaluate((input, previous) => input === previous, original)).toBe(true);
      await expect(page.getByRole('status', { name: 'Mock data warning' })).toHaveCount(1);
      await expect.poll(() => new URL(page.url()).pathname).toBe('/wallet/transfer');
    }
    expect(writes).toBe(0);
    console.log('C06_PHONE_DRAFT', JSON.stringify({ mode, widths: [440, 320, 767, 390], writes }));
  });
}

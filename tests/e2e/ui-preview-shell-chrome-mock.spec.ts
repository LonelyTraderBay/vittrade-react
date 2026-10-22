import { expect, test, type Locator, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { prefix: '', width: 390 },
  { prefix: '/t', width: 900 },
  { prefix: '/w', width: 1440 },
  ...[376, 767, 768, 1023, 1024].map((width) => ({ prefix: '/r', width })),
];

async function setTheme(page: Page, theme: string) {
  await page
    .locator('html')
    .evaluate((html, mode) => html.classList.toggle('light', mode === 'light'), theme);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function login(page: Page, prefix: string, route: string, email = 'dca@vittrade.local') {
  await page.goto(prefix + route);
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(new RegExp(`${prefix}${route}$`));
}

async function measureCTA(cta: Locator) {
  return cta.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const chrome = document.querySelector('[data-testid="dev-preview-controls"]')!;
    const warning = chrome.getBoundingClientRect();
    const hits = [0.1, 0.5, 0.9].map((fraction) => {
      const hit = document.elementFromPoint(box.x + box.width * fraction, box.y + box.height / 2);
      return Boolean(hit && (hit === element || element.contains(hit)));
    });
    return {
      cta: { x: box.x, y: box.y, width: box.width, height: box.height },
      chrome: { x: warning.x, y: warning.y, width: warning.width, height: warning.height },
      overlap:
        Math.max(0, Math.min(box.right, warning.right) - Math.max(box.left, warning.left)) *
        Math.max(0, Math.min(box.bottom, warning.bottom) - Math.max(box.top, warning.top)),
      hits,
      hostCount: document.querySelectorAll('[data-preview-chrome-host]').length,
      hosted: Boolean(chrome.closest('[data-preview-chrome-host]')),
    };
  });
}

for (const theme of ['light', 'dark']) {
  for (const profile of profiles) {
    test(`Preview shell CTA ${profile.prefix || 'phone'} ${profile.width} ${theme} @ui-mock`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: profile.width, height: 900 });
      let writes = 0;
      page.on('request', (request) => {
        if (
          ['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method()) &&
          new URL(request.url()).pathname.includes('/dca/')
        )
          writes++;
      });
      await login(page, profile.prefix, '/dca');
      await expect(page.getByRole('button', { name: /^Kế hoạch \(/ })).toBeVisible();
      await setTheme(page, theme);
      const cta = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
      await cta.evaluate((element) => element.scrollIntoView({ block: 'end' }));
      const before = await measureCTA(cta);
      expect(before.hostCount).toBe(1);
      expect(before.hosted).toBe(true);
      expect(before.overlap).toBe(0);
      expect(before.hits).toEqual([true, true, true]);

      const controls = page.getByTestId('dev-preview-controls');
      const opener = controls.getByRole('button', { name: 'Mở công cụ xem trước', exact: true });
      const hostBefore = await page.locator('[data-preview-chrome-host]').boundingBox();
      await opener.focus();
      await page.keyboard.press('Enter');
      const panel = controls.getByRole('region', { name: 'Công cụ xem trước', exact: true });
      await expect(panel).toBeVisible();
      const hostAfter = await page.locator('[data-preview-chrome-host]').boundingBox();
      expect(hostAfter?.height).toBe(hostBefore?.height);
      const expanded = await measureCTA(cta);
      expect(expanded.cta).toEqual(before.cta);
      const panelBox = await panel.boundingBox();
      expect(panelBox!.x).toBeGreaterThanOrEqual(0);
      expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(profile.width + 1);
      expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(901);
      await controls.getByRole('button', { name: 'Thu gọn', exact: true }).click();
      await expect(panel).toBeHidden();
      await cta.evaluate((element) => element.scrollIntoView({ block: 'end' }));
      await expect.poll(async () => (await measureCTA(cta)).hits).toEqual([true, true, true]);
      await cta.click();
      const dialog = page.getByRole('dialog', { name: 'Tạo Kế Hoạch DCA Mới', exact: true });
      await expect(dialog).toBeVisible();
      expect(
        await controls.evaluate((element) =>
          Boolean(element.closest('[aria-hidden="true"],[inert]')),
        ),
      ).toBe(true);
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
        true,
      );
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(cta).toBeFocused();
      expect(writes).toBe(0);
      await page.screenshot({
        path: info.outputPath('preview-shell-cta.png'),
        animations: 'disabled',
      });
      await writeFile(
        info.outputPath('preview-shell-cta.json'),
        JSON.stringify(
          {
            profile,
            theme,
            before,
            expanded,
            hostBefore,
            hostAfter,
            panelBox,
            actualPointerOpenedDialog: true,
            writes,
          },
          null,
          2,
        ),
      );
    });
  }

  for (const prefix of ['/t', '/w', '/r']) {
    test(`Preview Auth host ${prefix} ${theme} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize({ width: prefix === '/t' ? 900 : 1440, height: 900 });
      let loginWrites = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/auth/login'))
          loginWrites++;
      });
      await page.goto(`${prefix}/auth/login`);
      const email = page.getByTestId('auth-email');
      await expect(email).toBeVisible();
      await email.fill('draft@vittrade.local');
      const original = await email.elementHandle();
      await setTheme(page, theme);
      await expect(page.locator('[data-preview-chrome-host]')).toHaveCount(1);
      const controls = page.getByTestId('dev-preview-controls');
      expect(
        await controls.evaluate((element) =>
          Boolean(element.closest('[data-preview-chrome-host]')),
        ),
      ).toBe(true);
      await controls.getByRole('button', { name: 'Mở công cụ xem trước', exact: true }).click();
      await expect(
        controls.getByRole('region', { name: 'Công cụ xem trước', exact: true }),
      ).toBeVisible();
      await controls.getByRole('button', { name: 'Thu gọn', exact: true }).click();
      await expect(email).toHaveValue('draft@vittrade.local');
      expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
      expect(loginWrites).toBe(0);
      await writeFile(
        info.outputPath('preview-auth-host.json'),
        JSON.stringify(
          {
            prefix,
            theme,
            hostCount: 1,
            draftRetained: true,
            originalConnected: true,
            loginWrites,
          },
          null,
          2,
        ),
      );
    });
  }

  test(`Preview short viewport ${theme} @ui-mock`, async ({ page }, info) => {
    await page.setViewportSize({ width: 376, height: 360 });
    await login(page, '/r', '/dca');
    await expect(page.getByRole('button', { name: /^Kế hoạch \(/ })).toBeVisible();
    await setTheme(page, theme);
    const controls = page.getByTestId('dev-preview-controls');
    await controls.getByRole('button', { name: 'Mở công cụ xem trước', exact: true }).click();
    const panel = controls.getByRole('region', { name: 'Công cụ xem trước', exact: true });
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(361);
    const scroll = await panel.evaluate((element) => ({
      client: element.clientHeight,
      content: element.scrollHeight,
      overflow: getComputedStyle(element).overflowY,
    }));
    expect(scroll.overflow).toBe('auto');
    expect(scroll.content).toBeGreaterThan(scroll.client);
    await writeFile(
      info.outputPath('preview-short-viewport.json'),
      JSON.stringify({ theme, box, scroll }, null, 2),
    );
  });

  test(`Preview preserves Responsive draft and panel across breakpoints ${theme} @ui-mock`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 376, height: 900 });
    await login(page, '/r', '/wallet/transfer', 'wallet@vittrade.local');
    const amount = page.getByTestId('wallet-transfer-amount');
    await expect(amount).toBeVisible();
    await amount.fill('12.3456789012');
    const original = await amount.elementHandle();
    await setTheme(page, theme);
    const controls = page.getByTestId('dev-preview-controls');
    await controls.getByRole('button', { name: 'Mở công cụ xem trước', exact: true }).click();
    const persona = controls.getByLabel('Tài khoản xem trước', { exact: true });
    await persona.selectOption({ index: 1 });
    const selection = await persona.inputValue();
    let writes = 0;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname.endsWith('/wallet/transfers')
      )
        writes++;
    });
    await page.clock.install();
    const widths = [767, 768, 1023, 1024, 376];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      // Exercise the existing 250ms shell resize debounce, rather than sleep.
      await page.clock.runFor(300);
      await expect(page).toHaveURL(/\/r\/wallet\/transfer$/);
      await expect(page.locator('[data-preview-chrome-host]')).toHaveCount(1);
      await expect(amount).toHaveValue('12.3456789012');
      await expect(persona).toHaveValue(selection);
      expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
    }
    await page.clock.resume();
    expect(writes).toBe(0);
    await writeFile(
      info.outputPath('preview-responsive-draft.json'),
      JSON.stringify(
        {
          theme,
          widths,
          draftRetained: true,
          originalConnected: true,
          selectionRetained: true,
          writes,
        },
        null,
        2,
      ),
    );
  });
}

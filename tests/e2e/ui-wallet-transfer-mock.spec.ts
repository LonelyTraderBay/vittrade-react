import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { name: 'phone-small', prefix: '', width: 320, height: 568 },
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'phone-wide', prefix: '', width: 440, height: 900 },
  { name: 'tablet', prefix: '/t', width: 768, height: 1024 },
  { name: 'responsive-phone', prefix: '/r', width: 390, height: 844 },
  { name: 'responsive-below-tablet', prefix: '/r', width: 767, height: 900 },
  { name: 'responsive-tablet', prefix: '/r', width: 768, height: 900 },
  { name: 'responsive-below-web', prefix: '/r', width: 1023, height: 900 },
  { name: 'responsive-web', prefix: '/r', width: 1024, height: 900 },
  { name: 'web', prefix: '/w', width: 1440, height: 900 },
] as const;

async function openTransfer(page: Page, prefix: string, theme: 'light' | 'dark') {
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
  await page.getByRole('button', { name: 'Ví', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${prefix}/wallet$`));
  await page.getByRole('button', { name: 'Transfer', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${prefix}/wallet/transfer$`));
  await expect(page.getByTestId('wallet-transfer-amount')).toBeVisible();
  // These cases cover the CSS token modes, not ThemeProvider persistence or UAT.
  await page.locator('html').evaluate((html, mode) => {
    html.classList.toggle('dark', mode === 'dark');
    html.classList.toggle('light', mode === 'light');
  }, theme);
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
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Wallet transfer field and real hit ${profile.name} ${theme} @ui-mock`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: profile.width, height: profile.height });
      const writes: string[] = [];
      page.on('request', (request) => {
        if (
          request.method() === 'POST' &&
          new URL(request.url()).pathname.endsWith('/wallet/transfers')
        )
          writes.push(request.url());
      });
      await openTransfer(page, profile.prefix, theme);
      const amount = page.getByTestId('wallet-transfer-amount');
      const submit = page.getByTestId('wallet-transfer-submit');
      await submit.click();
      await expect(amount).toHaveAttribute('aria-invalid', 'true');
      await expect(amount).toHaveAttribute(
        'aria-describedby',
        'transfer-amount-helper transfer-amount-error',
      );
      await expect(amount).toBeFocused();
      await expect(page.getByRole('alert')).toHaveAttribute('id', 'transfer-amount-error');
      await expect(page.getByRole('alert')).toHaveText('Enter an amount greater than zero.');
      await settle(page);
      await page.screenshot({
        path: testInfo.outputPath(`transfer-${profile.name}-${theme}-invalid.png`),
        fullPage: true,
        animations: 'disabled',
      });
      if (profile.width === 320 || profile.name === 'web')
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await amount.fill('10000.0001');
      await submit.click();
      await expect(page.getByRole('alert')).toHaveText(
        'The transfer amount exceeds the available balance.',
      );
      expect(writes).toHaveLength(0);
      await page.getByRole('button', { name: 'Max 10,000.00', exact: true }).click();
      await expect(amount).toHaveValue('10000');
      await expect(amount).toHaveAttribute('aria-invalid', 'false');
      await expect(page.getByRole('alert')).toHaveCount(0);
      await amount.fill('25');
      await submit.scrollIntoViewIfNeeded();
      await settle(page);

      const hit = await submit.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
        const target = document.elementFromPoint(center.x, center.y);
        return {
          center,
          ctaBottom: bounds.bottom,
          centerHitsCta: Boolean(target && (target === element || element.contains(target))),
          navigationLabel: target?.closest('[role="navigation"]')?.getAttribute('aria-label'),
          hitTag: target?.tagName,
        };
      });
      expect(hit.centerHitsCta).toBe(true);
      expect(hit.navigationLabel).toBeFalsy();
      const navigation = page.getByRole('navigation', { name: 'Main navigation' });
      let navigationClearance: { top: number; gap: number } | undefined;
      if (profile.prefix === '/r' && profile.width < 1024) {
        const floatingAction = await navigation
          .getByRole('button', { name: 'Giao dịch', exact: true })
          .locator('div')
          .first()
          .boundingBox();
        expect(floatingAction).not.toBeNull();
        expect(hit.ctaBottom).toBeLessThanOrEqual(floatingAction!.y);
        navigationClearance = { top: floatingAction!.y, gap: floatingAction!.y - hit.ctaBottom };
      }
      await writeFile(
        testInfo.outputPath('hit-target.json'),
        JSON.stringify({ profile, theme, hit, navigationClearance }, null, 2),
      );
      const responsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname.endsWith('/wallet/transfers'),
      );
      await page.mouse.click(hit.center.x, hit.center.y);
      const response = await responsePromise;
      expect(response.fromServiceWorker()).toBe(true);
      expect(response.status()).toBe(201);
      expect(response.request().postDataJSON()).toEqual({
        fromWallet: 'spot',
        toWallet: 'funding',
        asset: 'USDT',
        amount: 25,
      });
      expect(response.request().headers()['idempotency-key']).toBeTruthy();
      await expect(
        page.getByRole('status').filter({ hasText: 'Transfer completed' }),
      ).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${profile.prefix}/wallet/transfer$`));
      expect(writes).toHaveLength(1);
      console.log(
        'C06_TRANSFER_MSW_HIT',
        JSON.stringify({ profile, theme, hit, navigationClearance, writes: writes.length }),
      );
      if (profile.name === 'responsive-phone') {
        await navigation.getByRole('button', { name: 'Giao dịch', exact: true }).click();
        await expect(page).toHaveURL(/\/r\/trade\/btcusdt$/);
      }
    });
  }

  test(`Wallet transfer preserves its draft through resize ${theme} @ui-mock`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openTransfer(page, '/r', theme);
    const amount = page.getByTestId('wallet-transfer-amount');
    await amount.fill('12.3456789012');
    await page.getByRole('button', { name: 'Swap wallets', exact: true }).click();
    const originalInput = await amount.elementHandle();
    let writes = 0;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname.endsWith('/wallet/transfers')
      )
        writes += 1;
    });
    for (const width of [767, 768, 1023, 1024, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page).toHaveURL(/\/r\/wallet\/transfer$/);
      await expect(amount).toHaveValue('12.3456789012');
      await expect(page.getByLabel('From wallet', { exact: true })).toHaveValue('funding');
      await expect(page.getByLabel('To wallet', { exact: true })).toHaveValue('spot');
      expect(await originalInput!.evaluate((node) => node.isConnected)).toBe(true);
      await settle(page);
    }
    expect(writes).toBe(0);
  });
}

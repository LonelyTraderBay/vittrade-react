import { expect, test } from '@playwright/test';

const shells = [
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'tablet', prefix: '/t', width: 768, height: 900 },
  { name: 'responsive', prefix: '/r', width: 1024, height: 900 },
  { name: 'web', prefix: '/w', width: 1440, height: 900 },
];

for (const shell of shells) {
  test(`disabled devtools ignore stored auth failure in ${shell.name} @preview-defaults`, async ({
    page,
  }, testInfo) => {
    const storedScenario = JSON.stringify({ domain: 'auth', state: 'forbidden' });
    await page.addInitScript((scenario) => {
      localStorage.setItem('vittrade.dev-preview.scenario', scenario);
    }, storedScenario);
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(`${shell.prefix}/auth/login`);
    await expect(page.getByRole('status', { name: 'Mock data warning' })).toContainText(
      'DỮ LIỆU MÔ PHỎNG · KHÔNG GIAO DỊCH THẬT',
    );
    await expect(page.getByRole('button', { name: 'Mở công cụ xem trước' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Công cụ xem trước' })).toHaveCount(0);
    await page.getByTestId('auth-email').fill('developer@vittrade.local');
    await page.getByTestId('auth-password').fill('Preview-123!');
    const loginResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login'),
    );
    await page.getByTestId('auth-submit').click();
    const response = await loginResponse;
    expect(response.fromServiceWorker()).toBe(true);
    expect(response.status()).toBe(200);
    expect((await response.json()).status).toBe('authenticated');
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/home$`));
    expect(await page.evaluate(() => localStorage.getItem('vittrade.dev-preview.scenario'))).toBe(
      storedScenario,
    );
    await expect(page.getByRole('button', { name: 'Mở công cụ xem trước' })).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`devtools-disabled-${shell.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  });
}

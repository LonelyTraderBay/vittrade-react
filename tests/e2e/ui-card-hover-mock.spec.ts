import { expect, test, type Locator } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { measureNativeTextSurface } from './helpers/text-surface-paint';

async function surface(locator: Locator) {
  return locator.evaluate(async (element) => {
    // Flush the hover style before collecting finite transitions.
    getComputedStyle(element).getPropertyValue('background-color');
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    );
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      shadow: style.boxShadow,
      transform: style.transform,
      radius: style.borderTopLeftRadius,
      padding: style.padding,
    };
  });
}

const profiles = [
  { name: 'phone-320', prefix: '', width: 320 },
  { name: 'phone-767', prefix: '', width: 767 },
  { name: 'tablet-768', prefix: '/t', width: 768 },
  { name: 'responsive-1024', prefix: '/r', width: 1024 },
  { name: 'web-1440', prefix: '/w', width: 1440 },
];

for (const theme of ['light', 'dark'])
  for (const profile of profiles)
    test(`Passive card hover ${profile.name} ${theme} @ui-mock`, async ({ page }, info) => {
      let writes = 0;
      page.on('request', (request) => {
        const path = new URL(request.url()).pathname;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !path.includes('/auth/'))
          writes++;
      });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/w/auth/login');
      await page.getByTestId('auth-email').fill('dca@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(page).toHaveURL('/w/home');
      if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
      await expect(page.locator('html')).toHaveClass(new RegExp('\\b' + theme + '\\b'));
      await page.setViewportSize({ width: profile.width, height: 900 });
      await page.evaluate(
        async ({ moduleUrl, target }) => {
          const { router } = await import(moduleUrl);
          await router.navigate(target);
        },
        { moduleUrl: '/src/app/router/index.ts', target: profile.prefix + '/dca' },
      );
      const card = page
        .getByText('Tổng danh mục DCA (VND)', { exact: true })
        .locator('xpath=ancestor::*[@data-slot="tr-card"][1]');
      await expect(card.getByText('Kế hoạch', { exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const measurements = [];
      for (const label of ['Kế hoạch', 'Đã đầu tư', 'TB/plan']) {
        const header = card.getByText(label, { exact: true }).locator('..');
        const metric = header.locator('..');
        await metric.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        const before = { metric: await surface(metric), header: await surface(header) };
        await header.hover({ position: { x: 4, y: 4 } });
        const after = { metric: await surface(metric), header: await surface(header) };
        measurements.push({ label, before, after });
        await info.attach(`${label}-hover-measurement`, {
          body: JSON.stringify(measurements.at(-1), null, 2),
          contentType: 'application/json',
        });
        expect(after).toEqual(before);
        expect(before.metric.radius).toBe('16px');
        expect(before.metric.padding).toBe('12px');
        await expect(header.getByRole('button')).toBeEnabled();
      }
      expect(writes).toBe(0);
      const observation = { profile, theme, measurements, writes };
      await writeFile(
        info.outputPath('passive-card-runtime.json'),
        JSON.stringify(observation, null, 2),
      );
      console.log('C06_PASSIVE_CARD_HOVER', JSON.stringify(observation));
      await info.attach('passive-card-runtime', {
        body: JSON.stringify(observation, null, 2),
        contentType: 'application/json',
      });
      await info.attach('dca-card-hover', {
        body: await card.screenshot({ path: info.outputPath('dca-card-hover.png') }),
        contentType: 'image/png',
      });
    });

test('Nested card paint calibration preserves alpha and rejects missing backing @ui-mock', async ({
  page,
}, info) => {
  await page.setContent(
    '<div id="outer" data-slot="tr-card" style="background:black;padding:24px;width:240px">' +
      '<div data-slot="tr-card" style="background:rgba(255,255,255,.2);padding:12px">' +
      '<span style="font:16px Arial;color:white">Calibration</span></div></div>',
  );
  const target = page.locator('span');
  const positive = await measureNativeTextSurface(page, target, 'nested-positive', info);
  expect(positive.surfaceOwnerCount).toBe(2);
  expect(positive.minimumRatio).toBeCloseTo(12.63465434445799, 5);
  await target.evaluate((element) => {
    element.style.color = 'rgb(51,51,51)';
  });
  const negative = await measureNativeTextSurface(page, target, 'nested-negative', info);
  expect(negative.minimumRatio).toBe(1);
  expect(negative.minimumRatio).toBeLessThan(negative.threshold);
  await page.locator('#outer').evaluate((element) => {
    element.style.background = 'transparent';
  });
  await expect(measureNativeTextSurface(page, target, 'missing-backing', info)).rejects.toThrow(
    'TextROI transparency/out-of-scene',
  );
  await writeFile(
    info.outputPath('nested-card-calibration.json'),
    JSON.stringify({ positive, negative, missingBackingRejected: true }, null, 2),
  );
});

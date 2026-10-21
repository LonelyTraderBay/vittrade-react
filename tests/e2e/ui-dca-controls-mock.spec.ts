import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { measureButtonPaint } from './helpers/button-paint';

const profiles = [
  { name: 'phone-narrow', prefix: '', width: 320, height: 844 },
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'tablet', prefix: '/t', width: 900, height: 900 },
  { name: 'web', prefix: '/w', width: 1440, height: 900 },
  { name: 'responsive', prefix: '/r', width: 1024, height: 900 },
] as const;

async function settle(page: Page) {
  await page.mouse.move(0, 0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
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
    test(`DCA controls ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      let writes = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname.includes('/dca/'))
          writes++;
      });
      await page.goto(`${profile.prefix}/dca`);
      await page.getByTestId('auth-email').fill('dca@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(
        page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true }),
      ).toBeVisible();
      await page.locator('html').evaluate((html, value) => {
        html.classList.toggle('light', value === 'light');
        html.classList.toggle('dark', value === 'dark');
      }, mode);
      await settle(page);
      const trigger = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
      const paints = [await measureButtonPaint(page, trigger, info, 'trigger')];
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Tạo Kế Hoạch DCA Mới', exact: true });
      await expect(dialog).toBeVisible();
      await settle(page);
      const amount = dialog.getByPlaceholder('500.000');
      const associatedLabels = await amount.evaluate((element: HTMLInputElement) =>
        [...(element.labels ?? [])].map((label) => label.textContent?.trim()),
      );
      const coin = dialog.getByRole('button', { name: /Solana/ });
      await coin.focus();
      await page.keyboard.press('Enter');
      const frequency = dialog.getByRole('button', { name: 'Hàng ngày', exact: true });
      await frequency.focus();
      await page.keyboard.press('Space');
      const selection = {
        coin: await coin.getAttribute('aria-pressed'),
        frequency: await frequency.getAttribute('aria-pressed'),
        coinGroups: await dialog.getByRole('group', { name: 'Chọn Coin', exact: true }).count(),
        frequencyGroups: await dialog
          .getByRole('group', { name: 'Tần Suất Mua', exact: true })
          .count(),
      };
      await dialog.getByText('Số Tiền Mỗi Lần (VND)', { exact: true }).click();
      const labelFocusesInput = await amount.evaluate(
        (element) => document.activeElement === element,
      );
      await amount.focus();
      await settle(page);
      const fieldFocusShadow = await amount.evaluate(
        (element) => getComputedStyle(element.parentElement!).boxShadow,
      );
      const submit = dialog.getByRole('button', { name: 'Tạo Kế Hoạch', exact: true });
      await amount.fill('9999');
      const belowMinimumDisabled = await submit.isDisabled();
      const invalid = {
        ariaInvalid: await amount.getAttribute('aria-invalid'),
        describedBy: await amount.getAttribute('aria-describedby'),
        helperVisible: await dialog
          .getByText('Tối thiểu 10.000 VND mỗi lần mua.', { exact: true })
          .isVisible(),
        errorVisible: await dialog
          .getByRole('alert')
          .filter({ hasText: 'Nhập ít nhất 10.000 VND.' })
          .isVisible(),
      };
      await page.screenshot({ path: info.outputPath('field-invalid.png'), animations: 'disabled' });
      const invalidAxe = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      await writeFile(info.outputPath('invalid-axe.json'), JSON.stringify(invalidAxe, null, 2));
      await amount.fill('12a345');
      expect(await amount.inputValue()).toBe('12345');
      await amount.fill('10000');
      const atMinimumEnabled = await submit.isEnabled();
      const validAriaInvalid = await amount.getAttribute('aria-invalid');
      await settle(page);
      paints.push(await measureButtonPaint(page, submit, info, 'create'));
      await submit.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: info.outputPath('create-controls.png'),
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(dialog).toBeVisible();
      expect(await amount.inputValue()).toBe('10000');
      expect(dialog.getByText('Coin:', { exact: true }).locator('..')).toContainText('SOL');
      expect(dialog.getByText('Tần suất:', { exact: true }).locator('..')).toContainText(
        'Hàng ngày',
      );
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await page.getByRole('button', { name: 'Xóa kế hoạch', exact: true }).first().click();
      const deletion = page.getByRole('dialog', { name: 'Xác nhận xóa', exact: true });
      await expect(deletion).toBeVisible();
      await settle(page);
      paints.push(
        await measureButtonPaint(
          page,
          deletion.getByRole('button', { name: 'Xóa', exact: true }),
          info,
          'delete',
        ),
      );
      const cancelBounds = await deletion
        .getByRole('button', { name: 'Hủy', exact: true })
        .boundingBox();
      const deleteBounds = await deletion
        .getByRole('button', { name: 'Xóa', exact: true })
        .boundingBox();
      const dialogBounds = await deletion.boundingBox();
      expect(cancelBounds && deleteBounds && dialogBounds).toBeTruthy();
      expect(cancelBounds!.x).toBeGreaterThanOrEqual(dialogBounds!.x);
      expect(cancelBounds!.x + cancelBounds!.width).toBeLessThanOrEqual(deleteBounds!.x);
      expect(deleteBounds!.x + deleteBounds!.width).toBeLessThanOrEqual(
        dialogBounds!.x + dialogBounds!.width,
      );
      expect(Math.min(cancelBounds!.height, deleteBounds!.height)).toBe(52);
      paints.push(
        await measureButtonPaint(
          page,
          deletion.getByRole('button', { name: 'Hủy', exact: true }),
          info,
          'cancel',
        ),
      );
      await page.screenshot({
        path: info.outputPath('delete-controls.png'),
        animations: 'disabled',
      });
      await deletion.getByRole('button', { name: 'Hủy', exact: true }).click();
      await expect(deletion).toBeHidden();
      const observation = {
        profile,
        mode,
        associatedLabels,
        selection,
        labelFocusesInput,
        fieldFocusShadow,
        invalid,
        invalidAxe: {
          violations: invalidAxe.violations.map(({ id, nodes }) => ({ id, nodes: nodes.length })),
          incomplete: invalidAxe.incomplete.map(({ id, nodes }) => ({ id, nodes: nodes.length })),
        },
        validAriaInvalid,
        belowMinimumDisabled,
        atMinimumEnabled,
        writes,
        paints,
        actions: { cancelBounds, deleteBounds, dialogBounds },
      };
      await writeFile(info.outputPath('dca-controls.json'), JSON.stringify(observation, null, 2));
      console.log('C06_DCA_CONTROLS', JSON.stringify(observation));
      expect(writes).toBe(0);
      expect(belowMinimumDisabled && atMinimumEnabled).toBe(true);
      expect.soft(associatedLabels).toEqual(['Số Tiền Mỗi Lần (VND)']);
      expect
        .soft(selection)
        .toEqual({ coin: 'true', frequency: 'true', coinGroups: 1, frequencyGroups: 1 });
      expect.soft(labelFocusesInput).toBe(true);
      expect.soft(fieldFocusShadow).not.toBe('none');
      expect.soft(invalid.ariaInvalid).toBe('true');
      expect.soft(invalid.describedBy).toBeTruthy();
      expect.soft(invalid.helperVisible && invalid.errorVisible).toBe(true);
      expect.soft(invalidAxe.violations).toEqual([]);
      expect.soft(invalidAxe.incomplete).toEqual([]);
      expect.soft(validAriaInvalid).toBe('false');
      for (const paint of paints) expect.soft(paint.minimumRatio).toBeGreaterThanOrEqual(4.5);
    });
  }
}

for (const mode of ['light', 'dark'] as const) {
  for (const profile of profiles.filter(
    (item) => item.name === 'phone-narrow' || item.name === 'web',
  )) {
    test(`DCA unavailable ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      let writes = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname.includes('/dca/'))
          writes++;
      });
      // Establish a real public history entry before entering the protected DCA route.
      await page.goto(`${profile.prefix}/markets`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Thị trường', exact: true })).toBeVisible();
      await page.goto(`${profile.prefix}/dca`, { waitUntil: 'domcontentloaded' });
      await page.getByTestId('auth-email').fill('dca@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(
        page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true }),
      ).toBeVisible();
      // Use the existing QA API in the local fixture app; no remote flag is changed.
      await page.evaluate(async (moduleUrl) => {
        const { featureFlags } = await import(moduleUrl);
        featureFlags.override('dca_enabled', false);
      }, '/src/app/services/FeatureFlagService.ts');
      await expect(
        page.getByRole('heading', { name: 'Tính năng DCA tạm thời không khả dụng', exact: true }),
      ).toBeVisible();
      await page.locator('html').evaluate((html, value) => {
        html.classList.toggle('light', value === 'light');
        html.classList.toggle('dark', value === 'dark');
      }, mode);
      await settle(page);
      const back = page.getByRole('button', { name: 'Quay lại', exact: true });
      const paint = await measureButtonPaint(page, back, info, 'unavailable-back');
      await page.screenshot({
        path: info.outputPath('dca-unavailable.png'),
        animations: 'disabled',
      });
      await back.press('Enter');
      await expect(page.getByRole('heading', { name: 'Thị trường', exact: true })).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(`${profile.prefix}/markets`);
      console.log('C06_DCA_UNAVAILABLE', JSON.stringify({ profile, mode, writes, paint }));
      expect(writes).toBe(0);
      expect(paint.minimumRatio).toBeGreaterThanOrEqual(4.5);
    });
  }
}

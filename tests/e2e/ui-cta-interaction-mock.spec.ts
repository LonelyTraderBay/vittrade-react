import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { measureButtonPaint } from './helpers/button-paint';

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    );
  });
}

for (const mode of ['light', 'dark'] as const) {
  for (const profile of [
    { name: 'phone', prefix: '', width: 390, height: 844 },
    { name: 'web', prefix: '/w', width: 1440, height: 900 },
  ] as const) {
    test(`Canonical CTA interaction ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      await page.goto(`${profile.prefix}/p2p/guide`);
      await page.getByTestId('auth-email').fill('developer@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(page.getByRole('heading', { name: 'Hướng dẫn P2P', exact: true })).toBeVisible();
      await page.locator('html').evaluate((html, mode) => {
        html.classList.toggle('light', mode === 'light');
        html.classList.toggle('dark', mode === 'dark');
      }, mode);
      await page.getByRole('tab', { name: 'An toàn', exact: true }).click();
      const button = page.getByRole('button', { name: 'Liên hệ hỗ trợ khẩn cấp', exact: true });
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await settle(page);
      const normal = await measureButtonPaint(page, button, info, 'normal');
      await button.hover();
      await settle(page);
      const hover = await measureButtonPaint(page, button, info, 'hover');
      await page.screenshot({ path: info.outputPath('cta-hover.png') });
      await page.mouse.move(0, 0);
      await button.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(button).toBeFocused();
      expect(await button.evaluate((e) => e.matches(':focus-visible'))).toBe(true);
      await settle(page);
      const outline = await button.evaluate((e) => {
        const s = getComputedStyle(e);
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThan(0);
      await page.screenshot({ path: info.outputPath('cta-focus.png') });
      const focus = await measureButtonPaint(page, button, info, 'focus');
      await button.hover();
      await page.mouse.down();
      const press = await button.evaluate(async (e) => {
        const animation = e
          .getAnimations({ subtree: true })
          .find((a) => a instanceof CSSAnimation && a.animationName === 'fintech-press');
        if (!animation) throw new Error('Actual CTA press animation missing');
        animation.pause();
        animation.currentTime = 200;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        return {
          active: e.matches(':active'),
          overlayOpacity: getComputedStyle(e, '::after').opacity,
        };
      });
      expect(press.active).toBe(true);
      expect(Number(press.overlayOpacity)).toBeGreaterThan(0);
      await button.evaluate(async (e) => {
        await Promise.all(
          e
            .getAnimations({ subtree: true })
            .filter(
              (a) => a.playState !== 'paused' && a.effect?.getTiming().iterations !== Infinity,
            )
            .map((a) => a.finished.catch(() => undefined)),
        );
      });
      expect(await button.evaluate((e) => e.matches(':active'))).toBe(true);
      await page.screenshot({ path: info.outputPath('cta-active.png'), animations: 'allow' });
      const active = await measureButtonPaint(page, button, info, 'active');
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await expect.poll(() => new URL(page.url()).pathname).toBe(`${profile.prefix}/p2p/guide`);
      const observation = { profile, mode, normal, hover, focus, active, outline, press };
      await writeFile(
        info.outputPath('cta-interaction.json'),
        JSON.stringify(observation, null, 2),
      );
      console.log('C06_CTA_INTERACTION', JSON.stringify(observation));
      for (const paint of [normal, hover, focus, active]) {
        expect(paint.filter).toBe('none');
        expect(paint.minimumRatio).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
}

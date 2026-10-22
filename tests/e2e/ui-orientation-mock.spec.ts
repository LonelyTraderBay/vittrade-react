import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { name: 'phone-landscape', prefix: '', width: 568, height: 320 },
  { name: 'tablet-short', prefix: '/t', width: 900, height: 400 },
  { name: 'web-short', prefix: '/w', width: 1440, height: 400 },
  { name: 'responsive-short', prefix: '/r', width: 900, height: 400 },
  { name: 'below-old-threshold', prefix: '/r', width: 900, height: 499 },
  { name: 'at-old-threshold', prefix: '/r', width: 900, height: 500 },
  { name: 'above-old-threshold', prefix: '/r', width: 900, height: 501 },
] as const;

async function reachSubmitByWheel(page: Page) {
  const submit = page.getByTestId('auth-submit');
  const read = () =>
    submit.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const hit = document.elementFromPoint(center.x, center.y);
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        reachable: Boolean(
          bounds.top >= 0 &&
          bounds.bottom <= innerHeight &&
          hit &&
          (hit === element || element.contains(hit)),
        ),
      };
    });
  const before = await read();
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await expect
    .poll(
      async () => {
        const current = await read();
        if (!current.reachable) await page.mouse.wheel(0, current.top < 0 ? -120 : 120);
        return current.reachable;
      },
      { timeout: 5_000, message: 'Submit must be reachable through native wheel scrolling' },
    )
    .toBe(true);
  return { before, after: await read() };
}

for (const mode of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Orientation permits login ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize({ width: profile.width, height: profile.height });
      let financialWrites = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && /\/wallet\//.test(request.url())) financialWrites++;
      });
      await page.goto(`${profile.prefix}/auth/login`);
      await expect(page.getByTestId('auth-submit')).toBeVisible();
      // Explicit CSS modes; no claim about ThemeProvider persistence or an OS orientation sensor.
      await page.locator('html').evaluate((html, value) => {
        html.classList.toggle('dark', value === 'dark');
        html.classList.toggle('light', value === 'light');
      }, mode);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined)),
        );
      });
      // Filling a locator can scroll it programmatically, concealing a broken native scroll owner.
      const nativeScroll = await reachSubmitByWheel(page);
      await page.getByTestId('auth-email').fill('wallet@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      const afterFillScroll = await reachSubmitByWheel(page);
      const submit = page.getByTestId('auth-submit');
      await expect(submit).toBeInViewport();
      const observation = await submit.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
        const hit = document.elementFromPoint(center.x, center.y);
        const pseudo = getComputedStyle(document.body, '::before');
        return {
          center,
          centerHitsSubmit: Boolean(hit && (hit === element || element.contains(hit))),
          hitTag: hit?.tagName,
          pseudo: {
            content: pseudo.content,
            position: pseudo.position,
            zIndex: pseudo.zIndex,
            pointerEvents: pseudo.pointerEvents,
          },
          viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
          landscapeQuery: matchMedia('(orientation: landscape)').matches,
          htmlClass: document.documentElement.className,
          locale: navigator.language,
          lang: document.documentElement.lang,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      });
      await writeFile(
        info.outputPath('orientation.json'),
        JSON.stringify({ profile, mode, nativeScroll, afterFillScroll, observation }, null, 2),
      );
      await page.screenshot({
        path: info.outputPath('orientation.png'),
        fullPage: true,
        animations: 'disabled',
      });
      console.log('C06_ORIENTATION', JSON.stringify({ profile, mode, observation }));
      expect(observation.landscapeQuery).toBe(true);
      expect(observation.centerHitsSubmit).toBe(true);
      const pending = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname.endsWith('/auth/login'),
      );
      await page.mouse.click(observation.center.x, observation.center.y);
      const response = await pending;
      expect(response.fromServiceWorker()).toBe(true);
      expect(response.status()).toBe(200);
      expect(response.request().postDataJSON()).toEqual({
        email: 'wallet@vittrade.local',
        password: 'Preview-123!',
      });
      await expect.poll(() => new URL(page.url()).pathname).toBe(`${profile.prefix}/home`);
      await expect(page.getByRole('heading', { level: 1, name: 'Thị trường' })).toBeVisible();
      expect(financialWrites).toBe(0);
    });
  }
}

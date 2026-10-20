import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'phone-short', prefix: '', width: 568, height: 320 },
  { name: 'tablet-control', prefix: '/t', width: 900, height: 900 },
  { name: 'web-control', prefix: '/w', width: 1440, height: 900 },
  { name: 'responsive-control', prefix: '/r', width: 1024, height: 900 },
] as const;

for (const mode of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Route snapshot retains immediate input ${profile.name} ${mode} @ui-mock`, async ({
      page,
    }, info) => {
      await page.setViewportSize(profile);
      let writes = 0;
      page.on('request', (request) => {
        if (
          ['POST', 'PATCH', 'DELETE'].includes(request.method()) &&
          new URL(request.url()).pathname.includes('/p2p/')
        )
          writes++;
      });
      await page.goto(`${profile.prefix}/p2p/create`);
      await page.getByTestId('auth-email').fill('developer@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(
        page.getByRole('heading', { level: 1, name: 'Đăng quảng cáo P2P', exact: true }),
      ).toBeVisible();
      await page.locator('html').evaluate((html, mode) => {
        html.classList.toggle('light', mode === 'light');
        html.classList.toggle('dark', mode === 'dark');
      }, mode);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document
                .getAnimations()
                .filter(
                  (animation) =>
                    animation.playState === 'running' &&
                    Number.isFinite(animation.effect?.getComputedTiming().endTime),
                ).length,
          ),
        )
        .toBe(0);
      const target = `${profile.prefix}/p2p/ad/ad001`;
      const responsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname.endsWith('/p2p/ads/ad001'),
      );
      await page.evaluate(
        async ({ moduleUrl, target }) => {
          const { router } = await import(moduleUrl);
          await router.navigate(target);
        },
        { moduleUrl: '/src/app/router/index.ts', target },
      );
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      expect(response.fromServiceWorker()).toBe(true);
      const amount = page.getByRole('spinbutton', { name: 'Fiat amount', exact: true });
      // Paste immediately when the next page first exposes its field. Waiting for the exit
      // animation here would hide the original route-remount/data-loss regression.
      await expect(amount).toBeVisible();
      await amount.fill('1234567');
      const original = await amount.elementHandle();
      expect(original).not.toBeNull();
      const before = await amount.evaluate((element) => ({
        value: (element as HTMLInputElement).value,
        animations: document
          .getAnimations()
          .filter((animation) => animation.playState === 'running')
          .map((animation) => ({ endTime: animation.effect?.getComputedTiming().endTime })),
      }));
      await page.evaluate(async () => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document
                .getAnimations()
                .filter(
                  (animation) =>
                    animation.playState === 'running' &&
                    Number.isFinite(animation.effect?.getComputedTiming().endTime),
                ).length,
          ),
        )
        .toBe(0);
      await page.evaluate(async () => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      const after = {
        value: await amount.inputValue(),
        originalConnected: await original!.evaluate((element) => element.isConnected),
        sameElement: await amount.evaluate((element, old) => element === old, original!),
        path: new URL(page.url()).pathname,
      };
      expect(after).toEqual({
        value: '1234567',
        originalConnected: true,
        sameElement: true,
        path: target,
      });
      expect(writes).toBe(0);
      await page.screenshot({
        path: info.outputPath('route-snapshot.png'),
        fullPage: true,
        animations: 'disabled',
      });
      const observation = {
        profile,
        mode,
        before,
        after,
        writes,
        environment: await page.evaluate(() => ({
          lang: document.documentElement.lang,
          locale: navigator.language,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          htmlClass: document.documentElement.className,
        })),
        scope:
          'Real route and native input through MSW GET200; no financial writes or backend acceptance. Only Phone uses this PageTransition owner; T/W/R are controls.',
      };
      await writeFile(info.outputPath('route-snapshot.json'), JSON.stringify(observation, null, 2));
      console.log('C06_ROUTE_SNAPSHOT', JSON.stringify(observation));
    });
  }
}

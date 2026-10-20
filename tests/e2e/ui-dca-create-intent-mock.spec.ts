import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const profiles = [
  { name: 'phone-keyboard', prefix: '', width: 390, height: 844, keyboard: true },
  { name: 'tablet-pointer', prefix: '/t', width: 900, height: 900, keyboard: false },
  { name: 'responsive-pointer', prefix: '/r', width: 1024, height: 900, keyboard: false },
  { name: 'web-pointer', prefix: '/w', width: 1440, height: 900, keyboard: false },
] as const;

for (const mode of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`DCA retains failed create intent ${profile.name} ${mode} @ui-mock`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: profile.width, height: profile.height });
      await page.goto(`${profile.prefix}/dca`);
      await page.getByTestId('auth-email').fill('dca@vittrade.local');
      await page.getByTestId('auth-password').fill('Preview-123!');
      await page.getByTestId('auth-submit').click();
      await expect(
        page.getByRole('heading', { name: 'Mua tự động (DCA)', exact: true }),
      ).toBeVisible();
      await expect.poll(() => new URL(page.url()).pathname).toBe(`${profile.prefix}/dca`);
      await page.locator('html').evaluate((html, value) => {
        html.classList.toggle('light', value === 'light');
        html.classList.toggle('dark', value === 'dark');
      }, mode);

      // Observe Vite's actual dependency URL so the handler uses the running worker's MSW instance.
      const source = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
      const mswUrl = source.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
      expect(mswUrl, 'The running MSW dependency import must be observable').toBeTruthy();
      let injectedFailures = 0;
      page.on('console', (message) => {
        if (message.text() === 'C06_DCA_INTENT_TRANSPORT_ERROR') injectedFailures++;
      });
      await page.evaluate(
        async ({ workerUrl, dependencyUrl }) => {
          const { worker } = await import(workerUrl);
          const { http, HttpResponse } = await import(dependencyUrl);
          worker.use(
            http.post('*/dca/plans', () => {
              console.info('C06_DCA_INTENT_TRANSPORT_ERROR');
              return HttpResponse.error();
            }),
          );
        },
        { workerUrl: '/src/dev/mocks/browser.ts', dependencyUrl: mswUrl! },
      );
      const posts: { body: unknown; key: string | undefined }[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/dca/plans')) {
          posts.push({ body: request.postDataJSON(), key: request.headers()['idempotency-key'] });
        }
      });

      const open = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
      // Phone pointer occlusion is a separate, recorded preview finding; this cell checks keyboard.
      if (profile.keyboard) await open.press('Enter');
      else await open.click();
      const dialog = page.getByRole('dialog', { name: 'Tạo Kế Hoạch DCA Mới' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /Solana.*SOL/ }).click();
      await dialog.getByRole('button', { name: 'Hàng ngày', exact: true }).click();
      const amount = dialog.getByPlaceholder('500.000');
      await amount.fill('1234567');
      const submit = dialog.getByRole('button', { name: 'Tạo Kế Hoạch', exact: true });
      const expected = { coinSymbol: 'SOL', frequency: 'daily', amountPerPurchase: 1234567 };
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (profile.keyboard) await submit.press('Enter');
        else await submit.click();
        await expect.poll(() => injectedFailures).toBe(attempt);
        await expect(submit).toBeEnabled();
        await expect(dialog).toBeVisible();
        await expect(amount).toHaveValue('1234567');
        const feedback = dialog.getByRole('alert');
        await expect(feedback).toContainText('Chưa nhận được xác nhận tạo kế hoạch.');
        const bounds = await dialog.boundingBox();
        await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
        await page.mouse.wheel(0, 900);
        await expect(feedback).toBeInViewport({ ratio: 1 });
        expect(posts).toHaveLength(attempt);
        expect(posts[attempt - 1].body).toEqual(expected);
        expect(posts[attempt - 1].key).toEqual(expect.any(String));
        expect(posts[attempt - 1].key!.length).toBeGreaterThanOrEqual(8);
      }
      expect(posts[1].key).toBe(posts[0].key);
      await expect(
        page.getByText('Không thể tạo kế hoạch. Vui lòng thử lại.', { exact: true }).first(),
      ).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined)),
        );
      });
      const contrast = await new AxeBuilder({ page })
        .include('[role="dialog"] [role="alert"]')
        .withRules(['color-contrast'])
        .analyze();
      expect(contrast.violations).toEqual([]);
      expect(contrast.incomplete).toEqual([]);
      const feedback = await dialog.getByRole('alert').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return {
          centerHitsFeedback: Boolean(hit && (element === hit || element.contains(hit))),
          color: style.color,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          rect: { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
        };
      });
      expect(feedback.centerHitsFeedback).toBe(true);
      const observation = {
        profile,
        mode,
        attempts: posts.length,
        bodies: posts.map((post) => post.body),
        sameKey: posts[0].key === posts[1].key,
        injectedFailures,
        amount: await amount.inputValue(),
        errorContrast: {
          violations: contrast.violations.length,
          incomplete: contrast.incomplete.length,
        },
        feedback,
        scope: 'Local MSW transport errors before original POST handler; no backend outcome proof.',
      };
      await writeFile(
        info.outputPath('dca-create-intent.json'),
        JSON.stringify(observation, null, 2),
      );
      await page.screenshot({
        path: info.outputPath('dca-create-intent.png'),
        fullPage: true,
        animations: 'disabled',
      });
      console.log('C06_DCA_CREATE_INTENT', JSON.stringify(observation));
    });
  }
}

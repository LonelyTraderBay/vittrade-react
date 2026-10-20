import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'tablet', prefix: '/t', width: 900, height: 900 },
  { name: 'web', prefix: '/w', width: 1440, height: 900 },
  { name: 'responsive', prefix: '/r', width: 1024, height: 900 },
] as const;
const shortProfiles = [
  { name: 'phone-short', prefix: '', width: 568, height: 320 },
  { name: 'web-short', prefix: '/w', width: 1440, height: 400 },
] as const;
type Kind = 'subscribe' | 'positions-redeem' | 'portfolio-redeem';

async function start(page: Page, prefix: string, mode: string) {
  await page.goto(`${prefix}/earn/savings`);
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tiết kiệm', exact: true }),
  ).toBeVisible();
  // Explicit CSS modes; this does not establish ThemeProvider persistence or device OS behavior.
  await page.locator('html').evaluate((html, value) => {
    html.classList.toggle('light', value === 'light');
    html.classList.toggle('dark', value === 'dark');
  }, mode);
}

async function navigate(page: Page, path: string, heading: string) {
  await page.evaluate(
    async ({ moduleUrl, path }) => {
      const { router } = await import(moduleUrl);
      await router.navigate(path);
    },
    { moduleUrl: '/src/app/router/index.ts', path },
  );
  await expect.poll(() => new URL(page.url()).pathname).toBe(path);
  await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function productTrigger(page: Page) {
  await page.getByRole('tab', { name: 'Sản phẩm', exact: true }).click();
  const trigger = page.getByRole('button').filter({ hasText: 'APY' }).first();
  await expect(trigger).toBeEnabled();
  return trigger;
}

async function openKind(page: Page, prefix: string, kind: Kind) {
  const portfolio = kind === 'portfolio-redeem';
  await navigate(
    page,
    `${prefix}/earn/savings${portfolio ? '/portfolio' : ''}`,
    portfolio ? 'Danh mục tiết kiệm' : 'Tiết kiệm',
  );
  let trigger: Locator;
  if (kind === 'subscribe') trigger = await productTrigger(page);
  else {
    if (!portfolio) await page.getByRole('tab', { name: /Của tôi/ }).click();
    trigger = page.getByRole('button', { name: 'Rút vốn', exact: true }).first();
  }
  await trigger.click();
  const dialog = page.getByRole('dialog', {
    name: kind === 'subscribe' ? 'Đăng ký sản phẩm' : 'Rút vốn',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

async function inspectAndCancel(
  page: Page,
  dialog: Locator,
  trigger: Locator,
  subscribe: boolean,
  method: 'escape' | 'button' | 'backdrop',
  label: string,
  info: TestInfo,
) {
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  // Enable the action so Tab coverage includes the financial CTA, without submitting it.
  await dialog.getByRole('button', { name: 'MAX', exact: true }).press('Enter');
  if (subscribe) await dialog.getByRole('checkbox').press('Space');
  await expect(
    dialog.getByRole('button', { name: subscribe ? 'Xác nhận đăng ký' : 'Xác nhận rút vốn' }),
  ).toBeEnabled();
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
        true,
      );
    }
  }
  const close = dialog.getByRole('button', { name: 'Đóng', exact: true });
  await expect(close).toBeInViewport({ ratio: 1 });
  const geometry = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const button = element.querySelector<HTMLButtonElement>('button[aria-label="Đóng"]')!;
    const bounds = button.getBoundingClientRect();
    const hit = document.elementFromPoint(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    const frame = document.querySelector('#app-layout-root')?.getBoundingClientRect();
    return {
      panel: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
      closeHitsSelf: Boolean(hit && (button === hit || button.contains(hit))),
      insideViewport:
        rect.top >= -0.5 &&
        rect.bottom <= innerHeight + 0.5 &&
        rect.left >= -0.5 &&
        rect.right <= innerWidth + 0.5,
      insidePhoneFrame:
        !frame || (rect.left >= frame.left - 0.5 && rect.right <= frame.right + 0.5),
      viewport: { width: innerWidth, height: innerHeight },
    };
  });
  expect(geometry.insideViewport).toBe(true);
  expect(geometry.insidePhoneFrame).toBe(true);
  expect(geometry.closeHitsSelf).toBe(true);
  await page.screenshot({
    path: info.outputPath(`${label}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  if (method === 'escape') await page.keyboard.press('Escape');
  else if (method === 'button') await close.click();
  else await page.locator('[data-bottom-sheet-overlay]').click({ position: { x: 4, y: 4 } });
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  return { path: new URL(page.url()).pathname, label, method, focusChecks: 16, geometry };
}

for (const mode of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Earn modal aliases ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      let writes = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && /\/earn\//.test(request.url())) writes++;
      });
      await start(page, profile.prefix, mode);
      const rows = [];
      for (const alias of ['/earn', '/earn/staking', '/earn/savings']) {
        await navigate(
          page,
          `${profile.prefix}${alias}`,
          alias === '/earn/savings' ? 'Tiết kiệm' : 'Staking & Earn',
        );
        const trigger = await productTrigger(page);
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: 'Đăng ký sản phẩm', exact: true });
        rows.push(
          await inspectAndCancel(
            page,
            dialog,
            trigger,
            true,
            alias === '/earn' ? 'escape' : alias === '/earn/staking' ? 'button' : 'backdrop',
            alias.replaceAll('/', '-'),
            info,
          ),
        );
      }
      for (const kind of ['positions-redeem', 'portfolio-redeem'] as const) {
        const { trigger, dialog } = await openKind(page, profile.prefix, kind);
        rows.push(
          await inspectAndCancel(
            page,
            dialog,
            trigger,
            false,
            kind === 'positions-redeem' ? 'escape' : 'button',
            kind,
            info,
          ),
        );
      }
      expect(writes).toBe(0);
      await writeFile(
        info.outputPath('earn-modal.json'),
        JSON.stringify({ profile, mode, rows, writes }, null, 2),
      );
      console.log(
        'C06_EARN_MODAL',
        JSON.stringify({ profile, mode, contexts: rows.length, writes }),
      );
    });
  }
  for (const profile of shortProfiles) {
    test(`Earn modal short viewport ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      let writes = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && /\/earn\//.test(request.url())) writes++;
      });
      await start(page, profile.prefix, mode);
      const rows = [];
      for (const kind of ['subscribe', 'portfolio-redeem'] as const) {
        const { trigger, dialog } = await openKind(page, profile.prefix, kind);
        rows.push(
          await inspectAndCancel(page, dialog, trigger, kind === 'subscribe', 'button', kind, info),
        );
      }
      expect(writes).toBe(0);
      await writeFile(
        info.outputPath('earn-modal.json'),
        JSON.stringify({ profile, mode, rows, writes }, null, 2),
      );
      console.log(
        'C06_EARN_MODAL_SHORT',
        JSON.stringify({ profile, mode, contexts: rows.length, writes }),
      );
    });
  }
  for (const kind of ['subscribe', 'positions-redeem', 'portfolio-redeem'] as const) {
    test(`Earn pending and failed intent ${kind} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await start(page, '/w', mode);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      await page.exposeFunction('c06HoldEarnRequest', () => gate);
      const source = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
      const dependencyUrl = source.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
      expect(dependencyUrl).toBeTruthy();
      const endpoint = kind === 'subscribe' ? '/earn/subscriptions' : '/earn/redemptions';
      let failures = 0;
      page.on('console', (message) => {
        if (message.text() === 'C06_EARN_HELD_TRANSPORT_ERROR') failures++;
      });
      await page.evaluate(
        async ({ dependencyUrl, workerUrl, endpoint }) => {
          const { worker } = await import(workerUrl);
          const { http, HttpResponse } = await import(dependencyUrl);
          worker.use(
            http.post(`*${endpoint}`, async () => {
              console.info('C06_EARN_HELD_TRANSPORT_ERROR');
              await (
                window as typeof window & { c06HoldEarnRequest: () => Promise<void> }
              ).c06HoldEarnRequest();
              return HttpResponse.error();
            }),
          );
        },
        { dependencyUrl: dependencyUrl!, workerUrl: '/src/dev/mocks/browser.ts', endpoint },
      );
      const posts: { body: unknown; key: string | undefined }[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith(endpoint)) {
          posts.push({ body: request.postDataJSON(), key: request.headers()['idempotency-key'] });
        }
      });
      const { trigger, dialog } = await openKind(page, '/w', kind);
      const amount = dialog.getByRole('textbox', { name: 'Số lượng' });
      await amount.fill('12.3456789');
      if (kind === 'subscribe') await dialog.getByRole('checkbox').check();
      const submit = dialog.getByRole('button', {
        name: kind === 'subscribe' ? 'Xác nhận đăng ký' : 'Xác nhận rút vốn',
      });
      await expect(submit).toBeEnabled();
      try {
        await submit.click();
        await expect.poll(() => failures).toBe(1);
        await expect(submit).toBeDisabled();
        await expect(amount).toBeDisabled();
        await expect(dialog.getByRole('button', { name: 'Đóng', exact: true })).toBeDisabled();
        await expect(dialog).toBeFocused();
        for (const key of ['Tab', 'Shift+Tab']) {
          for (let i = 0; i < 8; i++) {
            await page.keyboard.press(key);
            expect(
              await dialog.evaluate((element) => element.contains(document.activeElement)),
            ).toBe(true);
          }
        }
        await page.keyboard.press('Escape');
        await page.locator('[data-bottom-sheet-overlay]').click({ position: { x: 4, y: 4 } });
        await expect(dialog).toBeVisible();
        expect(posts).toHaveLength(1);
      } finally {
        release();
      }
      await expect(submit).toBeEnabled();
      await expect(dialog.getByRole('alert')).toBeVisible();
      await expect(amount).toHaveValue('12.3456789');
      if (kind === 'subscribe') await expect(dialog.getByRole('checkbox')).toBeChecked();
      await submit.click();
      await expect.poll(() => failures).toBe(2);
      await expect(submit).toBeEnabled();
      await expect(amount).toHaveValue('12.3456789');
      expect(posts).toHaveLength(2);
      expect(posts[0].body).toEqual(
        kind === 'subscribe'
          ? { productId: 'sav001', amount: 12.3456789 }
          : { positionId: 'earn-position-1', amount: 12.3456789 },
      );
      expect(posts[1].body).toEqual(posts[0].body);
      expect(posts[0].key).toEqual(expect.any(String));
      expect(posts[0].key!.length).toBeGreaterThanOrEqual(8);
      expect(posts[1].key).toBe(posts[0].key);
      await page.screenshot({
        path: info.outputPath('earn-failed.png'),
        fullPage: true,
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      const observation = {
        kind,
        mode,
        posts: posts.map((post) => post.body),
        sameKey: posts[0].key === posts[1].key,
        failures,
        scope:
          'MSW held transport error; original POST handlers never run. No backend outcome or durable idempotency certification.',
      };
      await writeFile(info.outputPath('earn-pending.json'), JSON.stringify(observation, null, 2));
      console.log('C06_EARN_PENDING', JSON.stringify(observation));
    });
  }
}

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { verifyOpaqueTextContrast } from './helpers/opaque-text-contrast';

test('Opaque contrast resolver rejects unreadable, unsupported and obscured text @ui-mock', async ({
  page,
}) => {
  // Isolated browser calibration; this is harness evidence, not another product route.
  for (const style of [
    'color:white;background:white',
    'color:black;background:white;opacity:0.5',
    'color:black;background:linear-gradient(white,gray)',
  ]) {
    await page.setContent(`<p style="${style}">Contrast control</p>`);
    await expect(verifyOpaqueTextContrast(page, page.locator('p'))).rejects.toThrow();
  }
  await page.setContent(
    '<p style="color:black;background:white">Contrast control</p>' +
      '<div style="position:fixed;inset:0;background:white"></div>',
  );
  await expect(verifyOpaqueTextContrast(page, page.locator('p'))).rejects.toThrow(
    'Text is obscured',
  );
});

const profiles = [
  { name: 'phone', prefix: '', width: 390, height: 844, keyboard: true },
  { name: 'tablet', prefix: '/t', width: 900, height: 900, keyboard: false },
  { name: 'web', prefix: '/w', width: 1440, height: 900, keyboard: false },
  { name: 'responsive', prefix: '/r', width: 1024, height: 900, keyboard: false },
] as const;
const shortProfiles = [
  { name: 'phone-short', prefix: '', width: 568, height: 320, keyboard: true },
  { name: 'web-short', prefix: '/w', width: 1440, height: 400, keyboard: true },
] as const;
type Kind = 'create' | 'order' | 'delete';
const titles = {
  create: 'Xác nhận đăng quảng cáo',
  order: 'Xác nhận đơn P2P',
  delete: 'Xóa quảng cáo?',
};
const headings = {
  create: 'Đăng quảng cáo P2P',
  order: 'Chi tiết quảng cáo',
  delete: 'Quảng cáo của tôi',
};
const paths = { create: '/p2p/create', order: '/p2p/ad/ad001', delete: '/p2p/my-ads' };

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}
async function start(page: Page, prefix: string, mode: string) {
  await page.goto(`${prefix}/p2p/create`);
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(
    page.getByRole('heading', { level: 1, name: headings.create, exact: true }),
  ).toBeVisible();
  // CSS modes are explicit; ThemeProvider persistence, OS and AT are separate acceptance.
  await page.locator('html').evaluate((html, value) => {
    html.classList.toggle('light', value === 'light');
    html.classList.toggle('dark', value === 'dark');
  }, mode);
}
async function openKind(
  page: Page,
  prefix: string,
  kind: Kind,
  keyboard: boolean,
  alias = paths[kind],
) {
  const target = `${prefix}${alias}`;
  await page.evaluate(
    async ({ path, moduleUrl }) => {
      const { router } = await import(moduleUrl);
      await router.navigate(path);
    },
    { path: target, moduleUrl: '/src/app/router/index.ts' },
  );
  await expect.poll(() => new URL(page.url()).pathname).toBe(target);
  await expect(
    page.getByRole('heading', { level: 1, name: headings[kind], exact: true }),
  ).toBeVisible();
  let trigger: Locator;
  if (kind === 'create') {
    for (const [name, value] of [
      ['Giá (VND/USDT)', '25001'],
      ['Tổng USDT', '1001'],
      ['Tối thiểu (VND)', '100001'],
      ['Tối đa (VND)', '10000001'],
    ]) {
      await page.getByRole('spinbutton', { name, exact: true }).fill(value);
    }
    const payment = page.getByRole('button', { name: 'Vietcombank', exact: true });
    if ((await payment.getAttribute('aria-pressed')) !== 'true') await payment.press('Enter');
    trigger = page.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo', exact: true });
  } else if (kind === 'order') {
    await page.getByRole('spinbutton', { name: 'Fiat amount', exact: true }).fill('1000001');
    trigger = page.getByRole('button', { name: 'Xem xác nhận đơn P2P', exact: true });
  } else trigger = page.getByRole('button', { name: 'Delete myad001', exact: true });
  await expect(trigger).toBeEnabled();
  if (keyboard) await trigger.press('Enter');
  else await trigger.click();
  const dialog = page.getByRole('dialog', { name: titles[kind], exact: true });
  await expect(dialog).toBeVisible();
  await settle(page);
  return { trigger, dialog };
}
async function inspectAndCancel(
  page: Page,
  dialog: Locator,
  trigger: Locator,
  kind: Kind,
  method: 'escape' | 'cancel' | 'backdrop',
  label: string,
  info: TestInfo,
  contrast: boolean,
) {
  await expect
    .poll(() =>
      dialog.evaluate((e) => e === document.activeElement || e.contains(document.activeElement)),
    )
    .toBe(true);
  for (const key of ['Tab', 'Shift+Tab'])
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(true);
    }
  const cancel = dialog.getByRole('button', { name: /^(Hủy|Huỷ)$/ });
  await expect(cancel).toBeInViewport({ ratio: 1 });
  const geometry = await dialog.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const frame = document.querySelector('#app-layout-root')?.getBoundingClientRect();
    const buttons = [...e.querySelectorAll('button')].map((b) => {
      const r = b.getBoundingClientRect(),
        hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        name: b.getAttribute('aria-label') || b.textContent,
        hitsSelf: Boolean(hit && (hit === b || b.contains(hit))),
        top: r.top,
        bottom: r.bottom,
      };
    });
    return {
      panel: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
      insideViewport:
        r.left >= -0.5 &&
        r.right <= innerWidth + 0.5 &&
        r.top >= -0.5 &&
        r.bottom <= innerHeight + 0.5,
      insideFrame: !frame || (r.left >= frame.left - 0.5 && r.right <= frame.right + 0.5),
      buttons,
    };
  });
  expect(geometry.insideViewport).toBe(true);
  expect(geometry.insideFrame).toBe(true);
  expect(geometry.buttons.find((b) => /^(Hủy|Huỷ)$/.test(b.name || ''))?.hitsSelf).toBe(true);
  let colorContrast:
    | {
        violations: number;
        incomplete: number;
        resolvedNodes: number;
        opaqueMeasurements: unknown[];
      }
    | undefined;
  if (contrast) {
    const result = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withRules(['color-contrast'])
      .analyze();
    expect(result.violations).toEqual([]);
    const opaqueMeasurements = [];
    for (const issue of result.incomplete) {
      expect(issue.id).toBe('color-contrast');
      expect(issue.nodes.length).toBeGreaterThan(0);
      for (const node of issue.nodes) {
        expect(node.target).toHaveLength(1);
        expect(typeof node.target[0]).toBe('string');
        expect(node.all).toEqual([]);
        expect(node.none).toEqual([]);
        expect(node.any.length).toBeGreaterThan(0);
        expect(
          node.any.every(
            (check) =>
              check.id === 'color-contrast' && check.data?.messageKey === 'elmPartiallyObscuring',
          ),
        ).toBe(true);
        const target = dialog.locator(node.target[0] as string);
        await expect(target).toHaveCount(1);
        // Keep axe's raw incomplete result; resolve only supported opaque text using real paint/hits.
        opaqueMeasurements.push(await verifyOpaqueTextContrast(page, target));
      }
    }
    colorContrast = {
      violations: result.violations.length,
      incomplete: result.incomplete.length,
      resolvedNodes: opaqueMeasurements.length,
      opaqueMeasurements,
    };
    expect(opaqueMeasurements).toHaveLength(
      result.incomplete.reduce((n, issue) => n + issue.nodes.length, 0),
    );
    await info.attach(label + '-contrast-resolution', {
      body: JSON.stringify({ rawAxe: result, colorContrast }),
      contentType: 'application/json',
    });
  }
  await page.screenshot({
    path: info.outputPath(`${label}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  if (method === 'escape') await page.keyboard.press('Escape');
  else if (method === 'cancel') await cancel.click();
  else await page.locator('[data-bottom-sheet-overlay]').click({ position: { x: 4, y: 4 } });
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  return {
    kind,
    path: new URL(page.url()).pathname,
    label,
    method,
    focusChecks: 16,
    geometry,
    colorContrast,
  };
}
for (const mode of ['light', 'dark'] as const) {
  for (const profile of profiles)
    test(`P2P modal aliases ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      let writes = 0;
      page.on('request', (r) => {
        if (
          ['POST', 'PATCH', 'DELETE'].includes(r.method()) &&
          new URL(r.url()).pathname.includes('/p2p/')
        )
          writes++;
      });
      await start(page, profile.prefix, mode);
      const rows = [];
      for (const kind of ['create', 'order', 'delete'] as const) {
        const { trigger, dialog } = await openKind(page, profile.prefix, kind, profile.keyboard);
        rows.push(
          await inspectAndCancel(
            page,
            dialog,
            trigger,
            kind,
            kind === 'create' ? 'escape' : 'cancel',
            kind,
            info,
            profile.name === 'web',
          ),
        );
      }
      if (profile.name === 'web') {
        const { trigger, dialog } = await openKind(
          page,
          profile.prefix,
          'create',
          false,
          '/p2p/create-offer',
        );
        rows.push(
          await inspectAndCancel(
            page,
            dialog,
            trigger,
            'create',
            'backdrop',
            'create-offer',
            info,
            false,
          ),
        );
      }
      expect(writes).toBe(0);
      await writeFile(
        info.outputPath('p2p-modal.json'),
        JSON.stringify({ profile, mode, rows, writes }, null, 2),
      );
      console.log(
        'C06_P2P_MODAL',
        JSON.stringify({ profile, mode, contexts: rows.length, writes }),
      );
    });
  for (const profile of shortProfiles)
    test(`P2P modal short ${profile.name} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize(profile);
      let writes = 0;
      page.on('request', (r) => {
        if (
          ['POST', 'PATCH', 'DELETE'].includes(r.method()) &&
          new URL(r.url()).pathname.includes('/p2p/')
        )
          writes++;
      });
      await start(page, profile.prefix, mode);
      const rows = [];
      for (const kind of ['create', 'order', 'delete'] as const) {
        const { trigger, dialog } = await openKind(page, profile.prefix, kind, true);
        rows.push(await inspectAndCancel(page, dialog, trigger, kind, 'cancel', kind, info, false));
      }
      expect(writes).toBe(0);
      await writeFile(
        info.outputPath('p2p-modal.json'),
        JSON.stringify({ profile, mode, rows, writes }, null, 2),
      );
      console.log(
        'C06_P2P_MODAL_SHORT',
        JSON.stringify({ profile, mode, contexts: rows.length, writes }),
      );
    });
  for (const kind of ['create', 'order', 'delete'] as const)
    test(`P2P pending and error ${kind} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await start(page, '/w', mode);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      await page.exposeFunction('c06HoldP2p', () => gate);
      const source = await (await page.request.get('/src/dev/mocks/handlers.ts')).text();
      const dependencyUrl = source.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
      expect(dependencyUrl).toBeTruthy();
      const endpoint =
        kind === 'create' ? '/p2p/ads' : kind === 'order' ? '/p2p/orders' : '/p2p/ads/myad001';
      let failed = 0;
      page.on('console', (m) => {
        if (m.text() === 'C06_P2P_HELD_TRANSPORT_ERROR') failed++;
      });
      await page.evaluate(
        async ({ dependencyUrl, workerUrl, endpoint, kind }) => {
          const { worker } = await import(workerUrl);
          const { http, HttpResponse } = await import(dependencyUrl);
          worker.use(
            http[kind === 'delete' ? 'delete' : 'post'](`*${endpoint}`, async () => {
              console.info('C06_P2P_HELD_TRANSPORT_ERROR');
              await (window as typeof window & { c06HoldP2p: () => Promise<void> }).c06HoldP2p();
              return HttpResponse.error();
            }),
          );
        },
        { dependencyUrl: dependencyUrl!, workerUrl: '/src/dev/mocks/browser.ts', endpoint, kind },
      );
      const attempts: { body: unknown; key: string | undefined }[] = [];
      page.on('request', (r) => {
        if (
          new URL(r.url()).pathname.endsWith(endpoint) &&
          r.method() === (kind === 'delete' ? 'DELETE' : 'POST')
        )
          attempts.push({
            body: r.postData() ? r.postDataJSON() : null,
            key: r.headers()['idempotency-key'],
          });
      });
      const { trigger, dialog } = await openKind(page, '/w', kind, false);
      const confirm = dialog.getByRole('button', {
        name:
          kind === 'create'
            ? /^(Xác nhận đăng|Đang đăng…)$/
            : kind === 'order'
              ? 'Confirm P2P order'
              : /^(Xác nhận xóa|Đang xóa…)$/,
        exact: true,
      });
      let pendingFocusChecks = 0;
      await confirm.click();
      try {
        await expect.poll(() => failed).toBe(1);
        await expect(confirm).toBeDisabled();
        await expect(dialog).toBeFocused();
        for (const key of ['Tab', 'Shift+Tab']) {
          for (let i = 0; i < 8; i++) {
            await page.keyboard.press(key);
            expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(true);
            pendingFocusChecks++;
          }
        }
        if (kind !== 'order')
          await expect(confirm).toHaveText(kind === 'create' ? 'Đang đăng…' : 'Đang xóa…');
        await expect(dialog.getByRole('button', { name: /^(Hủy|Huỷ)$/ })).toBeDisabled();
        await page.keyboard.press('Escape');
        await page.locator('[data-bottom-sheet-overlay]').click({ position: { x: 4, y: 4 } });
        await expect(dialog).toBeVisible();
        expect(attempts).toHaveLength(1);
      } finally {
        release();
      }
      let alert: Locator;
      if (kind === 'create') {
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(
          page.getByRole('spinbutton', { name: 'Giá (VND/USDT)', exact: true }),
        ).toHaveValue('25001');
        await expect(page.getByRole('spinbutton', { name: 'Tổng USDT', exact: true })).toHaveValue(
          '1001',
        );
        await expect(
          page.getByRole('spinbutton', { name: 'Tối thiểu (VND)', exact: true }),
        ).toHaveValue('100001');
        await expect(
          page.getByRole('spinbutton', { name: 'Tối đa (VND)', exact: true }),
        ).toHaveValue('10000001');
        expect(attempts[0].body).toMatchObject({
          type: 'sell',
          asset: 'USDT',
          currency: 'VND',
          price: 25001,
          available: 1001,
          minLimit: 100001,
          maxLimit: 10000001,
          paymentMethods: ['Vietcombank'],
        });
        alert = page.getByRole('alert');
      } else {
        await expect(confirm).toBeEnabled();
        alert = dialog.getByRole('alert');
        if (kind === 'order') {
          await confirm.click();
          await expect.poll(() => failed).toBe(2);
          await expect(confirm).toBeEnabled();
          expect(attempts).toHaveLength(2);
          expect(attempts[0].body).toEqual({
            adId: 'ad001',
            asset: 'USDT',
            currency: 'VND',
            amount: 1000001 / 25350,
            fiatAmount: 1000001,
            paymentMethod: 'Vietcombank',
          });
          expect(attempts[1].body).toEqual(attempts[0].body);
          expect(attempts[1].key).toBe(attempts[0].key);
          await expect(
            page.getByRole('spinbutton', { name: 'Fiat amount', includeHidden: true }),
          ).toHaveValue('1000001');
        }
      }
      expect(attempts[0].key).toEqual(expect.any(String));
      expect(attempts[0].key!.length).toBeGreaterThanOrEqual(8);
      await expect(alert).toBeVisible();
      await expect(alert).toBeInViewport({ ratio: 1 });
      const feedback = await alert.evaluate((e) => {
        const r = e.getBoundingClientRect(),
          hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          hitsSelf: Boolean(hit && (e === hit || e.contains(hit))),
          text: e.textContent,
          top: r.top,
          bottom: r.bottom,
        };
      });
      expect(feedback.hitsSelf).toBe(true);
      const scan = await new AxeBuilder({ page })
        .include('[role="alert"]')
        .withRules(['color-contrast'])
        .analyze();
      expect(scan.violations).toHaveLength(0);
      expect(scan.incomplete).toHaveLength(0);
      await page.screenshot({
        path: info.outputPath('p2p-error.png'),
        fullPage: true,
        animations: 'disabled',
      });
      if (kind !== 'create') {
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
      }
      const observation = {
        kind,
        pendingFocusChecks,
        mode,
        attempts: attempts.map((a) => a.body),
        sameKey: kind === 'order' ? attempts[0].key === attempts[1].key : null,
        failed,
        feedback,
        contrast: { violations: scan.violations.length, incomplete: scan.incomplete.length },
        scope:
          'MSW held transport errors before original handler. No backend processing or durable idempotency proof; no same-key retry claim for create-ad/delete.',
      };
      await writeFile(info.outputPath('p2p-pending.json'), JSON.stringify(observation, null, 2));
      console.log('C06_P2P_PENDING', JSON.stringify(observation));
    });
}

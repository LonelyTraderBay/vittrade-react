import { expect, test, type Locator, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paint } from './helpers/semantic-control-paint';

async function open(page: Page, prefix: string, route: string, theme: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w/auth/login');
  await page
    .getByTestId('auth-email')
    .fill(route.startsWith('/wallet/') ? 'wallet@vittrade.local' : 'developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/w/home');
  if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
  await expect(page.locator('html')).toHaveClass(new RegExp('\\b' + theme + '\\b'));
  await page.setViewportSize({ width: prefix ? 1440 : 390, height: 900 });
  await page.evaluate(
    async ({ moduleUrl, target }) => {
      const { router } = await import(moduleUrl);
      await router.navigate(target);
    },
    { moduleUrl: '/src/app/router/index.ts', target: prefix + route },
  );
  await expect(page).toHaveURL(prefix + route);
}

async function measured(control: Locator, alpha: number, minimumHeight = 0) {
  await control.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  let result = await paint(control);
  const settleSamples: { supported: boolean; alpha: number | undefined }[] = [];
  await expect
    .poll(async () => {
      result = await paint(control);
      settleSamples.push({ supported: result.supported, alpha: result.nominalAlpha });
      return { supported: result.supported, alpha: result.nominalAlpha };
    })
    .toEqual({ supported: true, alpha });
  expect(result.nominalAlpha).toBe(alpha);
  expect(result.ratio).toBeGreaterThanOrEqual(4.5);
  expect(result.textWithin).toBe(true);
  expect(result.height).toBeGreaterThanOrEqual(minimumHeight);
  expect(result.hits).toEqual([true, true, true]);
  return { ...result, settleSamples };
}

for (const theme of ['light', 'dark'])
  for (const prefix of ['', '/w']) {
    for (const kind of ['transfer', 'history', 'p2p', 'profile']) {
      test(`Semantic controls ${kind} ${prefix || 'phone'} ${theme} @ui-mock`, async ({
        page,
      }, info) => {
        const route = {
          transfer: '/wallet/transfer',
          history: '/wallet/history',
          p2p: '/p2p/my-orders',
          profile: '/profile',
        }[kind]!;
        let writes = 0;
        page.on('request', (r) => {
          const p = new URL(r.url()).pathname;
          if (
            /POST|PATCH|PUT|DELETE/.test(r.method()) &&
            p.startsWith('/api/') &&
            !p.includes('/auth/')
          )
            writes++;
        });
        await open(page, prefix, route, theme);
        const rows: Awaited<ReturnType<typeof paint>>[] = [];
        let retainedFocus: boolean | null = null;
        if (kind === 'transfer') {
          const notice = page.getByText(/^Transfers may remain pending\./).locator('..');
          await expect(notice).toBeVisible();
          rows.push(await measured(notice, 20));
        } else if (kind === 'profile') {
          const logout = page.getByTestId('auth-sign-out');
          await expect(logout).toBeVisible();
          const result = await measured(logout, 18, 24);
          expect(result.borderStyle).toBe('solid');
          expect(result.borderWidth).toBe('1px');
          expect(result.borderAlpha).toBe(64);
          rows.push(result);
        } else {
          const group = page.getByRole('group', {
            name: kind === 'p2p' ? 'Order status' : 'Transaction type',
            exact: true,
          });
          const initial = group.getByRole('button', { pressed: true });
          await expect(initial).toHaveCount(1);
          const initialLabel = (await initial.innerText()).trim();
          rows.push(await measured(initial, 33, 36));
          const target = group.getByRole('button', {
            name: kind === 'p2p' ? 'Completed' : 'Withdrawal',
            exact: true,
          });
          const original = await target.elementHandle();
          await page.keyboard.press('Tab');
          await target.focus();
          const response =
            kind === 'history'
              ? page.waitForResponse(
                  (r) =>
                    new URL(r.url()).pathname.endsWith('/wallet/transactions') &&
                    new URL(r.url()).searchParams.get('type') === 'withdraw',
                )
              : null;
          await page.keyboard.press('Enter');
          if (response) {
            expect((await response).status()).toBe(200);
          }
          await expect(target).toHaveAttribute('aria-pressed', 'true');
          await expect(target).toBeFocused();
          retainedFocus = await original!.evaluate(
            (e) => e.isConnected && e === document.activeElement,
          );
          expect(retainedFocus).toBe(true);
          await expect(group.getByRole('button', { pressed: true })).toHaveCount(1);
          const active = await measured(target, 33, 36);
          expect(active.focusVisible).toBe(true);
          expect(active.outlineStyle).toBe('solid');
          expect(active.outlineWidth).toBe('2px');
          rows.push(active);
          await target.hover();
          rows.push(await measured(target, 33, 36));
          rows.push(
            await measured(
              group.getByRole('button', { name: initialLabel, exact: true, pressed: false }),
              255,
              36,
            ),
          );
          if (kind === 'history') {
            const statuses = page.getByRole('group', { name: 'Transaction status', exact: true });
            rows.push(await measured(statuses.getByRole('button', { pressed: true }), 33, 36));
          }
          await group.screenshot({
            path: info.outputPath('filter-group.png'),
            animations: 'disabled',
          });
        }
        expect(writes).toBe(0);
        await writeFile(
          info.outputPath('semantic-controls.json'),
          JSON.stringify({ theme, prefix, kind, rows, retainedFocus, writes }, null, 2),
        );
      });
    }
  }

test('Nominal contrast measurement rejects an isolated 1:1 control @ui-mock', async ({
  page,
}, info) => {
  await page.goto('/w/auth/login');
  await page.evaluate(() => {
    const control = document.createElement('button');
    control.type = 'button';
    control.id = 'contrast-negative-control';
    control.setAttribute('aria-hidden', 'true');
    control.textContent = 'Intentional unreadable calibration';
    Object.assign(control.style, {
      position: 'absolute',
      left: '-10000px',
      background: 'rgb(75, 85, 99)',
      color: 'rgb(75, 85, 99)',
    });
    document.body.append(control);
  });
  try {
    const result = await paint(page.locator('#contrast-negative-control'));
    expect(result.supported).toBe(true);
    expect(result.ratio).toBe(1);
    expect(result.ratio).toBeLessThan(4.5);
    await writeFile(
      info.outputPath('semantic-contrast-negative.json'),
      JSON.stringify({ kind: 'isolated measurement calibration, not product UI', result }, null, 2),
    );
  } finally {
    await page.locator('#contrast-negative-control').evaluate((e) => e.remove());
  }
});

test('Filter labels reflow under doubled text and user spacing on Phone320 @ui-mock', async ({
  page,
}, info) => {
  await open(page, '', '/wallet/history', 'light');
  await page.setViewportSize({ width: 320, height: 900 });
  const group = page.getByRole('group', { name: 'Transaction type', exact: true });
  await expect(group).toBeVisible();
  await page.addStyleTag({
    content:
      '[aria-label="Transaction type"] button span { font-size:26px!important;line-height:2!important;letter-spacing:.12em!important;word-spacing:.16em!important; }',
  });
  const target = group.getByRole('button', { name: 'Withdrawal', exact: true });
  await target.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  const layout = await target.evaluate((e) => {
    const label = e.querySelector('span')!,
      r = e.getBoundingClientRect(),
      lr = label.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    return {
      width: r.width,
      height: r.height,
      font: getComputedStyle(label).fontSize,
      labelHeight: lr.height,
      textWithin:
        text.left >= lr.left - 1 &&
        text.right <= lr.right + 1 &&
        text.top >= lr.top - 1 &&
        text.bottom <= lr.bottom + 1,
      withinViewport: r.left >= 0 && r.right <= innerWidth,
      clipped: label.scrollWidth > label.clientWidth + 1,
    };
  });
  expect(layout.font).toBe('26px');
  expect(layout.height).toBeGreaterThan(36);
  expect(layout.textWithin).toBe(true);
  expect(layout.withinViewport).toBe(true);
  expect(layout.clipped).toBe(false);
  await target.screenshot({
    path: info.outputPath('filter-text-spacing.png'),
    animations: 'disabled',
  });
  await writeFile(
    info.outputPath('filter-text-spacing.json'),
    JSON.stringify(
      { kind: 'CSS text-size/spacing stress, not browser zoom or a new locale', layout },
      null,
      2,
    ),
  );
});

import { test, expect, type Page, type Locator } from '@playwright/test';
import { resizeAuthenticatedHome } from './helpers/resize-home';
import { paint } from './helpers/semantic-control-paint';
import { writeFile } from 'node:fs/promises';
interface FilterOwner {
  id: string;
  phone: string;
  web: string;
  groups: readonly string[];
  wallet?: boolean;
}
// Actual source consumers:10 JSX groups in7files. Analytics retains its registered Web route at390px.
const owners: readonly FilterOwner[] = [
  {
    id: 'portfolio',
    phone: '/wallet/portfolio-analytics',
    web: '/w/portfolio/analytics',
    groups: ['Analytics period'],
    wallet: true,
  },
  {
    id: 'history',
    phone: '/wallet/history',
    web: '/w/wallet/history',
    groups: ['Transaction type', 'Transaction status'],
    wallet: true,
  },
  {
    id: 'analytics',
    phone: '/w/trade/analytics',
    web: '/w/trade/analytics',
    groups: ['Analytics period', 'Analytics view'],
  },
  {
    id: 'leaderboard',
    phone: '/trade/copy-trading/leaderboard',
    web: '/w/trade/copy-trading/leaderboard',
    groups: ['Sắp xếp bảng xếp hạng', 'Rủi ro provider'],
  },
  { id: 'copy', phone: '/trade/copy-trading', web: '/w/trade/copy', groups: ['Sắp xếp provider'] },
  {
    id: 'disputes',
    phone: '/p2p/disputes',
    web: '/w/p2p/disputes',
    groups: ['Lọc trạng thái tranh chấp'],
  },
  { id: 'orders', phone: '/p2p/my-orders', web: '/w/p2p/my-orders', groups: ['Order status'] },
];
/** CSS mapping frames, not ThemeProvider/OS persistence or every page state. */
async function frameMapping(page: Page, button: Locator) {
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await button.focus();
  const original = await button.elementHandle();
  if (!original) throw Error('Missing actual filter');
  await button.evaluate(async (e) => {
    await document.fonts.ready;
    const all: Animation[] = [];
    for (let n: Element | null = e; n; n = n.parentElement) all.push(...n.getAnimations());
    await Promise.all(
      all
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    );
  });
  const originalClass = await page.locator('html').getAttribute('class'),
    pressed = await button.getAttribute('aria-pressed'),
    rows = [];
  try {
    const initial = (originalClass ?? '').split(/\s+/).includes('light');
    for (const light of [!initial, initial]) {
      await page.locator('html').evaluate((html, light) => {
        html.classList.toggle('light', light);
        html.classList.toggle('dark', !light);
      }, light);
      for (let frame = 0; frame < 120; frame++) {
        const measured = await paint(button);
        const transitions = await button.evaluate((e) => {
          const result = [];
          for (let n: Element | null = e; n; n = n.parentElement)
            for (const a of n.getAnimations())
              if (
                a instanceof CSSTransition &&
                ['color', 'background-color', 'opacity', 'filter'].includes(a.transitionProperty) &&
                ['running', 'pending'].includes(a.playState)
              )
                result.push(a.transitionProperty);
          return result;
        });
        rows.push({ light, frame, measured, transitions });
        if (!transitions.length) break;
        if (frame === 119) throw Error('Theme paint transitions did not finish');
        await page.evaluate(
          () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
        );
      }
    }
  } finally {
    await page.locator('html').evaluate((html, cls) => {
      html.setAttribute('class', cls ?? '');
    }, originalClass);
  }
  const connectedFocused = await original.evaluate(
    (e) => e.isConnected && document.activeElement === e,
  );
  expect(connectedFocused).toBe(true);
  await expect(button).toHaveAttribute('aria-pressed', pressed!);
  return { pressed, connectedFocused, rows };
}
for (const theme of ['light', 'dark'])
  for (const width of [390, 1440])
    for (const owner of owners)
      test(`Filter motion ${owner.id} ${width} ${theme} @ui-mock`, async ({ page }, info) => {
        let writes = 0;
        page.on('request', (r) => {
          if (
            !['GET', 'HEAD', 'OPTIONS'].includes(r.method()) &&
            !new URL(r.url()).pathname.includes('/auth/')
          )
            writes++;
        });
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/w/auth/login');
        await page
          .getByTestId('auth-email')
          .fill(owner.wallet ? 'wallet@vittrade.local' : 'developer@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(page).toHaveURL('/w/home');
        if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
        await resizeAuthenticatedHome(page, { width, height: 900 });
        const target = width === 390 ? owner.phone : owner.web;
        await page.evaluate(
          async ({ target, moduleUrl }) => {
            const { router } = await import(moduleUrl);
            await router.navigate(target);
          },
          { target, moduleUrl: '/src/app/router/index.ts' },
        );
        await expect(page).toHaveURL(target);
        const results = [];
        for (const name of owner.groups) {
          const group = page.getByRole('group', { name, exact: true });
          await expect(group).toBeVisible();
          for (const selected of [true, false]) {
            const button = group.getByRole('button', { pressed: selected }).first();
            await expect(button).toBeVisible();
            results.push({ group: name, selected, data: await frameMapping(page, button) });
          }
        }
        const all = results.flatMap((x) => x.data.rows),
          minimumRatio = Math.min(...all.map((x) => x.measured.ratio ?? 0)),
          unsupported = all.filter((x) => !x.measured.supported);
        const data = {
          owner: owner.id,
          theme,
          width,
          target,
          results,
          frameCount: all.length,
          minimumRatio,
          unsupported: unsupported.length,
          writes,
        };
        await writeFile(info.outputPath('filter-motion.json'), JSON.stringify(data, null, 2));
        console.log(
          'C06_FILTER_MOTION',
          JSON.stringify({
            owner: owner.id,
            theme,
            width,
            targets: results.length,
            frames: all.length,
            minimumRatio,
            unsupported: unsupported.length,
            writes,
          }),
        );
        await page.screenshot({ path: info.outputPath('filter-motion.png') });
        expect(writes).toBe(0);
        expect(unsupported).toHaveLength(0);
        expect(minimumRatio).toBeGreaterThanOrEqual(4.5);
      });

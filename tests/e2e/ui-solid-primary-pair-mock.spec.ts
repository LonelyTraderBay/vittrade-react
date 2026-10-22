import { expect, test, type Page, type Locator, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { measureButtonPaint } from './helpers/button-paint';
import { paint } from './helpers/semantic-control-paint';

async function ready(page: Page, theme: string, width: number) {
  let writes = 0;
  page.on('request', (request) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method()) &&
      !new URL(request.url()).pathname.includes('/auth/')
    )
      writes++;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w/auth/login');
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/w/home');
  if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
  await page.setViewportSize({ width, height: 900 });
  return () => writes;
}
async function navigate(page: Page, target: string) {
  await page.evaluate(
    async ({ target, moduleUrl }) => {
      const { router } = await import(moduleUrl);
      await router.navigate(target);
    },
    { target, moduleUrl: '/src/app/router/index.ts' },
  );
  await expect(page).toHaveURL(target);
}
async function settle(button: Locator) {
  await button.evaluate(async (element) => {
    await document.fonts.ready;
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    );
  });
}
async function statePaint(page: Page, button: Locator, info: TestInfo, name: string, icon = false) {
  await settle(button);
  await expect(button).toBeVisible();
  const colors = await button.evaluate((element) => {
    const css = getComputedStyle(element),
      canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const rgba = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const rect = element.getBoundingClientRect();
    const clip = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    const clippingAncestors = [];
    for (let node = element.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node),
        bounds = node.getBoundingClientRect();
      if (style.clipPath !== 'none') throw Error('Unsupported clipping path');
      const x = bounds.width / (node.offsetWidth || bounds.width || 1);
      const y = bounds.height / (node.offsetHeight || bounds.height || 1);
      const client = {
        left: bounds.left + node.clientLeft * x,
        top: bounds.top + node.clientTop * y,
        right: bounds.left + (node.clientLeft + node.clientWidth) * x,
        bottom: bounds.top + (node.clientTop + node.clientHeight) * y,
      };
      if (/auto|hidden|clip|scroll/.test(style.overflowX)) {
        clip.left = Math.max(clip.left, client.left);
        clip.right = Math.min(clip.right, client.right);
      }
      if (/auto|hidden|clip|scroll/.test(style.overflowY)) {
        clip.top = Math.max(clip.top, client.top);
        clip.bottom = Math.min(clip.bottom, client.bottom);
      }
      if (/auto|hidden|clip|scroll/.test(style.overflowX + style.overflowY))
        clippingAncestors.push({ tag: node.tagName, className: node.className, client });
    }
    // IntersectionObserver ratios use float precision and can round a transformed full box below1.
    // Enforce all actual CSS-pixel bounds instead; no ratio tolerance or recovery scroll.
    const outside = [
      clip.left - rect.left,
      clip.top - rect.top,
      rect.right - clip.right,
      rect.bottom - clip.bottom,
    ].map((n) => Math.max(0, n));
    return {
      foreground: rgba(css.color),
      semantic: rgba(css.getPropertyValue('--tr-text-on-color')),
      background: rgba(css.backgroundColor),
      primary: rgba(css.getPropertyValue('--tr-primary')),
      height: rect.height,
      width: rect.width,
      outside,
      clippingAncestors,
      clip,
      focusVisible: element.matches(':focus-visible'),
      outlineStyle: css.outlineStyle,
      outlineWidth: parseFloat(css.outlineWidth),
      transitionProperty: css.transitionProperty,
      hits: [0.1, 0.5, 0.9].map((f) => {
        const hit = document.elementFromPoint(rect.x + rect.width * f, rect.y + rect.height / 2);
        return hit === element || Boolean(hit && element.contains(hit));
      }),
    };
  });
  const diagnosticIconPaint = icon ? await paint(button) : null;
  await writeFile(
    info.outputPath(name + '-computed.json'),
    JSON.stringify({ colors, diagnosticIconPaint }, null, 2),
  );
  expect(colors.outside).toEqual([0, 0, 0, 0]);
  expect(colors.transitionProperty.split(',').map((p) => p.trim())).not.toEqual(
    expect.arrayContaining(['all']),
  );
  expect(colors.transitionProperty.split(',').map((p) => p.trim())).not.toEqual(
    expect.arrayContaining(['color']),
  );
  expect(colors.transitionProperty.split(',').map((p) => p.trim())).not.toEqual(
    expect.arrayContaining(['background-color']),
  );
  expect(colors.foreground).toEqual(colors.semantic);
  expect(colors.background).toEqual(colors.primary);
  expect(colors.width).toBeGreaterThanOrEqual(24);
  expect(colors.height).toBeGreaterThanOrEqual(24);
  expect(colors.hits).toEqual([true, true, true]);
  await button.screenshot({ path: info.outputPath(name + '-actual.png'), animations: 'allow' });
  let measured;
  if (icon) {
    const svg = button.locator('svg');
    expect(await svg.evaluate((e) => getComputedStyle(e).stroke)).toBe(
      await button.evaluate((e) => getComputedStyle(e).color),
    );
    measured = await paint(button);
    expect(measured.supported, measured.reason).toBe(true);
    expect(measured.ratio).toBeGreaterThanOrEqual(3);
  } else {
    measured = await measureButtonPaint(page, button, info, name);
    expect(measured.minimumRatio).toBeGreaterThanOrEqual(4.5);
  }
  return {
    colors,
    measured,
    criterion: icon ? '1.4.11 non-text essential icon: 3:1' : '1.4.3 normal text: 4.5:1',
  };
}
async function interactions(
  page: Page,
  button: Locator,
  info: TestInfo,
  name: string,
  icon = false,
) {
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const normal = await statePaint(page, button, info, name + '-normal', icon);
  await button.hover();
  const hover = await statePaint(page, button, info, name + '-hover', icon);
  await page.mouse.move(0, 0);
  await button.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(button).toBeFocused();
  const focus = await statePaint(page, button, info, name + '-focus', icon);
  expect(focus.colors.focusVisible).toBe(true);
  expect(focus.colors.outlineStyle).not.toBe('none');
  expect(focus.colors.outlineWidth).toBeGreaterThan(0);
  await button.hover();
  await page.mouse.down();
  let active;
  try {
    expect(await button.evaluate((e) => e.matches(':active'))).toBe(true);
    active = await statePaint(page, button, info, name + '-active', icon);
  } finally {
    // Release outside the target, so paint observation itself cannot trigger the action.
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
  return { normal, hover, focus, active };
}
/** Sample actual CSS color transitions in both directions; this checks mapping, not theme persistence. */
async function themeFrames(button: Locator, info: TestInfo, name: string) {
  await settle(button);
  const data = await button.evaluate(async (element) => {
    const html = document.documentElement,
      original = html.className;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const rgba = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const luminance = (rgb: number[]) =>
      rgb
        .slice(0, 3)
        .map((n) => n / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
        .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
    const rows = [];
    try {
      const initial = html.classList.contains('light');
      for (const light of [!initial, initial]) {
        html.classList.toggle('light', light);
        html.classList.toggle('dark', !light);
        for (let frame = 0; frame < 120; frame++) {
          const css = getComputedStyle(element);
          if (css.filter !== 'none' || css.opacity !== '1' || css.backgroundImage !== 'none')
            throw Error('Unsupported frame paint');
          const foreground = rgba(css.color),
            background = rgba(css.backgroundColor);
          if (foreground[3] !== 255 || background[3] !== 255) throw Error('Translucent frame');
          const a = luminance(foreground),
            b = luminance(background);
          const transitions = element
            .getAnimations()
            .filter(
              (animation) =>
                animation instanceof CSSTransition &&
                ['color', 'background-color'].includes(animation.transitionProperty) &&
                ['running', 'pending'].includes(animation.playState),
            );
          rows.push({
            light,
            frame,
            foreground,
            background,
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            transitionProperty: css.transitionProperty,
          });
          if (!transitions.length) break;
          if (frame === 119) throw Error('Color transition did not finish');
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }
    } finally {
      html.className = original;
    }
    return rows;
  });
  await writeFile(info.outputPath(name + '-theme-frames.json'), JSON.stringify(data, null, 2));
  expect(data.length).toBeGreaterThanOrEqual(2);
  expect(Math.min(...data.map((row) => row.ratio))).toBeGreaterThanOrEqual(4.5);
  return data;
}
const profiles = [
  { name: 'phone', width: 390, prefix: '' },
  { name: 'web', width: 1440, prefix: '/w' },
] as const;
for (const theme of ['light', 'dark'])
  for (const profile of profiles) {
    for (const kind of [
      'trader',
      'provider',
      'education',
      'configuration',
      'wallet',
      'lazy',
    ] as const) {
      test(`Solid primary pair ${kind} ${profile.name} ${theme} @ui-mock`, async ({
        page,
      }, info) => {
        const writes = await ready(page, theme, profile.width);
        const provider =
          profile.prefix +
          (profile.name === 'web' ? '/trade/copy/provider/ct001' : '/trade/copy-provider/ct001');
        const observations: unknown[] = [];
        if (kind === 'lazy') {
          // Public component rendered with a synthetic failing importer, not a production route outage.
          const main = await (await page.request.get('/src/main.tsx')).text();
          const context = await (await page.request.get('/src/app/contexts/UIContext.tsx')).text();
          const domUrl = main.match(/from ["']([^"']*react-dom_client[^"']*)["']/)?.[1];
          const reactUrl = context.match(/from ["']([^"']*\/react\.js[^"']*)["']/)?.[1];
          if (!domUrl || !reactUrl) throw Error('Missing actual optimized React dependency');
          await page.evaluate(
            async ({ reactUrl, domUrl, lazyUrl }) => {
              const [R, D, { LazyRoute }] = await Promise.all([
                import(reactUrl),
                import(domUrl),
                import(lazyUrl),
              ]);
              const react = R.default || R,
                root = document.createElement('div');
              root.id = 'solid-primary-lazy';
              root.style.cssText =
                'position:fixed;inset:0;z-index:2147483647;overflow:auto;background:var(--tr-bg)';
              document.body.appendChild(root);
              let attempts = 0;
              const load = async () => {
                attempts++;
                (window as unknown as { solidPrimaryAttempts: number }).solidPrimaryAttempts =
                  attempts;
                if (attempts <= 4) throw new Error('synthetic-module-unavailable');
                return {
                  default: () => react.createElement('p', {}, 'Synthetic destination recovered'),
                };
              };
              (D.default || D).createRoot(root).render(react.createElement(LazyRoute, { load }));
            },
            { reactUrl, domUrl, lazyUrl: '/src/shared/ui/LazyRoute.tsx' },
          );
          const retry = page
            .locator('#solid-primary-lazy')
            .getByRole('button', { name: 'Thử lại', exact: true });
          await expect(retry).toBeVisible();
          observations.push(await interactions(page, retry, info, kind));
          expect(
            await page.evaluate(
              () => (window as unknown as { solidPrimaryAttempts: number }).solidPrimaryAttempts,
            ),
          ).toBe(4);
          await retry.focus();
          await page.keyboard.press('Enter');
          await expect(
            page.getByText('Synthetic destination recovered', { exact: true }),
          ).toBeVisible();
          expect(
            await page.evaluate(
              () => (window as unknown as { solidPrimaryAttempts: number }).solidPrimaryAttempts,
            ),
          ).toBe(5);
        } else {
          const routes = {
            trader: profile.prefix + '/trade/trader/ct001',
            provider,
            education:
              profile.prefix +
              (profile.name === 'web' ? '/trade/copy/education' : '/trade/copy-trading/education'),
            configuration: provider + '/configuration',
            wallet: profile.prefix + '/wallet/transfer',
          };
          await navigate(page, routes[kind]);
          const labels = {
            trader: 'Xem cấu hình copy',
            provider: 'Đánh giá trước khi copy',
            education: 'Xem danh sách providers',
            configuration: 'Xem xác nhận',
            wallet: 'Swap wallets',
          };
          const button = page.getByRole('button', { name: labels[kind], exact: true });
          await expect(button).toBeEnabled();
          observations.push(await interactions(page, button, info, kind, kind === 'wallet'));
          if (kind === 'configuration') {
            for (const mode of ['mirror', 'fixed', 'smart']) {
              const selected = page.getByRole('button', { name: mode, exact: true });
              await selected.click();
              observations.push(await interactions(page, selected, info, 'mode-' + mode));
            }
            const capital = page.getByLabel('Số vốn copy (USD)', { exact: true });
            await capital.fill('0');
            await expect(button).toBeDisabled();
            await expect(page.getByText('Vốn copy phải lớn hơn 0.', { exact: true })).toBeVisible();
            // Inactive controls are outside 1.4.3 contrast; retain the disabled guard and draft.
            await capital.fill('5000');
            await expect(button).toBeEnabled();
            await button.focus();
            await page.keyboard.press('Enter');
            await expect(page).toHaveURL(provider + '/confirmation');
            const state = await page.evaluate(() => window.history.state.usr);
            expect(state).toMatchObject({
              providerId: 'ct001',
              capital: 5000,
              copyMode: 'smart',
              positionSizing: 'percentage',
              copyRatio: 50,
            });
          } else if (kind === 'wallet') {
            const from = page.getByLabel('From wallet', { exact: true }),
              to = page.getByLabel('To wallet', { exact: true });
            const before = { from: await from.inputValue(), to: await to.inputValue() };
            await button.focus();
            await page.keyboard.press('Enter');
            await expect(from).toHaveValue(before.to);
            await expect(to).toHaveValue(before.from);
          } else {
            observations.push(await themeFrames(button, info, kind));
            await button.focus();
            await page.keyboard.press('Enter');
            const target =
              kind === 'trader'
                ? profile.prefix + '/trade/copy-provider/ct001/configuration'
                : kind === 'provider'
                  ? provider + '/assessment'
                  : profile.prefix + '/trade/copy-trading';
            await expect(page).toHaveURL(target);
          }
        }
        expect(writes()).toBe(0);
        await writeFile(
          info.outputPath('solid-primary-paint.json'),
          JSON.stringify(
            {
              theme,
              profile,
              kind,
              observations,
              businessWrites: writes(),
              scope:
                kind === 'lazy'
                  ? 'isolated public LazyRoute with synthetic importer'
                  : 'production route using shipped MSW fixture',
            },
            null,
            2,
          ),
        );
        console.log(
          'C06_SOLID_PRIMARY_PAIR',
          JSON.stringify({
            theme,
            profile: profile.name,
            kind,
            observationGroups: observations.length,
            businessWrites: writes(),
          }),
        );
      });
    }
  }

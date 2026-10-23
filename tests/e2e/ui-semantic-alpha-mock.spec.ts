import { resizeAuthenticatedHome } from './helpers/resize-home';
import { expect, test, type Page, type Locator, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

async function login(page: Page, theme: string, width: number, email = 'developer@vittrade.local') {
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
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/w/home');
  if (theme === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
  await resizeAuthenticatedHome(page, { width, height: 900 });
  return () => writes;
}
async function navigate(page: Page, target: string) {
  await page.evaluate(
    async ({ target, routerUrl }) => {
      const { router } = await import(routerUrl);
      await router.navigate(target);
    },
    { target, routerUrl: '/src/app/router/index.ts' },
  );
  await expect(page).toHaveURL(target);
}
async function alpha(target: Locator) {
  return target.evaluate((e) => {
    const css = getComputedStyle(e),
      canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = css.backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    return { background: css.backgroundColor, alpha: ctx.getImageData(0, 0, 1, 1).data[3] / 255 };
  });
}
/** Native background calibration, with the untouched screenshot retained separately.
 * Text alone is made transparent for this measurement, never for visual baselines.
 * Sampling uses actual text bounds over the real ancestor gradients, including hero cards.
 */
async function contrast(page: Page, target: Locator, info: TestInfo, name: string) {
  await target.evaluate((e) =>
    e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }),
  );
  await expect(target).toBeInViewport({ ratio: 1 });
  await target.evaluate(async (root) => {
    await Promise.all(
      root
        .getAnimations({ subtree: true })
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    );
  });
  const original = await target.screenshot();
  await writeFile(info.outputPath(name + '-actual.png'), original);
  const text = await target.evaluate((root) => {
    const rect = root.getBoundingClientRect(),
      rows = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent?.trim()) continue;
      const css = getComputedStyle(node.parentElement!);
      if (css.textShadow !== 'none') throw Error('Unsupported text shadow');
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects())
        rows.push({
          x: r.x - rect.x,
          y: r.y - rect.y,
          width: r.width,
          height: r.height,
          color: css.color,
          size: parseFloat(css.fontSize),
          weight: Number(css.fontWeight),
        });
    }
    for (let e: Element | null = root; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.opacity !== '1' || s.filter !== 'none' || s.mixBlendMode !== 'normal')
        throw Error('Unsupported group opacity/filter/blend');
    }
    return { width: rect.width, height: rect.height, rows };
  });
  expect(text.rows.length).toBeGreaterThan(0);
  const handle = await target.elementHandle();
  if (!handle) throw Error('Missing paint target');
  const saved = await handle.evaluate((root) => {
    const parents = new Set<HTMLElement>();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode())
      if (walker.currentNode.textContent?.trim()) parents.add(walker.currentNode.parentElement!);
    return [...parents].map((e) => {
      const style = e.getAttribute('style');
      e.style.setProperty('transition', 'none', 'important');
      e.style.setProperty('color', 'transparent', 'important');
      e.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      return { style };
    });
  });
  let background: Buffer;
  try {
    background = await target.screenshot();
  } finally {
    await handle.evaluate((root, saved) => {
      const parents = new Set<HTMLElement>();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode())
        if (walker.currentNode.textContent?.trim()) parents.add(walker.currentNode.parentElement!);
      [...parents].forEach((e, i) => {
        const value = saved[i].style;
        if (value === null) e.removeAttribute('style');
        else e.setAttribute('style', value);
      });
    }, saved);
  }
  await target.evaluate(async (root) => {
    await Promise.all(
      root
        .getAnimations({ subtree: true })
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    );
  });
  await writeFile(info.outputPath(name + '-native-background.png'), background);
  const measured = await page.evaluate(
    async ({ png, text }) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + png;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const swatch = document.createElement('canvas');
      swatch.width = swatch.height = 1;
      const color = swatch.getContext('2d')!;
      const lum = (a: ArrayLike<number>) =>
        [0.2126, 0.7152, 0.0722].reduce((v, k, i) => {
          const n = a[i] / 255;
          return v + k * (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
        }, 0);
      const results = [];
      for (const r of text.rows) {
        color.clearRect(0, 0, 1, 1);
        color.fillStyle = r.color;
        color.fillRect(0, 0, 1, 1);
        const fg = color.getImageData(0, 0, 1, 1).data;
        if (fg[3] !== 255) throw Error('Unsupported translucent text');
        const foreground = lum(fg);
        let minimum = Infinity,
          count = 0;
        const sx = canvas.width / text.width,
          sy = canvas.height / text.height;
        for (
          let y = Math.max(0, Math.floor(r.y * sy));
          y < Math.min(canvas.height, Math.ceil((r.y + r.height) * sy));
          y++
        )
          for (
            let x = Math.max(0, Math.floor(r.x * sx));
            x < Math.min(canvas.width, Math.ceil((r.x + r.width) * sx));
            x++
          ) {
            const n = (y * canvas.width + x) * 4;
            if (pixels.data[n + 3] !== 255) throw Error('Nonopaque native background');
            const bg = lum(pixels.data.subarray(n, n + 3));
            minimum = Math.min(
              minimum,
              (Math.max(bg, foreground) + 0.05) / (Math.min(bg, foreground) + 0.05),
            );
            count++;
          }
        const required = r.size >= 24 || (r.size >= 18.6667 && r.weight >= 700) ? 3 : 4.5;
        results.push({ minimum, required, count, size: r.size, weight: r.weight });
      }
      return results;
    },
    { png: background.toString('base64'), text },
  );
  await writeFile(
    info.outputPath(name + '-contrast.json'),
    JSON.stringify({ testTitle: info.title, name, text, measured }, null, 2),
  );
  console.log(
    'C06_ALPHA_NATIVE_CONTRAST',
    JSON.stringify({ testTitle: info.title, name, measured }),
  );
  for (const row of measured) {
    expect(row.count).toBeGreaterThan(0);
    expect(row.minimum).toBeGreaterThanOrEqual(row.required);
  }
  return measured;
}

for (const theme of ['light', 'dark'])
  for (const profile of [
    { name: 'phone', prefix: '', width: 390 },
    { name: 'web', prefix: '/w', width: 1440 },
  ]) {
    for (const kind of ['copy', 'provider', 'trader', 'education', 'dca', 'dca-readonly'])
      test(`Semantic alpha ${kind} ${profile.name} ${theme} @ui-mock`, async ({ page }, info) => {
        const writes = await login(
          page,
          theme,
          profile.width,
          kind === 'dca' ? 'dca@vittrade.local' : 'developer@vittrade.local',
        );
        const path =
          kind === 'copy'
            ? profile.name === 'web'
              ? '/trade/copy'
              : '/trade/copy-trading'
            : kind === 'provider'
              ? profile.name === 'web'
                ? '/trade/copy/provider/ct001'
                : '/trade/copy-provider/ct001'
              : kind === 'trader'
                ? '/trade/trader/ct001'
                : kind === 'education'
                  ? profile.name === 'web'
                    ? '/trade/copy/education'
                    : '/trade/copy-trading/education'
                  : '/earn/savings/dca';
        const target = profile.prefix + path;
        await navigate(page, target);
        if (kind === 'dca' || kind === 'dca-readonly')
          await expect(
            page.getByRole('button', { name: 'Cancel', exact: true }).first(),
          ).toBeVisible();
        else if (kind === 'education')
          await expect(
            page.getByText('Copy Trading hoạt động như thế nào?', { exact: true }),
          ).toBeVisible();
        else await expect(page.getByText('AlphaHunter_VN', { exact: true }).first()).toBeVisible();
        const elements =
          kind === 'dca' || kind === 'dca-readonly'
            ? page.getByRole('button', { name: 'Cancel', exact: true })
            : page.locator(
                kind === 'copy'
                  ? '.w-11.h-11.rounded-full'
                  : kind === 'provider'
                    ? '.h-12.w-12.rounded-full'
                    : kind === 'trader'
                      ? '.w-14.h-14.rounded-2xl'
                      : '.w-10.h-10.rounded-full',
              );
        const expected =
          kind === 'copy'
            ? 5
            : kind === 'education'
              ? 4
              : kind === 'dca' || kind === 'dca-readonly'
                ? 3
                : 1;
        await expect(elements).toHaveCount(expected);
        const observations = [];
        for (let i = 0; i < expected; i++) {
          const element = elements.nth(i),
            value = await alpha(element);
          observations.push(value);
          expect(value.alpha).toBeCloseTo(
            kind === 'dca' || kind === 'dca-readonly' || kind === 'education' ? 0.08 : 0.13,
            2,
          );
          if (kind === 'dca-readonly') {
            // WCAG 1.4.3 excludes inactive controls; alpha validity and UI permission guard still apply.
            await expect(element).toBeDisabled();
          } else {
            if (kind === 'dca') await expect(element).toBeEnabled();
            await contrast(page, element, info, kind + '-' + i);
          }
        }
        await page.screenshot({ path: info.outputPath('alpha-page.png') });
        expect(writes()).toBe(0);
        console.log(
          'C06_SEMANTIC_ALPHA',
          JSON.stringify({
            kind,
            theme,
            profile,
            target,
            observations,
            writes: writes(),
            scope:
              'Actual route and shippedMSW, native computed alpha/contrast over real backgrounds; read-only, not all aliases/roles/states/backend/UAT/AT.',
          }),
        );
      });
    test(`Semantic alpha chart ${profile.name} ${theme} @ui-mock`, async ({ page }, info) => {
      const writes = await login(page, theme, profile.width),
        code = await (await page.request.get('/src/dev/mocks/handlers.ts')).text(),
        dependencyUrl = code.match(/from ["']([^"']*\/msw\.js[^"']*)["']/)?.[1];
      if (!dependencyUrl) throw Error('Missing actual MSW dependency');
      await page.evaluate(
        async ({ dependencyUrl, workerUrl }) => {
          const { worker } = await import(workerUrl);
          const { http } = await import(dependencyUrl);
          worker.use(
            http.get('*/market/pairs/:pairId/candles', async () => {
              document.documentElement.dataset.c06AlphaWaiting = 'true';
              await new Promise<void>((r) =>
                window.addEventListener('c06-alpha-release', () => r(), { once: true }),
              );
              delete document.documentElement.dataset.c06AlphaWaiting;
            }),
          );
        },
        { dependencyUrl, workerUrl: '/src/dev/mocks/browser.ts' },
      );
      let image;
      try {
        await navigate(page, profile.prefix + '/trade/btcusdt');
        await expect(page.locator('html')).toHaveAttribute('data-c06-alpha-waiting', 'true');
        const shimmer = page.locator('.shimmer').first();
        await expect(shimmer).toBeVisible();
        image = await shimmer.evaluate((e) => getComputedStyle(e).backgroundImage);
        expect(image).not.toBe('none');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const motion = await shimmer.evaluate((e) => ({
          duration: getComputedStyle(e).animationDuration,
          iterations: getComputedStyle(e).animationIterationCount,
        }));
        expect(parseFloat(motion.duration)).toBeLessThanOrEqual(0.00001);
        expect(motion.iterations).toBe('1');
        await page.screenshot({ path: info.outputPath('alpha-chart-loading.png') });
      } finally {
        await page.evaluate(() => window.dispatchEvent(new Event('c06-alpha-release')));
      }
      await expect(page.locator('.shimmer')).toHaveCount(0);
      expect(writes()).toBe(0);
      console.log(
        'C06_SEMANTIC_ALPHA',
        JSON.stringify({
          kind: 'chart',
          theme,
          profile,
          image,
          writes: writes(),
          scope:
            'Actual loading branch with held/released candle GET; global reduced motion preserved. Chart palette/data/AT/backend acceptance separate.',
        }),
      );
    });
    test(`Semantic alpha isolated ${profile.name} ${theme} @ui-mock`, async ({ page }, info) => {
      const writes = await login(page, theme, profile.width),
        main = await (await page.request.get('/src/main.tsx')).text(),
        context = await (await page.request.get('/src/app/contexts/UIContext.tsx')).text(),
        domUrl = main.match(/from ["']([^"']*react-dom_client[^"']*)["']/)?.[1],
        reactUrl = context.match(/from ["']([^"']*\/react\.js[^"']*)["']/)?.[1];
      if (!domUrl || !reactUrl) throw Error('Missing actual optimized React dependency');
      await page.evaluate(
        async ({ domUrl, reactUrl, modules }) => {
          const R = await import(reactUrl),
            D = await import(domUrl),
            { TimeframePills } = await import(modules.timeframe),
            { IssueComparisonTable } = await import(modules.issue),
            { ExecutionReport } = await import(modules.execution);
          const root = document.createElement('div');
          root.id = 'c06-alpha-components';
          root.style.cssText =
            'position:fixed;inset:0;z-index:2147483647;overflow:auto;background:var(--tr-bg);padding:24px';
          document.body.appendChild(root);
          const h = (R.default || R).createElement;
          (D.default || D).createRoot(root).render(
            h(
              'div',
              {},
              h(
                'section',
                { 'data-probe': 'timeframe' },
                h(TimeframePills, { active: '1h', onChange: () => {} }),
              ),
              h('section', { 'data-probe': 'issue' }, h(IssueComparisonTable)),
              h(
                'section',
                { 'data-probe': 'execution' },
                h(ExecutionReport, {
                  data: {
                    orderId: 'synthetic-alpha',
                    symbol: 'BTC/USDT',
                    side: 'buy',
                    requestedAmount: 1,
                    filledAmount: 1,
                    fills: [
                      {
                        venue: 'Synthetic',
                        amount: 1,
                        price: 100,
                        fee: 0,
                        timestamp: '2026-10-01T00:00:00.000Z',
                      },
                    ],
                    expectedPrice: 100,
                    averageFillPrice: 100,
                    bestAvailablePrice: 100,
                    submittedAt: '2026-10-01T00:00:00.000Z',
                    completedAt: '2026-10-01T00:00:01.000Z',
                    executionTimeMs: 1000,
                    slippagePct: 0,
                    savingsVsSingleVenue: 0,
                    executionQuality: 'A',
                  },
                }),
              ),
            ),
          );
        },
        {
          domUrl,
          reactUrl,
          modules: {
            timeframe: '/src/features/trading/components/TimeframeSelector.tsx',
            issue: '/src/dev/legacy/demo/IssueComparisonTable.tsx',
            execution: '/src/dev/legacy/trading/components/ExecutionReport.tsx',
          },
        },
      );
      const timeframe = page.locator('[data-probe="timeframe"] button');
      await expect(timeframe).toHaveCount(3);
      await expect(
        page.locator('[data-probe="execution"]').getByText('Synthetic', { exact: true }),
      ).toBeAttached();
      const targets = [
        { kind: 'timeframe-day', locator: timeframe.filter({ hasText: '1D' }), expected: 0.5 },
        { kind: 'timeframe-week', locator: timeframe.filter({ hasText: '1W' }), expected: 0.5 },
        {
          kind: 'issue',
          locator: page.locator('[data-probe="issue"] .grid.grid-cols-4 > div').first(),
          expected: 0.08,
        },
        {
          kind: 'execution',
          locator: page.locator('[data-probe="execution"] .w-5.h-5.rounded'),
          expected: 0.13,
        },
      ];
      const values = [];
      for (const t of targets)
        values.push({ kind: t.kind, ...(await alpha(t.locator)), expected: t.expected });
      console.log(
        'C06_SEMANTIC_ALPHA_ISOLATED',
        JSON.stringify({ theme, profile, values, writes: writes() }),
      );
      for (let i = 0; i < targets.length; i++) {
        expect(values[i].alpha).toBeCloseTo(targets[i].expected, 2);
        await contrast(page, targets[i].locator, info, targets[i].kind);
      }
      expect(writes()).toBe(0);
    });
  }

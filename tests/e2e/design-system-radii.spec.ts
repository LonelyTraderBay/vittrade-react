import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'vite';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { VitRadii, type VitRadius } from '../../src/shared/theme/radii';

test('measures actual TrCard markup against built CSS in both themes', async ({
  page,
}, testInfo) => {
  // Playwright's JSX transform produces component-test descriptors. Compile the
  // actual component with the existing bundler for React SSR, entirely in memory.
  const componentBuild = await build({
    configFile: false,
    logLevel: 'silent',
    resolve: { alias: { '@': path.resolve('src') } },
    esbuild: { jsx: 'automatic' },
    build: {
      ssr: 'src/shared/ui/TrCard.tsx',
      write: false,
      minify: false,
      rollupOptions: { output: { format: 'cjs' } },
    },
  });
  const result = Array.isArray(componentBuild) ? componentBuild[0] : componentBuild;
  if (!('output' in result))
    throw new Error('Component fixture did not produce an in-memory bundle');
  const entry = result.output.find((item) => item.type === 'chunk' && item.isEntry);
  if (!entry || entry.type !== 'chunk') throw new Error('Component fixture entry is missing');
  const compiled = { exports: {} };
  new Function('module', 'exports', 'require', entry.code)(
    compiled,
    compiled.exports,
    createRequire(path.resolve('package.json')),
  );
  const { TrCard } = compiled.exports as typeof import('../../src/shared/ui/TrCard');
  expect(
    Object.keys(entry.modules).some((name) =>
      name.replaceAll('\\', '/').endsWith('/src/shared/ui/TrCard.tsx'),
    ),
  ).toBe(true);
  await testInfo.attach('component-fixture-inputs', {
    body: JSON.stringify(Object.keys(entry.modules), null, 2),
    contentType: 'application/json',
  });
  await page.route('**/auth/session', (route) =>
    route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } }),
  );
  await page.goto('/w/auth/login');
  await expect(page.getByTestId('auth-email')).toBeVisible();
  const stylesheets = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  expect(stylesheets.length).toBeGreaterThan(0);
  const foundations = (Object.keys(VitRadii) as VitRadius[]).map((radius) => ({
    id: `foundation-${radius}`,
    expected: VitRadii[radius],
    props: { radius },
  }));
  const roles = [
    { id: 'card-sm', expected: 12, props: { rounded: 'sm' as const } },
    { id: 'card-md', expected: 16, props: { rounded: 'md' as const } },
    { id: 'card-lg', expected: 24, props: { rounded: 'lg' as const } },
    { id: 'card-default', expected: 16, props: {} },
  ];
  const cases = [...foundations, ...roles];
  const markup = cases
    .map(({ id, props }) =>
      renderToStaticMarkup(
        React.createElement(TrCard, {
          ...props,
          'data-testid': id,
          padding: 0,
          style: { width: 48, height: 48 },
          children: 'R',
        }),
      ),
    )
    .join('');
  const button = renderToStaticMarkup(
    React.createElement(TrCard, {
      as: 'button',
      'data-testid': 'card-button',
      padding: 8,
      children: 'Select',
    }),
  );
  const hoverMarkup = [false, true]
    .map((hover) =>
      renderToStaticMarkup(
        React.createElement(TrCard, {
          hover,
          className: 'rounded-2xl p-4',
          'data-testid': hover ? 'explicit-hover' : 'static-card',
          children: React.createElement('div', { className: 'flex items-center' }, 'Hover'),
        }),
      ),
    )
    .join('');
  await page.setContent(
    `<!doctype html><html><head>${stylesheets.map((href) => `<link rel="stylesheet" href="${href}">`).join('')}</head><body style="background:var(--tr-bg);color:var(--tr-text-1);min-height:100vh"><div style="display:flex;gap:12px;padding:24px;flex-wrap:wrap">${markup}<form id="fixture">${button}</form>${hoverMarkup}</div></body></html>`,
  );
  await page.locator('#fixture').evaluate((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      form.setAttribute('data-submitted', 'true');
    });
  });
  // A noncanonical control proves the legacy adapter remains active; do not
  // delete its behavior while protecting the shared public contract.
  await page.getByTestId('static-card').evaluate((element) => {
    const legacy = element.cloneNode(true) as HTMLElement;
    legacy.removeAttribute('data-slot');
    legacy.style.removeProperty('box-shadow');
    legacy.setAttribute('data-testid', 'legacy-card-control');
    element.parentElement!.append(legacy);
  });
  const measurements: { theme: string; id: string; radius: string }[] = [];
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((html, value) => {
      html.setAttribute('class', value);
    }, theme);
    await expect(page.locator('html')).toHaveClass(theme);
    for (const item of cases) {
      const locator = page.getByTestId(item.id);
      await expect(locator).toHaveAttribute('data-slot', 'tr-card');
      if (item.id === 'foundation-full') {
        const radius = await locator.evaluate(
          (element) => getComputedStyle(element).borderTopLeftRadius,
        );
        expect(parseFloat(radius)).toBeGreaterThanOrEqual(999);
      } else {
        await expect(locator).toHaveCSS('border-top-left-radius', `${item.expected}px`);
      }
      measurements.push({
        theme,
        id: item.id,
        radius: await locator.evaluate((element) => getComputedStyle(element).borderTopLeftRadius),
      });
    }
    await expect(page.getByTestId('card-button')).toHaveCSS('border-top-left-radius', '16px');
    await expect(page.getByTestId('card-button')).toHaveAttribute('type', 'button');
    await page.getByTestId('card-button').click();
    await expect(page.locator('#fixture')).not.toHaveAttribute('data-submitted', 'true');
    await page.mouse.move(0, 0);
    const staticCard = page.getByTestId('static-card');
    const beforeHover = await staticCard.evaluate((element) => ({
      border: getComputedStyle(element).borderColor,
      shadow: getComputedStyle(element).boxShadow,
    }));
    await staticCard.hover();
    await staticCard.evaluate(async (element) => {
      getComputedStyle(element).getPropertyValue('border-color');
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    await expect(staticCard).toHaveCSS('border-color', beforeHover.border);
    await expect(staticCard).toHaveCSS('box-shadow', beforeHover.shadow);
    await expect(staticCard).toHaveCSS('transform', 'none');
    await staticCard.locator(':scope > div').hover();
    await expect(staticCard.locator(':scope > div')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
    const legacy = page.getByTestId('legacy-card-control');
    await legacy.locator(':scope > div').hover();
    await expect(legacy).toHaveCSS('border-color', 'rgba(229, 138, 0, 0.12)');
    await expect(legacy).not.toHaveCSS('box-shadow', beforeHover.shadow);
    await expect(legacy.locator(':scope > div')).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
    await page.getByTestId('explicit-hover').hover();
    await expect(page.getByTestId('explicit-hover')).toHaveCSS(
      'transform',
      'matrix(1, 0, 0, 1, 0, -1)',
    );
    await expect(page.getByTestId('explicit-hover')).toHaveCSS(
      'border-color',
      'rgba(229, 138, 0, 0.15)',
    );
    await page.evaluate(() => document.fonts.ready);
    await testInfo.attach(`radii-${theme}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }
  await testInfo.attach('computed-radii', {
    body: JSON.stringify(measurements, null, 2),
    contentType: 'application/json',
  });
});

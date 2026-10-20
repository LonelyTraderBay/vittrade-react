import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { name: 'phone-small', prefix: '', width: 320 },
  { name: 'phone', prefix: '', width: 390 },
  { name: 'phone-wide', prefix: '', width: 440 },
  { name: 'tablet', prefix: '/t', width: 768 },
  { name: 'responsive-below-tablet', prefix: '/r', width: 767 },
  { name: 'responsive-tablet', prefix: '/r', width: 768 },
  { name: 'responsive-below-web', prefix: '/r', width: 1023 },
  { name: 'responsive-web', prefix: '/r', width: 1024 },
  { name: 'web', prefix: '/w', width: 1440 },
] as const;

async function signIn(page: Page, prefix: string, theme: 'light' | 'dark', state = 'success') {
  await page.addInitScript(
    ({ scenario }) => {
      if (scenario !== 'success') {
        localStorage.setItem(
          'vittrade.dev-preview.scenario',
          JSON.stringify({ domain: 'market', state: scenario }),
        );
      }
    },
    { scenario: state },
  );
  await page.goto(`${prefix}/auth/login`);
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/login'),
  );
  await page.getByTestId('auth-submit').click();
  const response = await loginResponse;
  expect(response.fromServiceWorker()).toBe(true);
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${prefix}/home$`));
  // CSS token modes are the contract under test; ThemeProvider persistence is separate.
  await page.locator('html').evaluate((html, mode) => {
    html.classList.toggle('dark', mode === 'dark');
    html.classList.toggle('light', mode === 'light');
  }, theme);
}

async function geometry(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  return page.locator('a[href*="/pair/"][aria-label]').evaluateAll((elements) =>
    elements.map((row) => {
      const [symbolText, priceText] = row.getAttribute('aria-label')!.split(' — ');
      const findText = (text: string) =>
        [...row.querySelectorAll('span')].filter((span) => span.textContent === text).at(-1)!;
      const rects = (element: Element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return [...range.getClientRects()].map((rect) => ({
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        }));
      };
      const symbol = rects(findText(symbolText));
      const price = rects(findText(priceText));
      const logo = rects(row.firstElementChild!.firstElementChild!);
      const bounds = row.getBoundingClientRect();
      const intersects = (left: typeof symbol, right: typeof symbol) =>
        left.some((s) =>
          right.some(
            (p) =>
              s.left < p.right - 0.5 &&
              s.right > p.left + 0.5 &&
              s.top < p.bottom - 0.5 &&
              s.bottom > p.top + 0.5,
          ),
        );
      const overlaps =
        intersects(symbol, price) || intersects(logo, symbol) || intersects(logo, price);
      const clipped = [...symbol, ...price, ...logo].some(
        (rect) => rect.left < bounds.left - 0.5 || rect.right > bounds.right + 0.5,
      );
      return {
        symbolText,
        priceText,
        href: row.getAttribute('href'),
        symbol,
        price,
        logo,
        overlaps,
        clipped,
        rowWidth: bounds.width,
        flexWrap: getComputedStyle(row).flexWrap,
      };
    }),
  );
}

function checkGeometry(rows: Awaited<ReturnType<typeof geometry>>) {
  expect(rows.length).toBeGreaterThanOrEqual(4);
  expect(rows.filter((row) => row.overlaps || row.clipped)).toEqual([]);
}

for (const theme of ['light', 'dark'] as const) {
  for (const profile of profiles) {
    test(`Market Home quote reflow ${profile.name} ${theme} @ui-mock`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: profile.width, height: 900 });
      await signIn(page, profile.prefix, theme);
      await expect(
        page
          .getByRole('region', { name: 'Tăng mạnh', exact: true })
          .getByText('BTC/USDT', { exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
        theme === 'dark',
      );
      const samples = [{ condition: 'default', rows: await geometry(page) }];
      checkGeometry(samples[0].rows);
      await page.screenshot({
        path: testInfo.outputPath(`home-${profile.name}-${theme}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      if (profile.width === 320 || profile.width === 1440) {
        const spacing = await page.addStyleTag({
          content:
            'a[href*="/pair/"] span { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }',
        });
        const spaced = await geometry(page);
        checkGeometry(spaced);
        samples.push({ condition: 'user-text-spacing', rows: spaced });
        await spacing.evaluate((element) => element.parentNode?.removeChild(element));
        await page.locator('a[href*="/pair/"] span').evaluateAll((elements) => {
          const sizes = elements.map((element) => parseFloat(getComputedStyle(element).fontSize));
          elements.forEach((element, index) => {
            (element as HTMLElement).style.fontSize = `${sizes[index] * 2}px`;
          });
        });
        const resized = await geometry(page);
        checkGeometry(resized);
        samples.push({ condition: 'quote-text-200-percent', rows: resized });
        await page.screenshot({
          path: testInfo.outputPath(`home-${profile.name}-${theme}-quote-text-200.png`),
          fullPage: true,
          animations: 'disabled',
        });
        await page.reload();
        await page.locator('html').evaluate((html, mode) => {
          html.classList.toggle('dark', mode === 'dark');
          html.classList.toggle('light', mode === 'light');
        }, theme);
        await expect(
          page
            .getByRole('region', { name: 'Tăng mạnh', exact: true })
            .getByText('BTC/USDT', { exact: true }),
        ).toBeVisible();
        checkGeometry(await geometry(page));
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
      const firstQuote = page
        .getByRole('region', { name: 'Tăng mạnh', exact: true })
        .getByRole('link', { name: 'BTC/USDT — 67,543.21' });
      // The browser MSW fixture id is btcusdt; unit fixtures deliberately use btc-usdt.
      await expect(firstQuote).toHaveAttribute('href', `${profile.prefix}/pair/btcusdt`);
      await firstQuote.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await page.keyboard.press('Tab');
      await firstQuote.focus();
      await expect(firstQuote).toBeFocused();
      expect(
        await firstQuote.evaluate((element) => getComputedStyle(element).outlineStyle),
      ).not.toBe('none');
      await firstQuote.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${profile.prefix}/pair/btcusdt$`));
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${profile.prefix}/home$`));
      await expect(firstQuote).toBeVisible();
      if (profile.name === 'phone' || profile.name === 'web') {
        await firstQuote.click();
        await expect(page).toHaveURL(new RegExp(`${profile.prefix}/pair/btcusdt$`));
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
      await writeFile(
        testInfo.outputPath('market-home-geometry.json'),
        JSON.stringify(
          {
            profile,
            theme,
            role: 'developer fixture',
            locale: 'implemented Vietnamese copy',
            samples,
          },
          null,
          2,
        ),
      );
    });
  }

  for (const state of ['empty', 'loading', 'error'] as const) {
    test(`Market Home ${state} ${theme} @ui-mock`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await signIn(page, '', theme, state);
      if (state === 'empty') {
        await expect(page.getByText('Chưa có cặp trong watchlist', { exact: true })).toBeVisible();
        await expect(page.getByText('Chưa có dữ liệu', { exact: true })).toHaveCount(2);
        await expect(page.locator('a[href*="/pair/"]')).toHaveCount(0);
      } else if (state === 'loading') {
        await expect(page.getByText('Đang tải dữ liệu thị trường…', { exact: true })).toBeVisible();
        await page.screenshot({
          path: testInfo.outputPath(`home-loading-${theme}-pending.png`),
          fullPage: true,
          animations: 'disabled',
        });
        await expect(
          page.getByRole('region', { name: 'Tăng mạnh', exact: true }).getByRole('link').first(),
        ).toBeVisible();
      } else {
        await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
        await expect(page.locator('a[href*="/pair/"]')).toHaveCount(0);
        await page.screenshot({
          path: testInfo.outputPath(`home-error-${theme}-before-retry.png`),
          fullPage: true,
          animations: 'disabled',
        });
        const retryRequest = page.waitForRequest((request) =>
          new URL(request.url()).pathname.endsWith('/market/pairs'),
        );
        await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
        await retryRequest;
        await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
        await page.getByRole('button', { name: 'Tắt trạng thái API' }).click();
        await page.getByRole('button', { name: 'Thu gọn' }).click();
        await expect(
          page.getByRole('region', { name: 'Tăng mạnh', exact: true }).getByRole('link').first(),
        ).toBeVisible();
      }
      await page.screenshot({
        path: testInfo.outputPath(`home-${state}-${theme}-final.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}

test('guest Market Home does not read a private watchlist @ui-mock', async ({ page }) => {
  const watchlistRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/market/watchlist'))
      watchlistRequests.push(request.url());
  });
  await page.goto('/home');
  await expect(
    page.getByRole('region', { name: 'Tăng mạnh', exact: true }).getByRole('link').first(),
  ).toBeVisible();
  await expect(page.getByText('Chưa có cặp trong watchlist', { exact: true })).toBeVisible();
  expect(watchlistRequests).toEqual([]);
});

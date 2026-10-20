import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'layout-fixture',
    email: 'layout@example.test',
    fullName: 'Layout fixture',
    roles: ['user'],
    permissions: ['market:read', 'market:watchlist:write', 'p2p:read'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'layout-fixture-memory-token',
};
const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65000,
  prevPrice: 64000,
  change24h: 1.5,
  high24h: 66000,
  low24h: 63000,
  volume24h: 1000000,
  marketCap: 1000000000,
  sparklineData: [64000, 65000],
  logoColor: '#F7931A',
  isFavorite: true,
  category: 'Layer 1',
};
const pairs = [
  pair,
  { ...pair, id: 'eth-usdt', symbol: 'ETH/USDT', baseAsset: 'ETH', price: 3000 },
];

for (const { width, prefix } of [
  { width: 390, prefix: '' },
  { width: 820, prefix: '/t' },
  { width: 390, prefix: '/r' },
  { width: 767, prefix: '/r' },
  { width: 768, prefix: '/r' },
  { width: 1023, prefix: '/r' },
  { width: 1024, prefix: '/r' },
  { width: 1440, prefix: '/w' },
]) {
  for (const theme of ['light', 'dark']) {
    test(`keeps migrated content contracts ${prefix} at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
      await page.route('**/market/pairs**', (route) => route.fulfill({ json: { items: pairs } }));
      await page.route('**/market/watchlist', (route) =>
        route.fulfill({
          json: {
            items: pairs.map((item) => ({
              id: `watch-${item.id}`,
              pairId: item.id,
              addedAt: '2026-10-01T00:00:00Z',
            })),
          },
        }),
      );
      await page.goto(`${prefix}/markets/watchlist`);
      await page.locator('html').evaluate((html, value) => {
        html.setAttribute('class', value);
      }, theme);
      const cards = page.locator('[data-slot="tr-card"]');
      await expect(cards).toHaveCount(2);
      await expect(page.locator('html')).toHaveClass(theme);
      const region = cards.first().locator('..');
      await expect(region).toHaveCSS('gap', '12px');
      await expect(region).toHaveCSS('padding-top', '12px');
      await expect(region).toHaveCSS('padding-bottom', '24px');
      await expect(region).toHaveCSS('padding-left', width < 768 ? '20px' : '0px');
      await expect(cards.first()).toHaveCSS('margin-bottom', '0px');
      const boxes = await cards.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
        }),
      );
      for (const box of boxes) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
      }
      expect(Math.abs(boxes[1].top - boxes[0].bottom - 12)).toBeLessThan(1);
      const search = page.getByRole('searchbox');
      await search.fill('not-found');
      await expect(page.getByText('Không tìm thấy cặp nào')).toBeVisible();
      await search.fill('BTC');
      await expect(cards).toHaveCount(1);
      await search.fill('');
      await expect(cards).toHaveCount(2);
      await testInfo.attach('watchlist', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });

      await page.goto(`${prefix}/p2p/fraud-prevention`);
      await page.locator('html').evaluate((html, value) => {
        html.setAttribute('class', value);
      }, theme);
      await expect(page.getByText('Phòng chống gian lận', { exact: true }).first()).toBeVisible();
      await expect(page.locator('html')).toHaveClass(theme);
      const content = page
        .getByText('Chỉ số an toàn', { exact: true })
        .locator('xpath=ancestor::*[@data-slot="tr-card"]/..');
      await expect(content).toHaveCSS('gap', '21px');
      await expect(content).toHaveCSS('padding-top', '16px');
      await expect(content).toHaveCSS('padding-bottom', '44px');
      await expect(content).toHaveCSS('padding-left', width < 768 ? '20px' : '0px');
      const copyBounds = await page
        .locator('[data-slot="tr-card"] > button.w-full')
        .evaluateAll((buttons) =>
          buttons.map((button) => {
            const paragraph = button.querySelector('p');
            const card = button.closest('[data-slot="tr-card"]');
            if (!paragraph || !card) throw new Error('Fraud guidance copy boundary is missing');
            const range = document.createRange();
            range.selectNodeContents(paragraph);
            const text = range.getBoundingClientRect(),
              box = card.getBoundingClientRect();
            return {
              title: paragraph.textContent,
              textBottom: text.bottom,
              cardBottom: box.bottom,
              textTop: text.top,
              cardTop: box.top,
            };
          }),
        );
      expect(copyBounds.length).toBeGreaterThan(0);
      for (const box of copyBounds) {
        expect(box.textBottom, box.title ?? '').toBeLessThanOrEqual(box.cardBottom + 1);
        expect(box.textTop).toBeGreaterThanOrEqual(box.cardTop - 1);
      }
      await testInfo.attach('copy-boundaries', {
        body: JSON.stringify(copyBounds, null, 2),
        contentType: 'application/json',
      });
      await page.getByRole('button', { name: /Bằng chứng thanh toán giả/ }).click();
      await expect(page.getByText('CÁCH THỨC HOẠT ĐỘNG')).toBeVisible();
      await page.getByRole('button', { name: /Anti-Phishing Code đã thiết lập/ }).click();
      await expect(page.getByText('7/10 biện pháp bảo vệ đã áp dụng')).toBeVisible();
      await testInfo.attach('fraud-prevention', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
      const overflow = await page
        .locator('html')
        .evaluate((element) => element.scrollWidth > element.clientWidth);
      expect(overflow).toBe(false);
    });
  }
}

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('production shell smoke', () => {
  const authenticatedSession = {
    user: {
      id: 'e2e-production-route-user',
      email: 'routes@example.com',
      fullName: 'Route E2E User',
      roles: ['user'],
      permissions: ['wallet:read', 'wallet:write', 'trade:read', 'trade:write'],
      kycStatus: 'verified',
      kycLevel: 2,
      accountStatus: 'active',
    },
    accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
    accessToken: 'production-route-e2e-token',
  };

  test('redirects the public root to the market home shell', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('renders the unauthenticated login boundary', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByText('Đăng nhập', { exact: true }).first()).toBeVisible();
  });

  test('does not expose unavailable social-login actions on the production web login', async ({
    page,
  }) => {
    await page.goto('/w/auth/login');

    await expect(page.getByText('Đăng nhập', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Apple' })).toHaveCount(0);
  });

  test('keeps the static prediction chart demo behind the production integration boundary', async ({
    page,
  }) => {
    await page.goto('/markets/predictions/advanced-chart/BTC-USD');

    await expect(
      page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
    ).toBeVisible();
    await expect(page.getByText('Order Flow (Buy vs Sell Pressure)')).toHaveCount(0);
  });

  test('loads P2P education feature routes and keeps unbacked KYC status in the production boundary', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));

    for (const [route, title] of [
      ['/p2p/fraud-prevention', 'Phòng chống gian lận'],
      ['/p2p/guide', 'Hướng dẫn P2P'],
    ]) {
      await page.goto(route);
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }

    await page.goto('/p2p/kyc/requirements');
    await expect(
      page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
    ).toBeVisible();
  });

  test('serves the canonical and legacy Launchpad detail URLs from the API-backed feature', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
    await page.route('**/launchpad/projects/e2e-project', (route) =>
      route.fulfill({
        json: {
          id: 'e2e-project',
          name: 'E2E Launchpad Project',
          symbol: 'E2E',
          logo: 'E',
          logoColor: '#6366F1',
          description: 'Contract-backed project',
          type: 'ido',
          status: 'active',
          totalRaise: '$1,000,000',
          price: 0.1,
          priceUnit: 'USDT',
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-01-02T00:00:00Z',
          listingDate: '2026-01-03T00:00:00Z',
          progress: 50,
          participants: 100,
          subscribed: 500000,
          allocation: 0,
          tags: ['e2e'],
          kyc: true,
          kycLevel: 1,
          whitelist: false,
          chain: 'Ethereum',
          longDescription: 'Loaded from the Launchpad detail contract.',
          hardCap: '$1,000,000',
          minBuy: 10,
          maxBuy: 1000,
          contractAddress: '0x1234567890abcdef',
          website: '',
          twitter: '',
          telegram: '',
          tokenomics: [],
          vesting: [],
          team: [],
          audit: {
            auditor: 'Independent auditor',
            status: 'passed',
            critical: 0,
            high: 0,
            medium: 0,
            reportUrl: '',
          },
          platformFee: 0,
          restrictions: [],
        },
      }),
    );

    for (const route of ['/launchpad/e2e-project', '/launchpad/contract/e2e-project']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: 'E2E Launchpad Project' })).toBeVisible();
      await expect(page.getByText('Loaded from the Launchpad detail contract.')).toBeVisible();
    }
  });

  test('loads market pair details and updates the watchlist through its permissioned contract', async ({
    page,
  }) => {
    const marketSession = {
      ...authenticatedSession,
      user: {
        ...authenticatedSession.user,
        permissions: [...authenticatedSession.user.permissions, 'market:watchlist:write'],
      },
    };
    let watchlistItems: Array<{ id: string; pairId: string; addedAt: string }> = [];

    await page.route('**/auth/session', (route) => route.fulfill({ json: marketSession }));
    await page.route('**/market/pairs/btc-usdt', (route) =>
      route.fulfill({
        json: {
          id: 'btc-usdt',
          symbol: 'BTC/USDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          price: 67543.21,
          prevPrice: 66012.5,
          change24h: 2.34,
          high24h: 68100,
          low24h: 65800,
          volume24h: 23456789000,
          marketCap: 1324567890000,
          sparklineData: [65100, 66200, 67543.21],
          logoColor: '#F7931A',
          isFavorite: false,
          category: 'Layer 1',
        },
      }),
    );
    await page.route('**/market/pairs/btc-usdt/orderbook', (route) =>
      route.fulfill({ json: { bids: [], asks: [], updatedAt: '2026-09-24T08:30:00.000Z' } }),
    );
    await page.route('**/market/pairs/btc-usdt/trades', (route) =>
      route.fulfill({ json: { items: [] } }),
    );
    await page.route('**/market/watchlist', async (route) => {
      if (route.request().method() === 'POST') {
        const request = route.request().postDataJSON() as { pairId: string };
        const item = {
          id: 'market-e2e-watchlist-item',
          pairId: request.pairId,
          addedAt: '2026-09-24T08:30:00.000Z',
        };
        watchlistItems = [item];
        await route.fulfill({ status: 201, json: item });
        return;
      }
      await route.fulfill({ json: { items: watchlistItems } });
    });

    await page.goto('/pair/btc-usdt');
    await expect(page.getByText('BTC/USDT', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Theo dõi cặp giao dịch' }).click();
    await expect(page.getByRole('button', { name: 'Bỏ theo dõi cặp giao dịch' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('keeps simulated registration out of phone and web production routes', async ({ page }) => {
    for (const route of ['/auth/register', '/w/auth/register']) {
      await page.goto(route);
      await expect(
        page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
      ).toBeVisible();
    }
  });

  test('keeps the web arena demo behind the production boundary', async ({ page }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
    await page.goto('/w/arena');

    await expect(
      page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
    ).toBeVisible();
  });

  test('keeps demo security and identity routes behind the production boundary', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));

    for (const route of [
      '/w/profile/security/security-audit',
      '/w/profile/security/notifications',
      '/w/profile/api',
      '/w/profile/kyc',
      '/w/profile/settings',
      '/w/profile/vip',
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
      ).toBeVisible();
    }
  });

  test('security overview fails closed without backend profile data', async ({ page }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
    await page.goto('/w/profile/security');

    await expect(page.getByText('Có lỗi xảy ra')).toBeVisible();
    await expect(page.getByText('123.45.67.89')).toHaveCount(0);
    await expect(page.getByText('Google Authenticator đã bật')).toHaveCount(0);
  });

  test('web referral overview fails closed without contract data', async ({ page }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
    await page.goto('/w/referral');

    await expect(page.getByText('Có lỗi xảy ra')).toBeVisible();
  });

  test('keeps wallet flows without backend contracts behind the production boundary', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));

    for (const route of [
      '/wallet/buy-crypto',
      '/wallet/gas-optimizer',
      '/wallet/health-score',
      '/trade/bots',
      '/w/trade/bots',
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
      ).toBeVisible();
    }
  });

  test('keeps simulated trading compliance and analytics behind the production boundary', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));

    for (const route of [
      '/trade/copy-trading/complaint-submission',
      '/trade/copy-trading/audit-trail',
      '/trade/copy-trading/arm-integration-status',
      '/trade/bots/backtesting',
      '/trade/bots/performance-analytics',
      '/w/trade/bots/performance-analytics',
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
      ).toBeVisible();
    }
  });

  test('keeps advanced DCA routes available as explicit production-pending pages', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));

    for (const route of [
      '/dca/rebalance/config',
      '/dca/rebalance/rebalance-e2e',
      '/dca/schedule/config',
      '/dca/schedule/schedule-e2e',
      '/dca/portfolio-optimizer',
      '/dca/dynamic-amount',
      '/dca/backtester',
      '/dca/multi-asset',
      '/dca/performance-compare',
      '/dca/smart-rules',
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
      ).toBeVisible();
    }
  });

  test('keeps hard-coded portfolio, alert, tax, onboarding and showcase pages out of production', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));

    for (const route of [
      '/unified-portfolio',
      '/cross-module-analytics',
      '/smart-alerts',
      '/tax-reports',
      '/enterprise-states',
      '/onboarding',
      '/r',
      '/r/shell',
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
      ).toBeVisible();
    }
  });

  test('web password reset requires a server-issued reset token', async ({ page }) => {
    await page.goto('/w/auth/reset-password');

    await expect(
      page.getByText('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đặt lại mật khẩu' })).toBeDisabled();
  });

  test('web MFA blocks a missing login challenge', async ({ page }) => {
    await page.goto('/w/auth/otp');

    await expect(page).toHaveURL(/\/w\/auth\/login$/);
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  });

  test('public login shell has no serious or critical accessibility violations', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page }).analyze();
    const seriousViolations = results.violations.filter((violation) =>
      ['critical', 'serious'].includes(violation.impact ?? ''),
    );

    expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
  });
});

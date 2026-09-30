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

  test('switches the active shell on resize when the page has no unsaved form edits', async ({
    page,
  }) => {
    await page.goto('/markets');
    await expect(page).toHaveURL(/\/w\/markets$/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);

    await expect(page).toHaveURL(/\/markets$/);
  });

  test('renders the unauthenticated login boundary', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByText('Đăng nhập', { exact: true }).first()).toBeVisible();
  });

  test('shows no current wallet network status when its provider is unavailable', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
    await page.route('**/api/wallet/network-status*', (route) =>
      route.fulfill({
        status: 503,
        json: {
          code: 'WALLET_NETWORK_STATUS_UNAVAILABLE',
          message: 'Network status source is not configured.',
        },
      }),
    );
    await page.goto('/wallet/network-status');

    await expect(page.getByText('Không thể tải trạng thái mạng')).toBeVisible();
    await expect(page.getByText('Hoạt động', { exact: true })).toHaveCount(0);
  });

  test('does not expose unavailable social-login actions on the production web login', async ({
    page,
  }) => {
    await page.goto('/w/auth/login');

    await expect(page.getByText('Đăng nhập', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Apple' })).toHaveCount(0);
  });

  test('does not register or load development diagnostic pages in production', async ({ page }) => {
    const diagnosticModuleRequests: string[] = [];
    page.on('request', (request) => {
      if (/RouteChecker|PerformanceMonitor/.test(request.url())) {
        diagnosticModuleRequests.push(request.url());
      }
    });
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));

    for (const [route, title] of [
      ['/w/dev/route-checker', 'Staking Route Checker'],
      ['/w/dev/performance-monitor', 'Performance Monitor'],
    ]) {
      await page.goto(route);
      await expect(page.getByText(title, { exact: false })).toHaveCount(0);
    }

    expect(diagnosticModuleRequests).toEqual([]);
  });

  test('keeps the static prediction chart demo behind the production integration boundary', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
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

  test('loads derivatives market data through the read-only contract route', async ({ page }) => {
    await page.route('**/market/derivatives', (route) =>
      route.fulfill({
        json: {
          provider: 'E2E Derivatives Source',
          updatedAt: '2026-09-26T08:00:00.000Z',
          stats: {
            totalOpenInterest: 10_000,
            openInterestChange24h: 2.3,
            totalVolume24h: 20_000,
            volumeChange24h: 1.5,
            totalLiquidations24h: 200,
            longLiquidations24h: 120,
            shortLiquidations24h: 80,
            averageFundingRate8h: 0.000012,
            btcLongShortRatio: 1.18,
          },
          pairs: [
            {
              id: 'btc-perp',
              symbol: 'BTC/USDT',
              name: 'Bitcoin',
              price: 65_000,
              change24h: 1.2,
              fundingRate: 0.0001,
              openInterest: 4_000,
              openInterestChange24h: 0.5,
              volume24h: 8_000,
              longSharePercent: 60,
              liquidations24h: { long: 90, short: 10 },
            },
          ],
          liquidationHistory: [{ bucketAt: '2026-09-26T08:00:00.000Z', long: 80, short: 60 }],
        },
      }),
    );

    await page.goto('/markets/derivatives');
    await expect(page.getByText('E2E Derivatives Source')).toBeVisible();
    await expect(page.getByText('Tổng Open Interest')).toBeVisible();
    await page.getByRole('button', { name: 'Perpetual' }).click();
    await expect(page.getByText('BTC/USDT')).toBeVisible();
    await expect(page.getByText(/Long 60\.0%/)).toBeVisible();
  });

  test('loads social sentiment through the source-backed market contract', async ({ page }) => {
    await page.route('**/market/sentiment*', (route) =>
      route.fulfill({
        json: {
          window: '24h',
          provider: 'E2E Sentiment Source',
          updatedAt: '2026-09-26T08:00:00.000Z',
          overall: {
            score: 32,
            sentiment: 'bullish',
            totalMentions24h: 1200,
            mentionsChange24h: 12.5,
            trendingTokenCount: 4,
            socialDominance: { btcPercent: 40, ethPercent: 20, otherPercent: 40 },
          },
          timeline: [{ at: '2026-09-26T08:00:00.000Z', score: 32, mentions: 1200 }],
          tokens: [
            {
              id: 'btc',
              symbol: 'BTC',
              name: 'Bitcoin',
              score: 48,
              sentiment: 'bullish',
              mentions24h: 700,
              mentionsChange24h: 8.2,
              sentimentSharePercent: { bullish: 60, neutral: 25, bearish: 15 },
              trendingRank: 1,
              topTopics: ['ETF flows'],
            },
          ],
          trendingTopics: [{ topic: 'ETF flows', mentions24h: 340, change24h: 21.2 }],
        },
      }),
    );

    await page.goto('/markets/social-sentiment');
    await expect(page.getByText('E2E Sentiment Source')).toBeVisible();
    await expect(page.getByText('+32')).toBeVisible();
    await page.getByRole('button', { name: 'Theo token' }).click();
    await expect(page.getByText('Bitcoin')).toBeVisible();
    await expect(page.getByText(/Tích cực 60%/)).toBeVisible();
  });

  test('loads social trading signals through the source-backed market contract', async ({
    page,
  }) => {
    await page.route('**/market/signals', (route) =>
      route.fulfill({
        json: {
          provider: 'E2E Signals Source',
          updatedAt: '2026-09-26T08:00:00.000Z',
          items: [
            {
              id: 'signal-1',
              providerName: 'E2E Publisher',
              symbol: 'BTC/USDT',
              direction: 'long',
              category: 'swing',
              status: 'active',
              publishedAt: '2026-09-26T07:00:00.000Z',
              expiresAt: '2026-10-01T07:00:00.000Z',
              rationale: 'Published context for browser verification.',
              sourceUrl: 'https://signals.example.com/1',
            },
          ],
        },
      }),
    );

    await page.goto('/markets/signals');
    await expect(page.getByText('E2E Signals Source')).toBeVisible();
    await expect(page.getByText('BTC/USDT')).toBeVisible();
    await page.getByRole('button', { name: 'Đang mở' }).click();
    await expect(page.getByRole('link', { name: 'Xem nguồn' })).toHaveAttribute(
      'href',
      'https://signals.example.com/1',
    );
  });

  test('serves the market portfolio alias from authenticated wallet analytics', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
    await page.route('**/wallet/analytics/portfolio*', (route) =>
      route.fulfill({
        json: {
          period: '1M',
          history: [{ timestamp: '2026-09-21T10:00:00.000Z', value: 1000, pnl: 50 }],
          monthlyPnl: [{ month: 'Sep', pnl: 50 }],
          topPerformers: [
            { symbol: 'BTC', name: 'Bitcoin', change: 10, usd: 100, color: '#F7931A' },
          ],
          worstPerformers: [],
          totalTrades: 2,
          totalFeesUsd: 1.25,
        },
      }),
    );

    await page.goto('/w/markets/portfolio-tracker');
    await expect(page.getByText('Portfolio summary')).toBeVisible();
    await expect(page.getByText('Server-owned wallet performance')).toBeVisible();
    await expect(page.getByText('BTC')).toBeVisible();
  });

  test('renders account positions from the authenticated trading contract', async ({ page }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: authenticatedSession }));
    await page.route('**/trading/positions*', (route) =>
      route.fulfill({
        json: {
          items: [
            {
              id: 'e2e-position-1',
              symbol: 'ETH/USDT',
              productType: 'futures',
              side: 'short',
              baseAsset: 'ETH',
              quoteAsset: 'USDT',
              quantity: 0.5,
              entryPrice: 3500,
              markPrice: 3490,
              unrealizedPnl: -5,
              openedAt: '2026-09-26T09:00:00.000Z',
            },
          ],
          updatedAt: '2026-09-26T10:00:00.000Z',
        },
      }),
    );

    await page.goto('/w/trade/positions');
    await expect(page.getByRole('group', { name: 'Lọc loại vị thế' })).toBeVisible();
    await expect(page.getByText('ETH/USDT')).toBeVisible();
    await expect(page.getByText('−5.0000 USDT')).toBeVisible();
    await expect(page.getByText('Tổng P/L')).toHaveCount(0);
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

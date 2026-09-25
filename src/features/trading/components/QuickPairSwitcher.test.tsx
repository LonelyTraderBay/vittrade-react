import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { QuickPairSwitcher } from './QuickPairSwitcher';

const server = setupServer();

const pairs = [
  {
    id: 'btc-usdt',
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 65_000,
    prevPrice: 64_000,
    change24h: 1.56,
    high24h: 66_000,
    low24h: 63_000,
    volume24h: 1_000_000,
    marketCap: 1_200_000_000,
    sparklineData: [64_000, 65_000],
    logoColor: '#F7931A',
    category: 'Layer 1',
  },
  {
    id: 'eth-usdt',
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3_500,
    prevPrice: 3_400,
    change24h: 2.94,
    high24h: 3_600,
    low24h: 3_300,
    volume24h: 500_000,
    marketCap: 400_000_000,
    sparklineData: [3_400, 3_450, 3_500],
    logoColor: '#627EEA',
    category: 'Layer 1',
  },
];

const authenticatedAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions: ['market:read'] },
  },
};

const unauthenticatedAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: null,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('QuickPairSwitcher', () => {
  it('filters the favorites category from the authenticated watchlist contract', async () => {
    server.use(
      http.get('*/market/pairs', () => HttpResponse.json({ items: pairs })),
      http.get('*/market/watchlist', () =>
        HttpResponse.json({
          items: [{ id: 'watch-eth', pairId: 'eth-usdt', addedAt: '2026-09-24T08:30:00Z' }],
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <QuickPairSwitcher
        open
        currentPairId="btc-usdt"
        onClose={() => undefined}
        onSelect={() => undefined}
      />,
      { authAdapter: authenticatedAdapter },
    );

    await screen.findByRole('button', { name: /BTC\/USDT/ });
    await user.click(screen.getByRole('button', { name: 'Yêu thích' }));

    expect(screen.getByRole('button', { name: /ETH\/USDT/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /BTC\/USDT/ })).not.toBeInTheDocument();
  });

  it('explains that the watchlist requires a signed-in session', async () => {
    server.use(http.get('*/market/pairs', () => HttpResponse.json({ items: pairs })));

    const user = userEvent.setup();
    renderWithProviders(
      <QuickPairSwitcher
        open
        currentPairId="btc-usdt"
        onClose={() => undefined}
        onSelect={() => undefined}
      />,
      { authAdapter: unauthenticatedAdapter },
    );

    await screen.findByRole('button', { name: /BTC\/USDT/ });
    await user.click(screen.getByRole('button', { name: 'Yêu thích' }));

    expect(screen.getByText('Đăng nhập để xem danh sách theo dõi.')).toBeInTheDocument();
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { waitFor } from '@testing-library/react';
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

  it('filters by category and base asset, then clears a query with no matches', async () => {
    const baseAssetOnly = {
      ...pairs[0],
      id: 'wrapped-usdt',
      symbol: 'ALT/USDT',
      baseAsset: 'WRAPPED',
      category: 'AI',
      change24h: -1.25,
    };
    server.use(
      http.get('*/market/pairs', () => HttpResponse.json({ items: [...pairs, baseAssetOnly] })),
    );

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
    await user.click(screen.getByRole('button', { name: 'AI' }));
    const wrappedPair = await screen.findByRole('button', { name: /ALT\/USDT/ });
    expect(wrappedPair).toHaveStyle({ background: 'transparent' });
    expect(wrappedPair).toHaveTextContent('-1.25%');

    const search = screen.getByPlaceholderText('Tìm BTC, ETH, SOL...');
    await user.type(search, '  wrapped  ');
    expect(screen.getByRole('button', { name: /ALT\/USDT/ })).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'missing');
    expect(screen.getByText('Không tìm thấy cặp giao dịch')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    expect(screen.getByRole('button', { name: /ALT\/USDT/ })).toBeInTheDocument();
  });

  it('selects the active pair and closes the sheet', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    server.use(http.get('*/market/pairs', () => HttpResponse.json({ items: pairs })));

    const user = userEvent.setup();
    renderWithProviders(
      <QuickPairSwitcher open currentPairId="btc-usdt" onClose={onClose} onSelect={onSelect} />,
      { authAdapter: unauthenticatedAdapter },
    );

    const activePair = await screen.findByRole('button', { name: /BTC\/USDT/ });
    expect(activePair).not.toHaveStyle({ background: 'transparent' });
    await user.click(activePair);

    expect(onSelect).toHaveBeenCalledWith('btc-usdt');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the market loading state while pairs are pending', async () => {
    server.use(
      http.get('*/market/pairs', async () => {
        await new Promise((resolve) => setTimeout(resolve, 80));
        return HttpResponse.json({ items: pairs });
      }),
    );

    renderWithProviders(
      <QuickPairSwitcher
        open
        currentPairId="btc-usdt"
        onClose={() => undefined}
        onSelect={() => undefined}
      />,
      { authAdapter: unauthenticatedAdapter },
    );

    expect(await screen.findByText('Đang tải cặp giao dịch…')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /BTC\/USDT/ })).toBeInTheDocument();
  });

  it('retries failed pair and favorite requests through their owning queries', async () => {
    let pairAttempts = 0;
    let watchlistAttempts = 0;
    server.use(
      http.get('*/market/pairs', () => {
        pairAttempts += 1;
        return pairAttempts <= 3
          ? HttpResponse.json({ message: 'unavailable' }, { status: 503 })
          : HttpResponse.json({ items: pairs });
      }),
      http.get('*/market/watchlist', () => {
        watchlistAttempts += 1;
        return watchlistAttempts <= 3
          ? HttpResponse.json({ message: 'unavailable' }, { status: 503 })
          : HttpResponse.json({
              items: [{ id: 'watch-eth', pairId: 'eth-usdt', addedAt: '2026-09-24T08:30:00Z' }],
            });
      }),
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

    expect(await screen.findByText('Không tải được cặp giao dịch')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await screen.findByRole('button', { name: /BTC\/USDT/ });
    await user.click(screen.getByRole('button', { name: 'Yêu thích' }));
    expect(await screen.findByText('Không tải được cặp giao dịch')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('button', { name: /ETH\/USDT/ })).toBeInTheDocument();
    expect(pairAttempts).toBe(4);
    expect(watchlistAttempts).toBe(4);
  });

  it('resets the search when reopened and focuses its input', async () => {
    server.use(http.get('*/market/pairs', () => HttpResponse.json({ items: pairs })));

    const user = userEvent.setup();
    const view = renderWithProviders(
      <QuickPairSwitcher
        open
        currentPairId="btc-usdt"
        onClose={() => undefined}
        onSelect={() => undefined}
      />,
      { authAdapter: unauthenticatedAdapter },
    );

    const search = await screen.findByPlaceholderText('Tìm BTC, ETH, SOL...');
    await waitFor(() => expect(search).toHaveFocus(), { timeout: 2_000 });
    await user.type(search, 'eth');
    expect(screen.queryByRole('button', { name: /BTC\/USDT/ })).not.toBeInTheDocument();

    view.rerender(
      <QuickPairSwitcher
        open={false}
        currentPairId="btc-usdt"
        onClose={() => undefined}
        onSelect={() => undefined}
      />,
    );
    view.rerender(
      <QuickPairSwitcher
        open
        currentPairId="btc-usdt"
        onClose={() => undefined}
        onSelect={() => undefined}
      />,
    );

    const reopenedSearch = await screen.findByPlaceholderText('Tìm BTC, ETH, SOL...');
    expect(reopenedSearch).toHaveValue('');
    expect(await screen.findByRole('button', { name: /BTC\/USDT/ })).toBeInTheDocument();
    await waitFor(() => expect(reopenedSearch).toHaveFocus(), { timeout: 2_000 });
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { WalletAssetDetailPage } from './AssetDetailPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const assets = {
  items: [
    {
      id: 'btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 0.25,
      available: 0.2,
      frozen: 0.01,
      inOrder: 0.04,
      usdValue: 16_000,
      change24h: 2.5,
      logoColor: '#F7931A',
    },
  ],
  summary: {
    totalUsd: 16_000,
    totalBtc: 0.25,
    availableUsd: 12_800,
    inOrderUsd: 2_560,
    frozenUsd: 640,
  },
};

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 64_000,
  prevPrice: 62_000,
  change24h: 2.5,
  high24h: 65_000,
  low24h: 61_000,
  volume24h: 23_456_789,
  marketCap: 1_200_000_000,
  sparklineData: [62_000, 63_000, 64_000],
  logoColor: '#F7931A',
  category: 'Layer 1',
};

const transactions = {
  items: [
    {
      id: 'deposit-1',
      type: 'deposit',
      asset: 'BTC',
      amount: 0.1,
      status: 'completed',
      createdAt: '2026-09-25T10:30:00.000Z',
    },
    {
      id: 'withdraw-1',
      type: 'withdraw',
      asset: 'BTC',
      amount: 0.02,
      status: 'pending',
      createdAt: '2026-09-26T11:00:00.000Z',
    },
  ],
  total: 2,
};

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return (
    <output aria-label="Current location">
      {location.pathname} {JSON.stringify(location.state)}
    </output>
  );
}

function renderAssetDetail({
  assetId = 'btc',
  permissions = ['wallet:read'],
  showDCAButton = false,
  onDCAImpression,
  onDCAButtonClick,
}: {
  assetId?: string;
  permissions?: string[];
  showDCAButton?: boolean;
  onDCAImpression?: (symbol: string) => void;
  onDCAButtonClick?: (symbol: string) => void;
} = {}) {
  return renderWithProviders(
    <>
      <Routes>
        <Route
          path="/w/wallet/asset/:assetId"
          element={
            <WalletAssetDetailPage
              showDCAButton={showDCAButton}
              onDCAImpression={onDCAImpression}
              onDCAButtonClick={onDCAButtonClick}
            />
          }
        />
        <Route path="*" element={<p>Navigation destination</p>} />
      </Routes>
      <LocationProbe />
    </>,
    {
      authAdapter: adapterWithPermissions(permissions),
      routerProps: { initialEntries: [`/w/wallet/asset/${assetId}`] },
    },
  );
}

function installHandlers({
  assetResponse = assets,
  pairItems = [pair],
  transactionResponse = transactions,
}: {
  assetResponse?: typeof assets | { items: typeof assets.items; summary: typeof assets.summary };
  pairItems?: (typeof pair)[];
  transactionResponse?: typeof transactions;
} = {}) {
  server.use(
    http.get('*/wallet/assets', () => HttpResponse.json(assetResponse)),
    http.get('*/market/pairs', () => HttpResponse.json({ items: pairItems })),
    http.get('*/wallet/transactions', () => HttpResponse.json(transactionResponse)),
  );
}

describe('WalletAssetDetailPage', () => {
  it('does not request wallet balances or transactions without read permission', async () => {
    let walletRequests = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        walletRequests += 1;
        return HttpResponse.json(assets);
      }),
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
      http.get('*/wallet/transactions', () => {
        walletRequests += 1;
        return HttpResponse.json(transactions);
      }),
    );

    renderAssetDetail({ permissions: [] });

    expect(await screen.findByRole('alert')).toHaveTextContent('Wallet read permission');
    expect(walletRequests).toBe(0);
  });

  it('renders server balances, price history, transaction states and the DCA integration seam', async () => {
    const onDCAImpression = vi.fn();
    const onDCAButtonClick = vi.fn();
    const user = userEvent.setup();
    installHandlers();

    renderAssetDetail({ showDCAButton: true, onDCAImpression, onDCAButtonClick });

    expect(await screen.findByText('Bitcoin')).toBeVisible();
    expect(screen.getByText('$16,000.00')).toBeVisible();
    expect(screen.getByText('64,000.00')).toBeVisible();
    expect(screen.getByText('Đang xử lý')).toBeVisible();
    expect(screen.getByText('Biểu đồ giá')).toBeVisible();
    await waitFor(() => expect(onDCAImpression).toHaveBeenCalledWith('BTC'));

    await user.click(screen.getByRole('button', { name: '1W' }));
    expect(screen.getByRole('button', { name: '1W' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'DCA' }));

    expect(onDCAButtonClick).toHaveBeenCalledWith('BTC');
    expect(screen.getByLabelText('Current location')).toHaveTextContent(
      '/w/dca {"preselectedCoin":"BTC"}',
    );
  });

  it('navigates to the selected asset deposit flow', async () => {
    const user = userEvent.setup();
    installHandlers();
    renderAssetDetail();

    expect(await screen.findByText('Bitcoin')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Nạp' }));

    expect(screen.getByLabelText('Current location')).toHaveTextContent('/w/wallet/deposit/btc');
  });

  it('navigates to the selected transaction detail', async () => {
    const user = userEvent.setup();
    installHandlers();
    renderAssetDetail();

    expect(await screen.findByText('Bitcoin')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Nạp.*Hoàn thành/ }));

    expect(screen.getByLabelText('Current location')).toHaveTextContent(
      '/w/wallet/transaction/deposit-1',
    );
  });

  it('shows a missing-asset state when the requested asset is not in the wallet response', async () => {
    installHandlers({
      assetResponse: { ...assets, items: [] },
      pairItems: [],
      transactionResponse: { items: [], total: 0 },
    });
    renderAssetDetail({ assetId: 'unknown' });

    expect(await screen.findByText('Không tìm thấy tài sản')).toBeVisible();
    expect(screen.queryByText('Biểu đồ giá')).not.toBeInTheDocument();
  });

  it('keeps the price unavailable and omits the chart when the market has no matching pair', async () => {
    installHandlers({ pairItems: [] });
    renderAssetDetail();

    expect(await screen.findByText('Bitcoin')).toBeVisible();
    expect(screen.queryByText('Biểu đồ giá')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeVisible();
  });

  it('offers retry after a contract error and loads fresh wallet data', async () => {
    const user = userEvent.setup();
    let assetsAvailable = false;
    let assetRequests = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        assetRequests += 1;
        return assetsAvailable
          ? HttpResponse.json(assets)
          : HttpResponse.json({ code: 'WALLET_UNAVAILABLE' }, { status: 503 });
      }),
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
      http.get('*/wallet/transactions', () => HttpResponse.json(transactions)),
    );

    renderAssetDetail();

    expect(await screen.findByText('Không thể tải chi tiết tài sản')).toBeVisible();
    assetsAvailable = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Bitcoin')).toBeVisible();
    expect(assetRequests).toBeGreaterThan(1);
  });
});

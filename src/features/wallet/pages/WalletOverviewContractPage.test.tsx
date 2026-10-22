import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { WalletOverviewContractPage } from './WalletOverviewContractPage';

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
      frozen: 0.05,
      inOrder: 0.05,
      usdValue: 16_000,
      change24h: 2.5,
      logoColor: '#F7931A',
    },
    {
      id: 'dust',
      symbol: 'DUST',
      name: 'Dust Asset',
      balance: 0.1,
      available: 0.1,
      frozen: 0,
      inOrder: 0,
      usdValue: 0.25,
      change24h: -1,
      logoColor: '#64748B',
    },
  ],
  summary: {
    totalUsd: 16_000.25,
    totalBtc: 0.25,
    availableUsd: 15_000,
    inOrderUsd: 1_000,
    frozenUsd: 0,
  },
};

const transactions = {
  items: [
    {
      id: 'tx-1',
      type: 'deposit',
      asset: 'BTC',
      amount: 0.1,
      status: 'completed',
      createdAt: '2026-09-21T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'withdraw',
      asset: 'BTC',
      amount: 0.02,
      status: 'pending',
      createdAt: '2026-09-20T10:00:00.000Z',
    },
  ],
  total: 2,
};

function installHandlers() {
  server.use(
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/wallet/transactions', () => HttpResponse.json(transactions)),
  );
}

describe('Wallet overview contract page', () => {
  it('keeps the API asset identifier in one route segment', async () => {
    const id = 'asset/a?b#c%';
    server.use(
      http.get('*/wallet/assets', () =>
        HttpResponse.json({ ...assets, items: [{ ...assets.items[0], id }] }),
      ),
      http.get('*/wallet/transactions', () => HttpResponse.json(transactions)),
    );
    renderWithProviders(
      <>
        <WalletOverviewContractPage />
        <LocationProbe />
      </>,
      {
        routerProps: { initialEntries: ['/w/wallet'] },
      },
    );
    await userEvent.click(await screen.findByRole('button', { name: /BTCBTCBitcoin/ }));
    expect(screen.getByTestId('location').textContent).toBe(
      `/w/wallet/asset/${encodeURIComponent(id)}`,
    );
  });

  it('does not request balances or activity without wallet read permission', async () => {
    let requests = 0;
    const noWalletReadAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };
    server.use(
      http.get('*/wallet/assets', () => {
        requests += 1;
        return HttpResponse.json(assets);
      }),
      http.get('*/wallet/transactions', () => {
        requests += 1;
        return HttpResponse.json(transactions);
      }),
    );

    renderWithProviders(<WalletOverviewContractPage />, { authAdapter: noWalletReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent('Wallet read permission');
    expect(requests).toBe(0);
  });

  it('renders typed balances, assets and recent activity', async () => {
    installHandlers();

    renderWithProviders(<WalletOverviewContractPage />);

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(screen.getAllByText('BTC')).toHaveLength(2);
    expect(screen.getAllByText('Deposit')).toHaveLength(2);
    expect(screen.getByText('Withdrawal')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('$16,000.25')).toBeInTheDocument();
  });

  it('keeps the balance while showing empty activity after a successful empty read', async () => {
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/transactions', () => HttpResponse.json({ items: [], total: 0 })),
    );

    renderWithProviders(<WalletOverviewContractPage />);

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(screen.getByText('$16,000.25')).toBeInTheDocument();
    expect(screen.getByText('No wallet activity yet.')).toBeInTheDocument();
    expect(screen.queryByText('Unable to load wallet')).not.toBeInTheDocument();
  });

  it('shows only wallet actions allowed by the active session', async () => {
    installHandlers();
    const readOnlyWalletAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['wallet:read'],
        },
      },
    };

    renderWithProviders(<WalletOverviewContractPage />, { authAdapter: readOnlyWalletAdapter });

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deposit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transaction history' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Transfer' })).not.toBeInTheDocument();
  });

  it.each([
    {
      permission: 'wallet:withdraw',
      permissions: ['wallet:read', 'wallet:withdraw'],
      visibleAction: 'Withdraw',
      hiddenAction: 'Transfer',
    },
    {
      permission: 'wallet:transfer',
      permissions: ['wallet:read', 'wallet:transfer'],
      visibleAction: 'Transfer',
      hiddenAction: 'Withdraw',
    },
    {
      permission: 'wallet:write',
      permissions: ['wallet:read', 'wallet:write'],
      visibleAction: 'Withdraw',
      hiddenAction: undefined,
    },
    {
      permission: 'transfer:write',
      permissions: ['wallet:read', 'transfer:write'],
      visibleAction: 'Transfer',
      hiddenAction: 'Withdraw',
    },
  ])('honors $permission when showing wallet actions', async (scenario) => {
    installHandlers();
    const authAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: scenario.permissions,
        },
      },
    };

    renderWithProviders(<WalletOverviewContractPage />, { authAdapter });

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deposit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: scenario.visibleAction })).toBeInTheDocument();
    if (scenario.hiddenAction) {
      expect(screen.queryByRole('button', { name: scenario.hiddenAction })).not.toBeInTheDocument();
    } else {
      expect(screen.getByRole('button', { name: 'Transfer' })).toBeInTheDocument();
    }
  });

  it('filters small balances and masks sensitive amounts', async () => {
    installHandlers();

    renderWithProviders(<WalletOverviewContractPage />);
    expect(await screen.findByText('DUST')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Hide small balances'));
    expect(screen.queryByText('DUST')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Toggle balance' }));
    expect(screen.getAllByText('••••').length).toBeGreaterThan(0);
  });

  it('renders the shared error state when either wallet contract fails', async () => {
    server.use(
      http.get('*/wallet/assets', () =>
        HttpResponse.json({ code: 'WALLET_UNAVAILABLE' }, { status: 503 }),
      ),
      http.get('*/wallet/transactions', () => HttpResponse.json(transactions)),
    );

    renderWithProviders(<WalletOverviewContractPage />);

    expect(await screen.findByText('Unable to load wallet')).toBeInTheDocument();
    expect(screen.queryByText('Total balance')).not.toBeInTheDocument();
  });

  it('shows a non-retryable permission state and hides balances when wallet access is denied', async () => {
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(assets)),
      http.get('*/wallet/transactions', () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'Permission denied' }, { status: 403 }),
      ),
    );

    renderWithProviders(<WalletOverviewContractPage />);

    expect(await screen.findByText('Không có quyền truy cập')).toBeInTheDocument();
    expect(
      screen.getByText('Tài khoản của bạn không có quyền xem số dư và hoạt động của ví.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
    expect(screen.queryByText('Total balance')).not.toBeInTheDocument();
    expect(screen.queryByText('No wallet activity yet.')).not.toBeInTheDocument();
  });

  it('preserves the active shell prefix when navigating wallet actions', async () => {
    installHandlers();

    renderWithProviders(
      <>
        <WalletOverviewContractPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/t/wallet'] } },
    );

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Deposit' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/t/wallet/deposit/USDT');
    await userEvent.click(screen.getByRole('button', { name: 'Analytics' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/t/wallet/portfolio-analytics');
  });

  it('searches assets by normalized name and navigates to wallet destinations in the web shell', async () => {
    installHandlers();
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <WalletOverviewContractPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/wallet'] } },
    );

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    const search = screen.getByRole('textbox', { name: 'Search assets' });
    await user.type(search, '  bitcoin ');
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.queryByText('Dust Asset')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'no-such-asset');
    expect(screen.getByText('No assets match this filter.')).toBeInTheDocument();
    await user.clear(search);

    await user.click(screen.getByRole('button', { name: /BTCBTCBitcoin/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/wallet/asset/btc');
    await user.click(screen.getByRole('button', { name: 'Analytics' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/portfolio/analytics');
    await user.click(screen.getByRole('button', { name: 'Transaction history' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/wallet/history');
    await user.click(screen.getByRole('button', { name: 'View all' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/wallet/history');
  });

  it('retries both wallet reads after a transient failure', async () => {
    let assetsAvailable = false;
    let assetRequests = 0;
    let transactionRequests = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        assetRequests += 1;
        return assetsAvailable
          ? HttpResponse.json(assets)
          : HttpResponse.json({ code: 'WALLET_UNAVAILABLE' }, { status: 503 });
      }),
      http.get('*/wallet/transactions', () => {
        transactionRequests += 1;
        return HttpResponse.json(transactions);
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<WalletOverviewContractPage />);

    expect(await screen.findByText('Unable to load wallet')).toBeInTheDocument();
    const previousAssetRequests = assetRequests;
    const previousTransactionRequests = transactionRequests;
    assetsAvailable = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(assetRequests).toBeGreaterThan(previousAssetRequests);
    expect(transactionRequests).toBeGreaterThan(previousTransactionRequests);
  });
});

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  );
}

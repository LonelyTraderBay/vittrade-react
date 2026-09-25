import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
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
  ],
  total: 1,
};

function installHandlers() {
  server.use(
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/wallet/transactions', () => HttpResponse.json(transactions)),
  );
}

describe('Wallet overview contract page', () => {
  it('renders typed balances, assets and recent activity', async () => {
    installHandlers();

    renderWithProviders(<WalletOverviewContractPage />);

    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(screen.getAllByText('BTC')).toHaveLength(2);
    expect(screen.getAllByText('Deposit')).toHaveLength(2);
    expect(screen.getByText('$16,000.25')).toBeInTheDocument();
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
  });
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

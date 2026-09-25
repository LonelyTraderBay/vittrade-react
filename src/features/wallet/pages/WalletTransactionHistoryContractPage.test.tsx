import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { WalletTransactionHistoryContractPage } from './WalletTransactionHistoryContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const response = {
  items: [
    {
      id: 'tx-deposit',
      type: 'deposit',
      asset: 'USDT',
      amount: 100,
      status: 'completed',
      createdAt: '2026-09-21T10:00:00.000Z',
    },
    {
      id: 'tx-withdraw',
      type: 'withdraw',
      asset: 'BTC',
      amount: 0.1,
      status: 'pending',
      createdAt: '2026-09-20T10:00:00.000Z',
      network: 'Bitcoin',
    },
    {
      id: 'tx-trade',
      type: 'trade_buy',
      asset: 'ETH',
      amount: 2,
      status: 'failed',
      createdAt: '2026-09-19T10:00:00.000Z',
    },
  ],
  total: 3,
};

describe('Wallet transaction history contract page', () => {
  it('renders typed transaction rows and summary metrics', async () => {
    server.use(http.get('*/wallet/transactions', () => HttpResponse.json(response)));

    renderWithProviders(<WalletTransactionHistoryContractPage />);

    expect(await screen.findAllByText('Deposit')).toHaveLength(2);
    expect(screen.getByText('Completed deposits')).toBeInTheDocument();
    expect(screen.getByText('Pending transactions')).toBeInTheDocument();
  });

  it('filters by type and search text while keeping filter state local', async () => {
    server.use(http.get('*/wallet/transactions', () => HttpResponse.json(response)));

    renderWithProviders(<WalletTransactionHistoryContractPage />);
    expect(await screen.findByText('Withdrawal')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Deposit' }));
    expect(screen.getAllByText('Deposit')).toHaveLength(2);
    expect(screen.queryByText('Withdrawal')).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Search transactions'));
    await userEvent.type(screen.getByLabelText('Search transactions'), 'BTC');
    expect(screen.getByText('No transactions match the selected filters.')).toBeInTheDocument();
  });

  it('renders the shared error state when transaction history is unavailable', async () => {
    server.use(
      http.get('*/wallet/transactions', () =>
        HttpResponse.json({ code: 'TRANSACTIONS_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Completed deposits')).not.toBeInTheDocument();
  });
});

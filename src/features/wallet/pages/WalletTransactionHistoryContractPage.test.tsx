import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { WalletTransactionHistoryContractPage } from './WalletTransactionHistoryContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const transactions = [
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
  {
    id: 'tx-trade-pending',
    type: 'trade_buy',
    asset: 'BTC',
    amount: 0.01,
    status: 'pending',
    createdAt: '2026-09-18T10:00:00.000Z',
  },
];

function filterTransactions(request: Request) {
  const query = new URL(request.url).searchParams;
  const items = transactions.filter(
    (transaction) =>
      (!query.has('asset') || transaction.asset === query.get('asset')) &&
      (!query.has('type') || transaction.type === query.get('type')) &&
      (!query.has('status') || transaction.status === query.get('status')),
  );
  return { items, total: items.length };
}

describe('Wallet transaction history contract page', () => {
  it('renders transaction rows and the server result count', async () => {
    server.use(
      http.get('*/wallet/transactions', ({ request }) =>
        HttpResponse.json(filterTransactions(request)),
      ),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);

    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('4 transactions')).toBeInTheDocument();
  });

  it('sends exact type, status and asset filters to the server', async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get('*/wallet/transactions', ({ request }) => {
        const query = new URL(request.url).searchParams;
        requests.push(query);
        return HttpResponse.json(filterTransactions(request));
      }),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);
    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    expect(requests[0].get('limit')).toBe('50');
    expect(requests[0].has('cursor')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Trade buy' }));
    expect(await screen.findByText('+0.01', { exact: true })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pending' }));
    expect(await screen.findByText('+0.01', { exact: true })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Filter by asset'), 'btc');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(requests.at(-1)?.get('type')).toBe('trade_buy');
      expect(requests.at(-1)?.get('status')).toBe('pending');
      expect(requests.at(-1)?.get('asset')).toBe('BTC');
    });
    expect(screen.getByText('+0.01', { exact: true })).toBeInTheDocument();
  });

  it('follows server cursors and returns to the prior page', async () => {
    server.use(
      http.get('*/wallet/transactions', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        return cursor
          ? HttpResponse.json({
              items: [transactions[1]],
              total: 2,
            })
          : HttpResponse.json({
              items: [transactions[0]],
              total: 2,
              nextCursor: 'page-2',
            });
      }),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);
    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('-0.1', { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction history pagination')).toHaveTextContent('Page 2');
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
  });

  it('renders the shared error state when transaction history is unavailable', async () => {
    server.use(
      http.get('*/wallet/transactions', () =>
        HttpResponse.json({ code: 'TRANSACTIONS_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('+100', { exact: true })).not.toBeInTheDocument();
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { WalletTransactionHistoryContractPage } from './WalletTransactionHistoryContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const noWalletReadAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
  },
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

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
  it('does not request transaction history without wallet read permission', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/transactions', () => {
        requests += 1;
        return HttpResponse.json({ items: transactions, total: transactions.length });
      }),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />, {
      authAdapter: noWalletReadAdapter,
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Wallet read permission');
    expect(requests).toBe(0);
  });

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

  it('navigates back to the wallet overview from the history header', async () => {
    server.use(
      http.get('*/wallet/transactions', () =>
        HttpResponse.json({ items: transactions, total: transactions.length }),
      ),
    );

    renderWithProviders(
      <>
        <WalletTransactionHistoryContractPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/wallet/history'] } },
    );

    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Wallet' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent(/\/wallet$/);
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

  it('applies the asset filter on Enter and clears the applied filter', async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get('*/wallet/transactions', ({ request }) => {
        const query = new URL(request.url).searchParams;
        requests.push(query);
        const result = filterTransactions(request);
        return HttpResponse.json(
          query.has('cursor') ? result : { ...result, nextCursor: 'history-page-2' },
        );
      }),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);
    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('-0.1', { exact: true })).toBeInTheDocument();

    const assetInput = screen.getByRole('textbox', { name: 'Filter by asset' });
    await userEvent.type(assetInput, 'btc{Enter}');
    expect(await screen.findByText('-0.1', { exact: true })).toBeInTheDocument();
    await waitFor(() => expect(requests.at(-1)?.get('asset')).toBe('BTC'));
    expect(requests.at(-1)?.has('cursor')).toBe(false);
    expect(screen.getByLabelText('Transaction history pagination')).toHaveTextContent('Page 1');

    await userEvent.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    expect(screen.getByRole('textbox', { name: 'Filter by asset' })).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction history pagination')).toHaveTextContent('Page 1');
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

  it('disables Next when the server repeats the current cursor', async () => {
    const requestedCursors: string[] = [];
    server.use(
      http.get('*/wallet/transactions', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        requestedCursors.push(cursor ?? 'first-page');
        return cursor
          ? HttpResponse.json({
              items: [transactions[1]],
              total: 2,
              nextCursor: cursor,
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
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByLabelText('Transaction history pagination')).toHaveTextContent('Page 2');
    expect(requestedCursors).toEqual(['first-page', 'page-2']);
  });

  it('refetches after a missing-session response through the shared error state', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/transactions', () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json(
              { code: 'UNAUTHENTICATED', message: 'Session expired' },
              { status: 401 },
            )
          : HttpResponse.json({ items: transactions, total: transactions.length });
      }),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    expect(screen.queryByText('+100', { exact: true })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    expect(requests).toBe(2);
  });

  it('renders the empty result state when filters match no transactions', async () => {
    server.use(
      http.get('*/wallet/transactions', ({ request }) =>
        HttpResponse.json(filterTransactions(request)),
      ),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);
    expect(await screen.findByText('+100', { exact: true })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Filter by asset'), 'sol');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      await screen.findByText('No transactions match the selected filters.'),
    ).toBeInTheDocument();
  });

  it('shows a non-retryable permission state and hides transaction history when access is denied', async () => {
    server.use(
      http.get('*/wallet/transactions', () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'Permission denied' }, { status: 403 }),
      ),
    );

    renderWithProviders(<WalletTransactionHistoryContractPage />);

    expect(await screen.findByText('Không có quyền truy cập')).toBeInTheDocument();
    expect(
      screen.getByText('Tài khoản của bạn không có quyền xem lịch sử giao dịch ví.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
    expect(screen.queryByText('+100', { exact: true })).not.toBeInTheDocument();
    expect(
      screen.queryByText('No transactions match the selected filters.'),
    ).not.toBeInTheDocument();
  });
});

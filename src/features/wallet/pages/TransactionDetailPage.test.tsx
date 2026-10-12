import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { TransactionDetailPage } from './TransactionDetailPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const transaction = {
  id: 'tx-detail',
  type: 'withdraw',
  asset: 'USDT',
  amount: 12.5,
  status: 'completed',
  txHash: '0x1234567890abcdef',
  network: 'Ethereum',
  address: '0xabcdef1234567890',
  createdAt: '2026-09-24T08:30:00.000Z',
  fee: 0.25,
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

describe('Wallet transaction detail page', () => {
  it.each([
    ['completed', 'Hoàn thành', 'Hoàn tất'],
    ['pending', 'Đang xử lý', 'Đang chờ...'],
    ['failed', 'Thất bại', 'Thất bại'],
  ])(
    'renders the %s status from the transaction contract',
    async (status, statusLabel, stepLabel) => {
      server.use(
        http.get('*/wallet/transactions/tx-detail', () =>
          HttpResponse.json({ ...transaction, status }),
        ),
      );

      renderWithProviders(
        <Routes>
          <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
        </Routes>,
        { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
      );

      expect(await screen.findAllByText(statusLabel)).not.toHaveLength(0);
      expect(screen.getAllByText(stepLabel)).not.toHaveLength(0);
      expect(screen.getByText('0x1234567890abcdef')).toBeVisible();
    },
  );

  it('fails closed when the transaction cannot be loaded', async () => {
    server.use(
      http.get('*/wallet/transactions/tx-detail', () =>
        HttpResponse.json({ code: 'TRANSACTION_NOT_FOUND' }, { status: 404 }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
        <Route path="/wallet/history" element={<p>Wallet history destination</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
    );

    expect(await screen.findByText('Không tìm thấy giao dịch')).toBeVisible();
    expect(screen.queryByText('12.5 USDT')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Quay lại lịch sử' }));
    expect(screen.getByText('Wallet history destination')).toBeVisible();
  });

  it('confirms a hash copy only when the browser clipboard succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    server.use(http.get('*/wallet/transactions/tx-detail', () => HttpResponse.json(transaction)));

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
    );

    const copyButtons = await screen.findAllByRole('button', { name: 'Sao chép' });
    await userEvent.click(copyButtons[0]);

    expect(writeText).toHaveBeenCalledWith('0x1234567890abcdef');
    expect(await screen.findByRole('button', { name: 'Đã sao chép' })).toBeVisible();
  });

  it('shows a failure state when the browser rejects a hash copy', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    server.use(http.get('*/wallet/transactions/tx-detail', () => HttpResponse.json(transaction)));

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
    );

    const copyButtons = await screen.findAllByRole('button', { name: 'Sao chép' });
    await userEvent.click(copyButtons[0]);

    expect(await screen.findByRole('button', { name: 'Không thể sao chép' })).toBeVisible();
  });

  it('shows a failure state when the Clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    server.use(http.get('*/wallet/transactions/tx-detail', () => HttpResponse.json(transaction)));

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
    );

    const copyButtons = await screen.findAllByRole('button', { name: 'Sao chép' });
    await userEvent.click(copyButtons[0]);

    expect(await screen.findByRole('button', { name: 'Không thể sao chép' })).toBeVisible();
  });

  it('navigates to support from the transaction detail page', async () => {
    server.use(http.get('*/wallet/transactions/tx-detail', () => HttpResponse.json(transaction)));

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
        <Route path="/support" element={<p>Support destination</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
    );

    await screen.findByText('0x1234567890abcdef');
    await userEvent.click(screen.getByRole('button', { name: 'Liên hệ hỗ trợ' }));

    expect(screen.getByText('Support destination')).toBeVisible();
  });

  it.each([
    ['deposit', 'Nạp tiền', '+', 'Địa chỉ gửi'],
    ['trade_buy', 'Mua giao dịch', '+', 'Địa chỉ gửi'],
    ['trade_sell', 'Bán giao dịch', '-', 'Địa chỉ nhận'],
    ['p2p_buy', 'P2P Mua', '+', 'Địa chỉ gửi'],
    ['p2p_sell', 'P2P Bán', '-', 'Địa chỉ nhận'],
  ])(
    'shows the %s label and signed value from the transaction type',
    async (type, label, sign, addressLabel) => {
      server.use(
        http.get('*/wallet/transactions/tx-detail', () =>
          HttpResponse.json({ ...transaction, type, status: 'pending', fee: 0 }),
        ),
      );

      renderWithProviders(
        <Routes>
          <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
        </Routes>,
        { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
      );

      expect(await screen.findByText(label)).toBeVisible();
      expect(screen.getByText(addressLabel)).toBeVisible();
      expect(
        screen.getByText(
          (_, element) =>
            element?.tagName === 'P' &&
            (element.textContent ?? '').trim().startsWith(sign) &&
            (element.textContent ?? '').includes('USDT'),
        ),
      ).toBeVisible();
      expect(screen.queryByText('Phí giao dịch')).not.toBeInTheDocument();
    },
  );

  it('omits optional transaction details when the API does not provide them', async () => {
    server.use(
      http.get('*/wallet/transactions/tx-detail', () =>
        HttpResponse.json({
          id: 'tx-detail',
          type: 'deposit',
          asset: 'BTC',
          amount: 0.01,
          status: 'pending',
          createdAt: '2026-09-24T08:30:00.000Z',
        }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
    );

    expect(await screen.findByText('Nạp tiền')).toBeVisible();
    expect(screen.queryByText('Mã giao dịch (TxID)')).not.toBeInTheDocument();
    expect(screen.queryByText('Mạng')).not.toBeInTheDocument();
    expect(screen.queryByText('Địa chỉ gửi')).not.toBeInTheDocument();
    expect(screen.queryByText('Phí giao dịch')).not.toBeInTheDocument();
  });

  it('shows the loading state while the transaction detail request is pending', async () => {
    let markRequestStarted: (() => void) | undefined;
    let releaseResponse: (() => void) | undefined;
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve;
    });
    const responseReleased = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.get('*/wallet/transactions/tx-detail', async () => {
        markRequestStarted?.();
        await responseReleased;
        return HttpResponse.json(transaction);
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] } },
    );

    await requestStarted;
    try {
      expect(screen.getByText('Đang tải chi tiết giao dịch…')).toBeVisible();
    } finally {
      releaseResponse?.();
    }
    expect(await screen.findByText('0x1234567890abcdef')).toBeVisible();
  });

  it('does not request transaction details without wallet read permission', async () => {
    let requested = false;
    server.use(
      http.get('*/wallet/transactions/tx-detail', () => {
        requested = true;
        return HttpResponse.json(transaction);
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/wallet/transaction/:txId" element={<TransactionDetailPage />} />
      </Routes>,
      {
        authAdapter: adapterWithPermissions([]),
        routerProps: { initialEntries: ['/wallet/transaction/tx-detail'] },
      },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wallet read permission is required to view transaction details.',
    );
    expect(requested).toBe(false);
  });
});

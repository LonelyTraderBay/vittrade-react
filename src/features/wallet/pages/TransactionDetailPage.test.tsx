import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
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
        HttpResponse.json({ code: 'TRANSACTION_UNAVAILABLE' }, { status: 503 }),
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
});

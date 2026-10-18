import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { toast } from 'sonner';
import { WithdrawPage } from './WithdrawPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer();

const assets = {
  items: [
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 100,
      available: 75,
      frozen: 25,
      inOrder: 25,
      usdValue: 100,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: { totalUsd: 100, totalBtc: 0.001, availableUsd: 75, inOrderUsd: 25, frozenUsd: 0 },
};

const networks = {
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      fee: 0.5,
      minWithdraw: 5,
      maxWithdraw: 50,
    },
  ],
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function installReadHandlers() {
  server.use(
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/wallet/withdrawal/networks', () => HttpResponse.json(networks)),
  );
}

function getContinueButton() {
  const button = screen
    .getAllByRole('button')
    .find((candidate) => candidate.textContent?.includes('→'));
  if (!button) throw new Error('Withdrawal continue button was not rendered');
  return button;
}

function getButtonContaining(text: string) {
  const button = screen
    .getAllByRole('button')
    .find((candidate) => candidate.textContent?.includes(text));
  if (!button) throw new Error('Button was not rendered: ' + text);
  return button;
}

describe('WithdrawPage additional coverage', () => {
  it('treats an unknown withdrawal receipt status as an unconfirmed outcome', async () => {
    installReadHandlers();
    server.use(
      http.post('*/wallet/withdrawals/challenge', () =>
        HttpResponse.json({
          id: 'challenge-unknown-status-1',
          method: 'totp',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals/challenge/:challengeId/verify', () =>
        HttpResponse.json({
          verificationToken: 'verification-token-unknown-status',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals', () =>
        HttpResponse.json({
          id: 'withdrawal-unknown-status-1',
          transactionId: 'transaction-unknown-status-1',
          asset: 'USDT',
          amount: 12,
          status: 'broadcasting',
          createdAt: '2026-09-22T08:00:00.000Z',
        }),
      ),
    );
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('Xác minh 2FA'));
    await userEvent.type(await screen.findByLabelText(/Mã xác minh/i), '123456');
    await userEvent.click(getButtonContaining('Xác nhận rút tiền'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Chưa xác nhận được kết quả rút tiền. Hãy kiểm tra lịch sử giao dịch trước khi thử lại.',
        { duration: 2000 },
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByText('Xác minh bảo mật')).toBeVisible();
    expect(screen.queryByText('Đang xử lý')).not.toBeInTheDocument();
  });

  it('returns from MFA verification to the form without discarding withdrawal details', async () => {
    installReadHandlers();
    server.use(
      http.post('*/wallet/withdrawals/challenge', () =>
        HttpResponse.json({
          id: 'challenge-back-1',
          method: 'totp',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
    );
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('2FA'));
    expect(await screen.findByLabelText(/Mã xác minh/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Quay lại chỉnh sửa' }));

    expect(await screen.findByRole('combobox')).toHaveValue('ethereum');
    expect(document.getElementById('withdraw-address')).toHaveValue(
      'wallet-address-long-enough-for-validation-123456',
    );
    expect(document.getElementById('withdraw-amount')).toHaveValue(12);
  });

  it('does not request withdrawal data when wallet read permission is missing', async () => {
    let assetReads = 0;
    let networkReads = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        assetReads += 1;
        return HttpResponse.json(assets);
      }),
      http.get('*/wallet/withdrawal/networks', () => {
        networkReads += 1;
        return HttpResponse.json(networks);
      }),
    );
    const noWalletAccessAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };

    renderWithProviders(<WithdrawPage />, {
      authAdapter: noWalletAccessAdapter,
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wallet read permission is required to view withdrawal balances and network policies.',
    );
    expect(assetReads).toBe(0);
    expect(networkReads).toBe(0);
  });

  it('shows a failed withdrawal receipt and warns the user to verify its transaction status', async () => {
    installReadHandlers();
    server.use(
      http.post('*/wallet/withdrawals/challenge', () =>
        HttpResponse.json({
          id: 'challenge-failed-1',
          method: 'totp',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals/challenge/:challengeId/verify', () =>
        HttpResponse.json({
          verificationToken: 'verification-token-failed',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals', () =>
        HttpResponse.json({
          id: 'withdrawal-failed-1',
          transactionId: 'transaction-failed-1',
          asset: 'USDT',
          amount: 12,
          status: 'failed',
          createdAt: '2026-09-22T08:00:00.000Z',
        }),
      ),
    );
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('2FA'));
    await userEvent.type(await screen.findByLabelText(/Mã xác minh/i), '123456');
    await userEvent.click(getButtonContaining('Xác nhận'));

    expect(await screen.findByText('Yêu cầu thất bại')).toBeInTheDocument();
    expect(screen.getByText('withdrawal-failed-1')).toBeInTheDocument();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Yêu cầu rút tiền có trạng thái thất bại. Hãy kiểm tra mã giao dịch trước khi thử lại.',
        { duration: 2000 },
      ),
    );
  });
  it('does not submit a withdrawal when MFA verification fails', async () => {
    installReadHandlers();
    let withdrawalRequested = false;
    server.use(
      http.post('*/wallet/withdrawals/challenge', () =>
        HttpResponse.json({
          id: 'challenge-1',
          method: 'totp',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals/challenge/:challengeId/verify', () =>
        HttpResponse.json({ message: 'Invalid code' }, { status: 401 }),
      ),
      http.post('*/wallet/withdrawals', () => {
        withdrawalRequested = true;
        return HttpResponse.json({ id: 'unexpected' }, { status: 201 });
      }),
    );
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('Xác minh 2FA'));
    await userEvent.type(await screen.findByLabelText(/Mã xác minh/i), '123456');
    await userEvent.click(getButtonContaining('Xác nhận rút tiền'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Mã xác minh không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
        { duration: 2000 },
      ),
    );
    expect(withdrawalRequested).toBe(false);
    expect(screen.getByText('Xác minh bảo mật')).toBeVisible();
  });
});

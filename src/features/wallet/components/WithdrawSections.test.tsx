import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import type {
  WalletWithdrawalChallenge,
  WalletWithdrawalNetwork,
  WalletWithdrawalReceipt,
} from '../model/wallet-types';
import { WithdrawalSuccessState, WithdrawalVerifyState } from './WithdrawSections';

const network: WalletWithdrawalNetwork = {
  id: 'ethereum',
  name: 'Ethereum',
  fee: 0.5,
  minWithdraw: 5,
  maxWithdraw: 50,
};

const receipt: WalletWithdrawalReceipt = {
  id: 'withdrawal-1',
  transactionId: 'transaction-1',
  asset: 'USDT',
  amount: 12.5,
  status: 'pending',
  createdAt: '2026-10-09T08:00:00.000Z',
};

function SuccessState({ status }: { status: WalletWithdrawalReceipt['status'] }) {
  const colors = useThemeColors();

  return (
    <WithdrawalSuccessState
      asset="USDT"
      amount="12.5"
      address="0x1234567890abcdef1234567890abcdef12345678"
      colors={colors}
      fee={0.5}
      received={12}
      receipt={{ ...receipt, status }}
      selectedNetwork={network}
    />
  );
}

function VerifyState({
  onCodeChange,
  onSubmit,
}: {
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
}) {
  const colors = useThemeColors();
  const challenge: WalletWithdrawalChallenge = {
    id: 'challenge-1',
    method: 'sms',
    maskedDestination: '+84 ••• ••• 123',
    expiresAt: '2026-10-09T08:05:00.000Z',
  };

  return (
    <WithdrawalVerifyState
      challenge={challenge}
      code="123456"
      colors={colors}
      errors={{ code: 'Mã xác minh gồm sáu chữ số.' }}
      canWithdraw
      busy={false}
      onCodeChange={onCodeChange}
      onSubmit={onSubmit}
      onBack={vi.fn()}
    />
  );
}

describe('WithdrawSections', () => {
  it.each([
    ['pending', 'Yêu cầu đang xử lý', 'Đang xử lý'],
    ['completed', 'Yêu cầu hoàn tất', 'Hoàn tất'],
    ['failed', 'Yêu cầu thất bại', 'Thất bại'],
  ] as const)('renders the %s withdrawal receipt state', (status, heading, label) => {
    renderWithProviders(<SuccessState status={status} />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText('withdrawal-1')).toBeInTheDocument();
    expect(screen.getByText('transaction-1')).toBeInTheDocument();
  });

  it('renders the SMS destination and code error, strips non-digits, and submits six digits', () => {
    const onCodeChange = vi.fn();
    const onSubmit = vi.fn();
    renderWithProviders(<VerifyState onCodeChange={onCodeChange} onSubmit={onSubmit} />);

    expect(screen.getByText(/SMS \(\+84/)).toBeInTheDocument();
    expect(screen.getByText('Mã xác minh gồm sáu chữ số.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Mã xác minh 2FA'), {
      target: { value: '12x345678' },
    });
    expect(onCodeChange).toHaveBeenLastCalledWith('123456');

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rút tiền' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { ButtonGradients, ButtonTextColors } from '@/shared/theme/button';
import { OrderConfirmationSheet, type OrderConfirmationSheetProps } from './OrderConfirmationSheet';

const defaultProps: OrderConfirmationSheetProps = {
  open: true,
  isPlacing: false,
  canConfirm: true,
  side: 'buy',
  pair: { symbol: 'BTC/USDT', baseAsset: 'BTC' },
  orderTypeLabel: 'Giới hạn',
  isMarket: false,
  limitPrice: '65000',
  amount: '0.1',
  total: 6_500,
  tpsl: {
    enabled: true,
    tpPrice: '67000',
    slPrice: '63000',
    tpTriggerType: 'last',
    slTriggerType: 'last',
  },
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

function renderSheet(overrides: Partial<OrderConfirmationSheetProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  renderWithProviders(<OrderConfirmationSheet {...props} />);
  return props;
}

describe('OrderConfirmationSheet', () => {
  it('summarizes a limit order, server-confirmed fee status, and configured TP/SL values', () => {
    renderSheet();

    expect(screen.getByRole('dialog', { name: 'Xác nhận lệnh' })).toBeInTheDocument();
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('$65,000.00')).toBeInTheDocument();
    expect(screen.getByText('0.1 BTC')).toBeInTheDocument();
    expect(screen.getByText('Sẽ được xác nhận từ máy chủ')).toBeInTheDocument();
    expect(screen.getByText('Take Profit')).toBeInTheDocument();
    expect(screen.getByText('Stop Loss')).toBeInTheDocument();
    expect(screen.queryByText('Trượt giá tối đa')).not.toBeInTheDocument();
  });

  it('does not show an unsupported slippage quote for market orders', () => {
    renderSheet({ isMarket: true });

    expect(screen.queryByText('Trượt giá tối đa')).not.toBeInTheDocument();
    expect(screen.queryByText(/ước tính.*%/i)).not.toBeInTheDocument();
  });

  it('disables confirmation and shows pending feedback while placing', () => {
    renderSheet({ isPlacing: true });

    expect(screen.getByRole('button', { name: 'Đang đặt lệnh...' })).toBeDisabled();
  });

  it('explains when trading permission is lost while confirmation is open', () => {
    renderSheet({ canConfirm: false });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tài khoản không có quyền đặt lệnh. Đóng xác nhận và kiểm tra phiên hoặc quyền tài khoản.',
    );
    expect(screen.getByTestId('trade-confirm-submit')).toBeDisabled();
  });

  it.each([
    ['buy', 'Xác nhận Mua', 'success'],
    ['sell', 'Xác nhận Bán', 'danger'],
  ] as const)('uses the shared %s action colors', (side, label, variant) => {
    renderSheet({ side });

    const action = screen.getByRole('button', { name: label });
    expect(action).toHaveStyle({
      background: ButtonGradients[variant],
      color: ButtonTextColors[variant],
    });
  });

  it('passes confirmation and close actions to the owning flow', () => {
    const props = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận Mua' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));

    expect(props.onConfirm).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('does not render while closed', () => {
    renderSheet({ open: false });

    expect(screen.queryByRole('dialog', { name: 'Xác nhận lệnh' })).not.toBeInTheDocument();
  });
});

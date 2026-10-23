import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import {
  getRenderedReactHandler,
  invokeStaleReactHandler,
} from '@/test/invoke-stale-react-handler';
import type { TradingOrder } from '../model/trading-types';
import { OrderModifySheet } from './OrderModifySheet';

const order: TradingOrder = {
  id: 'open-order-123456',
  symbol: 'BTC/USDT',
  side: 'buy',
  type: 'limit',
  price: 64_500,
  amount: 0.1,
  filled: 0,
  status: 'open',
  createdAt: '2026-09-22T09:00:00.000Z',
  fee: 0,
};

function renderSheet({
  canWrite = true,
  isPending = false,
  selectedOrder = order,
  onClose = vi.fn(),
  onSave = vi.fn(),
}: {
  canWrite?: boolean;
  isPending?: boolean;
  selectedOrder?: TradingOrder | null;
  onClose?: () => void;
  onSave?: (values: { orderId: string; price: number; amount: number }) => void | Promise<void>;
} = {}) {
  renderWithProviders(
    <OrderModifySheet
      open
      order={selectedOrder}
      canWrite={canWrite}
      isPending={isPending}
      onClose={onClose}
      onSave={onSave}
    />,
  );
  return { onClose, onSave };
}

describe('OrderModifySheet', () => {
  it('prefills the selected order and describes the trading pair', () => {
    renderSheet();

    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByLabelText('Giá mới (USDT)')).toHaveValue(64_500);
    expect(screen.getByLabelText('Khối lượng mới')).toHaveValue(0.1);
  });

  it('shows sell-side labels and colors for a sell order', () => {
    renderSheet({ selectedOrder: { ...order, side: 'sell' } });

    expect(screen.getByText('BÁN')).toBeInTheDocument();
    expect(screen.queryByText('MUA')).not.toBeInTheDocument();
  });

  it('submits finite positive values for the selected order', () => {
    const { onSave } = renderSheet();

    fireEvent.change(screen.getByLabelText('Giá mới (USDT)'), { target: { value: '66000.5' } });
    fireEvent.change(screen.getByLabelText('Khối lượng mới'), { target: { value: '0.25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(onSave).toHaveBeenCalledWith({ orderId: order.id, price: 66_000.5, amount: 0.25 });
  });

  it.each([
    ['blank price', '', '0.1'],
    ['zero price', '0', '0.1'],
    ['zero amount', '64500', '0'],
  ])('blocks saving when %s is invalid', (_caseName, price, amount) => {
    const { onSave } = renderSheet();

    fireEvent.change(screen.getByLabelText('Giá mới (USDT)'), { target: { value: price } });
    fireEvent.change(screen.getByLabelText('Khối lượng mới'), { target: { value: amount } });

    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('disables editing submission for a read-only session', () => {
    renderSheet({ canWrite: false });

    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  });

  it('communicates an unresolved save while preventing another submission', () => {
    const { onSave } = renderSheet({ isPending: true });
    const submit = screen.getByRole('button', { name: 'Đang lưu...' });

    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(submit);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('keeps the save callback blocked if a read-only button emits a click anyway', () => {
    const { onSave } = renderSheet({ canWrite: false });
    const saveButton = screen.getByRole('button', { name: 'Lưu thay đổi' });

    // Simulate a stale child event after permission changed; the handler must
    // re-check its permission instead of relying only on the disabled button.
    invokeStaleReactHandler(saveButton, 'onClick');

    expect(onSave).not.toHaveBeenCalled();
  });

  it('keeps invalid values blocked if a stale save callback fires', () => {
    const { onSave } = renderSheet();
    fireEvent.change(screen.getByLabelText('Giá mới (USDT)'), { target: { value: '' } });
    const saveButton = screen.getByRole('button', { name: 'Lưu thay đổi' });

    expect(saveButton).toBeDisabled();
    invokeStaleReactHandler(saveButton, 'onClick');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/Thay đổi:/)).toBeInTheDocument();
  });

  it('uses a finite display fallback for a malformed decimal draft', () => {
    renderSheet();
    const price = screen.getByLabelText('Giá mới (USDT)');
    const onChange = getRenderedReactHandler(price, 'onChange');

    act(() => onChange({ target: { value: '.' } }));

    expect(screen.getByText(/Thay đổi:/)).toHaveTextContent('-100.00%');
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  });

  it('closes the sheet when the user cancels', () => {
    const { onClose } = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

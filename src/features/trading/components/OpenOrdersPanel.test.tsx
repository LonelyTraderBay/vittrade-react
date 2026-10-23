import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { TradingOrder } from '../model/trading-types';
import { OpenOrdersPanel } from './OpenOrdersPanel';

const order: TradingOrder = {
  id: 'open-order-123456',
  symbol: 'BTC/USDT',
  side: 'buy',
  type: 'limit',
  price: 64_500,
  amount: 0.1,
  filled: 0.05,
  status: 'partial',
  createdAt: '2026-09-22T09:00:00.000Z',
  fee: 0,
  bracketMode: true,
  ocoLinked: true,
  tpPrice: 67_000,
  slPrice: 63_000,
};

function renderPanel({
  orders = [order],
  canWrite = true,
  cancelPending = false,
  pendingCancelOrderId,
  onModifyOrder = vi.fn(),
  onCancelOrder = vi.fn(),
  onExportHistory = vi.fn(),
}: {
  orders?: TradingOrder[];
  canWrite?: boolean;
  cancelPending?: boolean;
  pendingCancelOrderId?: string;
  onModifyOrder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onExportHistory?: () => void;
} = {}) {
  renderWithProviders(
    <OpenOrdersPanel
      orders={orders}
      canWrite={canWrite}
      cancelPending={cancelPending}
      pendingCancelOrderId={pendingCancelOrderId}
      onModifyOrder={onModifyOrder}
      onCancelOrder={onCancelOrder}
      onExportHistory={onExportHistory}
    />,
  );
  return { onModifyOrder, onCancelOrder, onExportHistory };
}

describe('OpenOrdersPanel', () => {
  it('identifies a sell bracket independently of OCO linking', () => {
    renderPanel({ orders: [{ ...order, side: 'sell', ocoLinked: false }] });
    expect(screen.getByText('BÁN')).toBeInTheDocument();
    expect(screen.queryByText('MUA')).not.toBeInTheDocument();
    expect(screen.queryByText('OCO')).not.toBeInTheDocument();
    expect(screen.getByText('Đã khớp 50%')).toBeInTheDocument();
  });
  it('renders the empty state and keeps the export action available', () => {
    const { onExportHistory } = renderPanel({ orders: [] });

    expect(screen.getByText('Không có lệnh đang mở')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xuất lịch sử giao dịch' }));
    expect(onExportHistory).toHaveBeenCalledOnce();
  });

  it('renders order protection and partial-fill details and wires actions', () => {
    const { onModifyOrder, onCancelOrder } = renderPanel();

    expect(screen.getByText('Bracket')).toBeInTheDocument();
    expect(screen.getByText('OCO')).toBeInTheDocument();
    expect(screen.getByText('Đã khớp 50%')).toBeInTheDocument();
    expect(screen.getByText('TP 67,000.00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sửa' }));
    fireEvent.click(screen.getByTestId(`cancel-order-${order.id}`));

    expect(onModifyOrder).toHaveBeenCalledWith(order.id);
    expect(onCancelOrder).toHaveBeenCalledWith(order.id);
  });

  it('disables both order mutations for a read-only session', () => {
    renderPanel({ canWrite: false });

    expect(screen.getByRole('button', { name: 'Sửa' })).toBeDisabled();
    expect(screen.getByTestId(`cancel-order-${order.id}`)).toBeDisabled();
  });

  it('disables cancellation while the cancellation mutation is pending', () => {
    renderPanel({ cancelPending: true });

    expect(screen.getByRole('button', { name: 'Sửa' })).toBeEnabled();
    expect(screen.getByTestId(`cancel-order-${order.id}`)).toBeDisabled();
  });

  it('identifies only the cancellation target as busy while blocking all cancel actions', () => {
    const otherOrder = { ...order, id: 'open-order-other' };
    const { onCancelOrder } = renderPanel({
      orders: [order, otherOrder],
      cancelPending: true,
      pendingCancelOrderId: order.id,
    });

    const target = screen.getByTestId(`cancel-order-${order.id}`);
    const other = screen.getByTestId(`cancel-order-${otherOrder.id}`);
    expect(target).toBeDisabled();
    expect(target).toHaveTextContent('Đang hủy...');
    expect(target).toHaveAttribute('aria-busy', 'true');
    expect(other).toBeDisabled();
    expect(other).toHaveTextContent('Hủy');
    expect(other).toHaveAttribute('aria-busy', 'false');
    fireEvent.click(target);
    fireEvent.click(other);
    expect(onCancelOrder).not.toHaveBeenCalled();
  });
});

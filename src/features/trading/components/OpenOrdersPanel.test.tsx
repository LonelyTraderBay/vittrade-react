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
  onModifyOrder = vi.fn(),
  onCancelOrder = vi.fn(),
  onExportHistory = vi.fn(),
}: {
  orders?: TradingOrder[];
  canWrite?: boolean;
  cancelPending?: boolean;
  onModifyOrder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onExportHistory?: () => void;
} = {}) {
  renderWithProviders(
    <OpenOrdersPanel
      orders={orders}
      canWrite={canWrite}
      cancelPending={cancelPending}
      onModifyOrder={onModifyOrder}
      onCancelOrder={onCancelOrder}
      onExportHistory={onExportHistory}
    />,
  );
  return { onModifyOrder, onCancelOrder, onExportHistory };
}

describe('OpenOrdersPanel', () => {
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
});

import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { TradingOrder } from '../model/trading-types';
import { OrderHistoryPanel } from './OrderHistoryPanel';

const orders: TradingOrder[] = [
  {
    id: 'history-filled',
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    price: 64_500,
    amount: 0.1,
    filled: 0.1,
    status: 'filled',
    createdAt: '2026-09-22T09:00:00.000Z',
    fee: 6.45,
  },
  {
    id: 'history-cancelled',
    symbol: 'ETH/USDT',
    side: 'sell',
    type: 'limit',
    price: 3_500,
    amount: 2,
    filled: 0,
    status: 'cancelled',
    createdAt: '2026-09-22T08:00:00.000Z',
    fee: 0,
  },
  {
    id: 'history-partial',
    symbol: 'SOL/USDT',
    side: 'sell',
    type: 'limit',
    price: 140,
    amount: 4,
    filled: 1,
    status: 'partial',
    createdAt: '2026-09-22T07:00:00.000Z',
    fee: 0.56,
  },
];

describe('OrderHistoryPanel', () => {
  it('shows order outcomes and passes the selected order to its route action', () => {
    const onSelectOrder = vi.fn();
    const onExportHistory = vi.fn();

    renderWithProviders(
      <OrderHistoryPanel
        orders={orders}
        onSelectOrder={onSelectOrder}
        onExportHistory={onExportHistory}
      />,
    );

    expect(screen.getByText('Đã khớp')).toBeInTheDocument();
    expect(screen.getByText('Đã hủy')).toBeInTheDocument();
    expect(screen.getByText('Một phần')).toBeInTheDocument();
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getByText(/6\.45/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('ETH/USDT'));
    fireEvent.click(screen.getByRole('button', { name: 'Xuất lịch sử giao dịch' }));

    expect(onSelectOrder).toHaveBeenCalledWith(orders[1]);
    expect(onExportHistory).toHaveBeenCalledOnce();
  });

  it('keeps the export action visible when there is no history', () => {
    const onExportHistory = vi.fn();

    renderWithProviders(
      <OrderHistoryPanel orders={[]} onSelectOrder={vi.fn()} onExportHistory={onExportHistory} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xuất lịch sử giao dịch' }));
    expect(onExportHistory).toHaveBeenCalledOnce();
  });
});

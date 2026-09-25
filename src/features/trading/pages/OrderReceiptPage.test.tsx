import { describe, expect, it } from 'vitest';
import { useLocation } from 'react-router';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { OrderReceiptPage } from './OrderReceiptPage';

const order = {
  orderId: 'server-order-42',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  side: 'buy' as const,
  orderType: 'Giới hạn',
  price: 65_000,
  amount: 0.1,
  total: 6_500,
  fee: 12.34,
  timestamp: '2026-09-24T10:00:00.000Z',
  status: 'open' as const,
  tpPrice: 67_000,
  slPrice: 63_000,
};

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('OrderReceiptPage', () => {
  it('renders validated order data and the fee returned by the server', () => {
    renderWithProviders(<OrderReceiptPage />, {
      routerProps: {
        initialEntries: [{ pathname: '/trade/order-receipt', state: { order } }],
      },
    });

    expect(screen.getByText('server-order-42')).toBeInTheDocument();
    expect(screen.getByText('Đang mở')).toBeInTheDocument();
    expect(screen.getByText('$12.34')).toBeInTheDocument();
    expect(screen.getByText(/67,000/)).toBeInTheDocument();
    expect(screen.getByText(/63,000/)).toBeInTheDocument();
    expect(screen.queryByText(/VIP|Standard|discount/i)).not.toBeInTheDocument();
  });

  it('shows a recoverable error when navigation state is missing', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <OrderReceiptPage />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/trade/order-receipt'] } },
    );

    expect(screen.getByText('Không có dữ liệu biên nhận')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại giao dịch' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/trade');
  });
});

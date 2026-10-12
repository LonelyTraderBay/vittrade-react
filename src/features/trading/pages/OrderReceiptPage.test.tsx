import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router';
import { waitFor } from '@testing-library/react';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { OrderReceiptPage } from './OrderReceiptPage';

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast: toastMocks }));

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

function renderReceipt(overrides: Record<string, unknown> = {}) {
  return renderWithProviders(
    <>
      <OrderReceiptPage />
      <CurrentPath />
    </>,
    {
      routerProps: {
        initialEntries: [
          { pathname: '/trade/order-receipt', state: { order: { ...order, ...overrides } } },
        ],
      },
    },
  );
}

function installClipboard(writeText: (value: string) => Promise<void>) {
  const previousDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });

  return () => {
    if (previousDescriptor) {
      Object.defineProperty(window.navigator, 'clipboard', previousDescriptor);
    } else {
      Reflect.deleteProperty(window.navigator, 'clipboard');
    }
  };
}

describe('OrderReceiptPage', () => {
  beforeEach(() => {
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('renders validated order data and the fee returned by the server', () => {
    renderReceipt();

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

  it('shows the contract-valid sell state and keeps an invalid timestamp readable', () => {
    renderReceipt({
      side: 'sell',
      status: 'rejected',
      timestamp: 'timestamp supplied by legacy navigation state',
      tpPrice: undefined,
      slPrice: undefined,
    });

    expect(screen.getByText('Lệnh Bán BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('BÁN')).toBeInTheDocument();
    expect(screen.getByText('Bị từ chối')).toBeInTheDocument();
    expect(screen.getByText('timestamp supplied by legacy navigation state')).toBeInTheDocument();
    expect(screen.queryByText('Quản lý rủi ro')).not.toBeInTheDocument();
  });

  it.each([
    ['take-profit only', { tpPrice: 67_000, slPrice: undefined }, 'Take Profit', '67,000'],
    ['stop-loss only', { tpPrice: undefined, slPrice: 63_000 }, 'Stop Loss', '63,000'],
  ])('renders the %s risk price independently', (_caseName, prices, label, formattedPrice) => {
    renderReceipt(prices);

    expect(screen.getByText('Quản lý rủi ro')).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(formattedPrice))).toBeInTheDocument();
    expect(
      screen.queryByText(label === 'Take Profit' ? 'Stop Loss' : 'Take Profit'),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['filled', 'Đã khớp'],
    ['partial', 'Khớp một phần'],
    ['cancelled', 'Đã hủy'],
    ['rejected', 'Bị từ chối'],
  ] as const)('shows the server status label for %s orders', (status, label) => {
    renderReceipt({ status });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('copies the server order ID and shows success feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const restoreClipboard = installClipboard(writeText);

    try {
      expect(navigator.clipboard.writeText).toBe(writeText);
      renderReceipt();
      await user.click(screen.getByRole('button', { name: 'Sao chép Order ID' }));

      await waitFor(() => expect(writeText).toHaveBeenCalledWith(order.orderId));
      expect(toastMocks.success).toHaveBeenCalledWith('Đã sao chép Order ID', { duration: 1500 });
      expect(toastMocks.error).not.toHaveBeenCalled();
    } finally {
      restoreClipboard();
    }
  });

  it('shows an error when copying the order ID is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    const user = userEvent.setup();
    const restoreClipboard = installClipboard(writeText);

    try {
      renderReceipt();
      await user.click(screen.getByRole('button', { name: 'Sao chép Order ID' }));

      await waitFor(() =>
        expect(toastMocks.error).toHaveBeenCalledWith(
          'Không thể sao chép Order ID trên thiết bị này.',
          { duration: 2000 },
        ),
      );
      expect(writeText).toHaveBeenCalledWith(order.orderId);
      expect(toastMocks.success).not.toHaveBeenCalled();
    } finally {
      restoreClipboard();
    }
  });

  it.each([
    ['order history', 'Lịch sử lệnh', '/trade/orders-history'],
    ['normalized market', 'Tiếp tục giao dịch', '/trade/btc-usdt'],
  ])('navigates to %s from the receipt footer', async (_routeName, buttonName, expectedPath) => {
    const user = userEvent.setup();
    renderReceipt();

    await user.click(screen.getByRole('button', { name: buttonName }));

    expect(screen.getByTestId('current-path')).toHaveTextContent(expectedPath);
  });

  it('shows a recoverable error for malformed receipt data', () => {
    renderWithProviders(<OrderReceiptPage />, {
      routerProps: {
        initialEntries: [
          { pathname: '/trade/order-receipt', state: { order: { ...order, status: 'pending' } } },
        ],
      },
    });

    expect(screen.getByText('Không có dữ liệu biên nhận')).toBeInTheDocument();
  });
});

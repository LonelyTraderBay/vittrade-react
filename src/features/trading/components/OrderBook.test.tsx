import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse, type HttpResponseResolver } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { OrderBook } from './OrderBook';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const orderBook = {
  asks: [
    { price: 150, amount: 0.25, total: 37.5, depth: 0.5 },
    { price: 10, amount: 0.01, total: 0.1, depth: 0.25 },
    { price: 0.1234567, amount: 0.0005, total: 0.0000617, depth: 0.1 },
    ...Array.from({ length: 9 }, (_, index) => ({
      price: 200 + index,
      amount: 1,
      total: 1,
      depth: 0.1,
    })),
  ],
  bids: Array.from({ length: 9 }, (_, index) => ({
    price: 0.5 + index / 100,
    amount: 0.0004,
    total: 1.234,
    depth: 0.25,
  })),
  updatedAt: '2026-09-27T08:30:00.000Z',
};

function installOrderBookHandler(
  handler: HttpResponseResolver = () => HttpResponse.json(orderBook),
) {
  server.use(http.get('*/market/pairs/btc-usdt/orderbook', handler));
}

function renderOrderBook() {
  return renderWithProviders(<OrderBook pairId="btc-usdt" price={67_543.21} change24h={-2.34} />);
}

describe('OrderBook', () => {
  it('shows the localized pending state while the order book request is in flight', () => {
    installOrderBookHandler(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json(orderBook);
    });
    renderOrderBook();

    expect(screen.getByText('Đang tải sổ lệnh…')).toBeVisible();
  });

  it('renders formatted asks, bids and last price, capped at eight rows per side', async () => {
    installOrderBookHandler();
    renderOrderBook();

    expect(await screen.findByText('150.00')).toBeVisible();
    expect(screen.getByText('10.0000')).toBeVisible();
    expect(screen.getByText('0.123457')).toBeVisible();
    expect(screen.getByText('0.2500')).toBeVisible();
    expect(screen.getAllByText('0.000400')).toHaveLength(8);
    expect(screen.getByText('67,543.21')).toBeVisible();
    expect(screen.getByText(/↓/)).toBeVisible();
    expect(screen.getByText('204.00')).toBeVisible();
    expect(screen.queryByText('205.00')).not.toBeInTheDocument();
    expect(screen.getByText('0.570000')).toBeVisible();
    expect(screen.queryByText('0.580000')).not.toBeInTheDocument();
    expect(screen.getAllByText('1.00')).toHaveLength(5);
  });

  it('shows an error and retries the request when requested', async () => {
    let requestCount = 0;
    installOrderBookHandler(() => {
      requestCount += 1;
      return requestCount <= 3
        ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
        : HttpResponse.json(orderBook);
    });
    renderOrderBook();

    expect(await screen.findByText('Không tải được sổ lệnh')).toBeVisible();
    expect(requestCount).toBe(3);

    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('150.00')).toBeVisible();
    expect(requestCount).toBe(4);
  });
});

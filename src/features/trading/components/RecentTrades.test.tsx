import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/test/test-utils';
import { RecentTrades } from './RecentTrades';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('RecentTrades', () => {
  it('formats trade prices by magnitude and limits rendered rows', async () => {
    server.use(
      http.get('*/market/pairs/btc-usdt/trades', () =>
        HttpResponse.json({
          items: [
            {
              id: 'large-price',
              price: 120.2,
              amount: 0.125,
              side: 'buy',
              time: '2026-09-27T10:00:00.000Z',
            },
            {
              id: 'mid-price',
              price: 12.345678,
              amount: 0.25,
              side: 'sell',
              time: '2026-09-27T10:01:00.000Z',
            },
            {
              id: 'small-price',
              price: 0.654321,
              amount: 1.5,
              side: 'buy',
              time: '2026-09-27T10:02:00.000Z',
            },
          ],
        }),
      ),
    );

    renderWithProviders(<RecentTrades pairId="btc-usdt" maxRows={2} />);

    expect(await screen.findByText('120.20')).toBeInTheDocument();
    expect(screen.getByText('12.3457')).toBeInTheDocument();
    expect(screen.getByText('0.1250')).toBeInTheDocument();
    expect(screen.getByText('0.2500')).toBeInTheDocument();
    expect(screen.queryByText('0.654321')).not.toBeInTheDocument();
  });

  it('shows an error with retry and recovers from a failed contract request', async () => {
    let requests = 0;
    server.use(
      http.get('*/market/pairs/btc-usdt/trades', () => {
        requests += 1;
        if (requests <= 3) {
          return HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({
          items: [
            {
              id: 'recovered-trade',
              price: 0.75,
              amount: 2,
              side: 'buy',
              time: '2026-09-27T10:00:00.000Z',
            },
          ],
        });
      }),
    );

    renderWithProviders(<RecentTrades pairId="btc-usdt" />);

    expect(await screen.findByText('Không tải được giao dịch')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('0.750000')).toBeInTheDocument();
    await waitFor(() => expect(requests).toBe(4));
  });
});

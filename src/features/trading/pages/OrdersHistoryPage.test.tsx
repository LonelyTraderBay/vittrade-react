import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { OrdersHistoryPage } from './OrdersHistoryPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    },
  };
}

function order(
  overrides: Partial<{
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    status: 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';
    filled: number;
    createdAt: string;
  }> = {},
) {
  return {
    id: 'order-1',
    symbol: 'BTC/USDT',
    side: 'buy' as const,
    type: 'limit' as const,
    price: 65_000,
    amount: 0.1,
    filled: 0,
    status: 'open' as const,
    createdAt: '2026-09-25T10:00:00.000Z',
    fee: 0.65,
    ...overrides,
  };
}

describe('OrdersHistoryPage', () => {
  it('filters by server side and navigates cursors for open and historical orders', async () => {
    const requests: Array<{
      path: string;
      side: string | null;
      status: string | null;
      cursor: string | null;
      limit: string | null;
    }> = [];

    server.use(
      http.get('*/trading/orders', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams;
        requests.push({
          path: url.pathname,
          side: query.get('side'),
          status: query.get('status'),
          cursor: query.get('cursor'),
          limit: query.get('limit'),
        });
        if (query.get('side') === 'sell' && query.get('cursor') === 'open-page-2') {
          return HttpResponse.json({
            items: [
              order({
                id: 'open-2',
                symbol: 'ADA/USDT',
                side: 'sell',
                filled: 0.05,
                status: 'partial',
              }),
            ],
          });
        }
        if (query.get('side') === 'sell') {
          return HttpResponse.json({
            items: [order({ id: 'open-sell', symbol: 'SELL/USDT', side: 'sell' })],
            nextCursor: 'open-page-2',
          });
        }
        return HttpResponse.json({ items: [order()], nextCursor: 'open-page-2' });
      }),
      http.get('*/trading/orders/history', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams;
        requests.push({
          path: url.pathname,
          side: query.get('side'),
          status: query.get('status'),
          cursor: query.get('cursor'),
          limit: query.get('limit'),
        });
        return query.get('cursor') === 'history-page-2'
          ? HttpResponse.json({
              items: [
                order({
                  id: 'history-2',
                  symbol: 'ETH/USDT',
                  side: 'sell',
                  status: 'filled',
                  filled: 0.1,
                }),
              ],
            })
          : HttpResponse.json({
              items: [
                order({ id: 'history-1', symbol: 'BNB/USDT', side: 'sell', status: 'cancelled' }),
              ],
              nextCursor: 'history-page-2',
            });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:read', 'trade:write']),
    });

    expect(await screen.findByText('BTC/USDT', { exact: true })).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      path: '/api/trading/orders',
      side: null,
      status: 'open',
      cursor: null,
      limit: '50',
    });

    await user.click(screen.getByRole('button', { name: 'Bán' }));
    expect(await screen.findByText('SELL/USDT', { exact: true })).toBeInTheDocument();
    expect(requests.at(-1)).toMatchObject({ side: 'sell', cursor: null });

    await user.click(screen.getByRole('button', { name: 'Sau' }));
    expect(await screen.findByText('ADA/USDT', { exact: true })).toBeInTheDocument();
    expect(requests.at(-1)).toMatchObject({ path: '/api/trading/orders', cursor: 'open-page-2' });

    await user.click(screen.getByRole('button', { name: 'Lịch sử' }));
    expect(await screen.findByText('BNB/USDT', { exact: true })).toBeInTheDocument();
    expect(requests.at(-1)).toMatchObject({
      path: '/api/trading/orders/history',
      side: 'sell',
      cursor: null,
      limit: '50',
    });

    await user.click(screen.getByRole('button', { name: 'Sau' }));
    expect(await screen.findByText('ETH/USDT', { exact: true })).toBeInTheDocument();
    expect(requests.at(-1)).toMatchObject({ cursor: 'history-page-2' });

    await user.click(screen.getByRole('button', { name: 'Trước' }));
    expect(await screen.findByText('BNB/USDT', { exact: true })).toBeInTheDocument();
    await waitFor(() =>
      expect(requests.filter((item) => item.path.endsWith('/history'))).toHaveLength(2),
    );
  });

  it('does not request open or historical orders without trade read permission', async () => {
    const requests: string[] = [];
    server.use(
      http.get('*/trading/orders', ({ request }) => {
        requests.push(new URL(request.url).pathname);
        return HttpResponse.json({ items: [] });
      }),
      http.get('*/trading/orders/history', ({ request }) => {
        requests.push(new URL(request.url).pathname);
        return HttpResponse.json({ items: [] });
      }),
    );

    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:write']),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('không có quyền xem lệnh');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Lịch sử' }));
    expect(screen.getByRole('alert')).toHaveTextContent('không có quyền xem lệnh');
    expect(requests).toEqual([]);
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { invokeStaleReactHandler } from '@/test/invoke-stale-react-handler';
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

  it('disables forward pagination when the current response has no cursor', async () => {
    server.use(
      http.get('*/trading/orders', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        return cursor
          ? HttpResponse.json({ items: [order({ id: 'order-2', symbol: 'ETH/USDT' })] })
          : HttpResponse.json({ items: [order()], nextCursor: 'open-page-2' });
      }),
    );

    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('BTC/USDT', { exact: true })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sau' }));
    expect(await screen.findByText('ETH/USDT', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sau' })).toBeDisabled();
  });

  it('surfaces an unconfirmed cancellation and retains its key for an explicit retry', async () => {
    const keys: (string | null)[] = [];
    let cancelled = false;
    server.use(
      http.get('*/trading/orders', () => HttpResponse.json({ items: cancelled ? [] : [order()] })),
      http.post('*/trading/orders/order-1/cancel', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'));
        if (keys.length === 1) return HttpResponse.error();
        cancelled = true;
        return HttpResponse.json(order({ status: 'cancelled' }));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:read', 'trade:write']),
    });

    await user.click(await screen.findByRole('button', { name: 'Hủy lệnh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chưa xác nhận được kết quả hủy lệnh',
    );
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^cancel-order-1-/);
    await user.click(screen.getByRole('button', { name: 'Hủy lệnh' }));
    expect(await screen.findByText('Không có lệnh đang mở')).toBeInTheDocument();
    expect(keys).toEqual([keys[0], keys[0]]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits only one cancellation before the pending render and blocks the pending button', async () => {
    let resolveResponse!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolveResponse = resolve;
    });
    let requests = 0;
    server.use(
      http.get('*/trading/orders', () => HttpResponse.json({ items: [order()] })),
      http.post('*/trading/orders/order-1/cancel', async () => {
        requests += 1;
        await pending;
        return HttpResponse.json(order({ status: 'cancelled' }));
      }),
    );
    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:read', 'trade:write']),
    });
    const button = await screen.findByRole('button', { name: 'Hủy lệnh' });
    try {
      act(() => {
        fireEvent.click(button);
        fireEvent.click(button);
      });
      await waitFor(() => expect(requests).toBe(1));
      expect(screen.getByRole('button', { name: 'Đang hủy…' })).toBeDisabled();
    } finally {
      resolveResponse();
    }
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hủy lệnh' })).toBeEnabled());
    expect(requests).toBe(1);
  });

  it.each([
    { id: 'order-1', status: 'open' as const },
    { id: 'different-order', status: 'cancelled' as const },
  ])('keeps cancellation unconfirmed for a mismatched receipt %j', async (receipt) => {
    const keys: (string | null)[] = [];
    server.use(
      http.get('*/trading/orders', () => HttpResponse.json({ items: [order()] })),
      http.post('*/trading/orders/order-1/cancel', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'));
        return HttpResponse.json(order(receipt));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:read', 'trade:write']),
    });
    await user.click(await screen.findByRole('button', { name: 'Hủy lệnh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chưa xác nhận được kết quả hủy lệnh',
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hủy lệnh' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Hủy lệnh' }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hủy lệnh' })).toBeEnabled());
  });

  it('recovers the active order read and keeps empty open/history states distinct', async () => {
    let failing = true;
    server.use(
      http.get('*/trading/orders', () =>
        failing ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ items: [] }),
      ),
      http.get('*/trading/orders/history', () => HttpResponse.json({ items: [] })),
    );
    const user = userEvent.setup();
    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });
    const retry = await screen.findByRole('button', { name: /thử lại/i }, { timeout: 8000 });
    failing = false;
    await user.click(retry);
    expect(await screen.findByText('Không có lệnh đang mở')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lịch sử' }));
    expect(await screen.findByText('Chưa có lịch sử giao dịch')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hủy lệnh' })).not.toBeInTheDocument();
  });

  it('does not advance past one cursor when next-page events arrive in the same batch', async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get('*/trading/orders', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        cursors.push(cursor);
        return cursor
          ? HttpResponse.json({ items: [order()] })
          : HttpResponse.json({ items: [order()], nextCursor: 'page-2' });
      }),
    );
    renderWithProviders(<OrdersHistoryPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });
    const next = await screen.findByRole('button', { name: 'Sau' });
    act(() => {
      fireEvent.click(next);
      fireEvent.click(next);
    });
    await waitFor(() => expect(cursors).toEqual([null, 'page-2']));
    expect(screen.getByText('Trang 2')).toBeInTheDocument();
    const nextPage = screen.getByRole('button', { name: 'Sau' });
    expect(nextPage).toBeDisabled();
    invokeStaleReactHandler(nextPage, 'onClick');
    expect(screen.getByText('Trang 2')).toBeInTheDocument();
    expect(cursors).toEqual([null, 'page-2']);
  });
});

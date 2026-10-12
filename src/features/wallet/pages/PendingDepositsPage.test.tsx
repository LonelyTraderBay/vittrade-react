import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { PendingDepositsPage } from './PendingDepositsPage';

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

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

describe('pending deposits page', () => {
  it('loads server-filtered pending deposits and follows the cursor', async () => {
    const requests: URL[] = [];
    let markFirstPageStarted: (() => void) | undefined;
    let releaseFirstPage: (() => void) | undefined;
    let markNextPageStarted: (() => void) | undefined;
    let releaseNextPage: (() => void) | undefined;
    const firstPageStarted = new Promise<void>((resolve) => {
      markFirstPageStarted = resolve;
    });
    const firstPageReleased = new Promise<void>((resolve) => {
      releaseFirstPage = resolve;
    });
    const nextPageStarted = new Promise<void>((resolve) => {
      markNextPageStarted = resolve;
    });
    const nextPageReleased = new Promise<void>((resolve) => {
      releaseNextPage = resolve;
    });
    server.use(
      http.get('*/wallet/transactions', async ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        if (url.searchParams.has('cursor')) {
          markNextPageStarted?.();
          await nextPageReleased;
          return HttpResponse.json({
            items: [
              {
                id: 'deposit-2',
                type: 'deposit',
                asset: 'ETH',
                amount: 0.75,
                status: 'pending',
                createdAt: '2026-09-25T10:00:00.000Z',
                network: 'Ethereum',
              },
            ],
            total: 2,
          });
        }
        markFirstPageStarted?.();
        await firstPageReleased;
        return HttpResponse.json({
          items: [
            {
              id: 'deposit-1',
              type: 'deposit',
              asset: 'BTC',
              amount: 0.5,
              status: 'pending',
              createdAt: '2026-09-24T10:00:00.000Z',
              network: 'Bitcoin',
            },
          ],
          total: 2,
          nextCursor: 'page-two',
        });
      }),
    );

    renderWithProviders(
      <>
        <PendingDepositsPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/wallet/pending-deposits'] } },
    );

    await firstPageStarted;
    try {
      expect(screen.getByText('Loading pending deposits…')).toBeVisible();
    } finally {
      releaseFirstPage?.();
    }
    expect(await screen.findByText('BTC deposit · Bitcoin')).toBeInTheDocument();
    expect(requests[0].searchParams.get('type')).toBe('deposit');
    expect(requests[0].searchParams.get('status')).toBe('pending');
    expect(requests[0].searchParams.get('limit')).toBe('100');

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await nextPageStarted;
    try {
      expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
    } finally {
      releaseNextPage?.();
    }

    expect(await screen.findByText('ETH deposit · Ethereum')).toBeInTheDocument();
    expect(requests[1].searchParams.get('cursor')).toBe('page-two');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^BTC deposit/ }));
    await waitFor(() =>
      expect(screen.getByLabelText('Current path')).toHaveTextContent(
        '/wallet/transaction/deposit-1',
      ),
    );
  });

  it('shows an empty state when the filtered API response has no deposits', async () => {
    server.use(http.get('*/wallet/transactions', () => HttpResponse.json({ items: [], total: 0 })));

    renderWithProviders(<PendingDepositsPage />);

    expect(await screen.findByText('There are no pending deposits.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('allows retry after a transport error', async () => {
    let recover = false;
    server.use(
      http.get('*/wallet/transactions', () =>
        recover
          ? HttpResponse.json({
              items: [
                {
                  id: 'deposit-recovered',
                  type: 'deposit',
                  asset: 'SOL',
                  amount: 1.25,
                  status: 'pending',
                  createdAt: '2026-09-25T10:00:00.000Z',
                },
              ],
              total: 1,
            })
          : HttpResponse.error(),
      ),
    );

    renderWithProviders(<PendingDepositsPage />);

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    recover = true;
    await userEvent.click(retryButton);

    expect(await screen.findByText('SOL deposit · Network not provided')).toBeVisible();
    expect(screen.getByText('1 pending deposit loaded')).toBeVisible();
  });

  it('does not request pending deposits without wallet read permission', async () => {
    let requested = false;
    server.use(
      http.get('*/wallet/transactions', () => {
        requested = true;
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderWithProviders(<PendingDepositsPage />, { authAdapter: adapterWithPermissions([]) });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wallet read permission is required to view pending deposits.',
    );
    expect(requested).toBe(false);
  });
});

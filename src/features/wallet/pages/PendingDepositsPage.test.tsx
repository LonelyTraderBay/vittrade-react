import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { PendingDepositsPage } from './PendingDepositsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('pending deposits page', () => {
  it('loads server-filtered pending deposits and follows the cursor', async () => {
    const requests: URL[] = [];
    server.use(
      http.get('*/wallet/transactions', ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        if (url.searchParams.has('cursor')) {
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

    renderWithProviders(<PendingDepositsPage />);

    expect(await screen.findByText('BTC deposit · Bitcoin')).toBeInTheDocument();
    expect(requests[0].searchParams.get('type')).toBe('deposit');
    expect(requests[0].searchParams.get('status')).toBe('pending');
    expect(requests[0].searchParams.get('limit')).toBe('100');

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('ETH deposit · Ethereum')).toBeInTheDocument();
    expect(requests[1].searchParams.get('cursor')).toBe('page-two');
  });
});

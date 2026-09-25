import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders, screen } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { PredictionEvent } from '../model/prediction-types';
import {
  PredictionActivityContractPage,
  PredictionEventContractPage,
  PredictionLeaderboardContractPage,
  PredictionPortfolioContractPage,
  PredictionReceiptContractPage,
  PredictionRewardsContractPage,
  PredictionsBreakingContractPage,
  PredictionsContractPage,
  PredictionsSearchContractPage,
} from './PredictionContractPages';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const event: PredictionEvent = {
  id: 'event-1',
  title: 'Will BTC close above 100k?',
  category: 'Crypto',
  tags: ['btc'],
  outcomes: [
    { label: 'Yes', chance: 62, color: '#10B981' },
    { label: 'No', chance: 38, color: '#EF4444' },
  ],
  volume24h: 12_000,
  totalVolume: 50_000,
  endDate: '2026-10-01T00:00:00.000Z',
  liquidity: 25_000,
  participants: 120,
  status: 'active',
  isTrending: true,
  change24h: 3.2,
  createdAt: '2026-09-23T00:00:00.000Z',
};

describe('PredictionEventContractPage', () => {
  it('keeps prediction order placement disabled for read-only users', async () => {
    server.use(http.get('*/predictions/events/event-1', () => HttpResponse.json(event)));

    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['predictions:read'] },
      },
    };

    renderWithProviders(
      <Routes>
        <Route path="/predictions/event/:eventId" element={<PredictionEventContractPage />} />
      </Routes>,
      {
        authAdapter: readOnlyAdapter,
        routerProps: { initialEntries: ['/predictions/event/event-1'] },
      },
    );

    expect(
      await screen.findByText('Prediction trading permission is required to place an order.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mua Yes/i })).toBeDisabled();
  });
});

describe('prediction contract read pages', () => {
  it('renders server-backed market results and filters breaking markets by trend and volume', async () => {
    const lowerVolume = { ...event, id: 'event-2', title: 'Lower volume market', volume24h: 500 };
    const higherVolume = {
      ...event,
      id: 'event-3',
      title: 'Higher volume market',
      volume24h: 2_000,
    };
    const notTrending = {
      ...event,
      id: 'event-4',
      title: 'Not trending market',
      isTrending: false,
    };
    server.use(
      http.get('*/predictions/events', ({ request }) => {
        const search = new URL(request.url).searchParams.get('search');
        if (search) return HttpResponse.json({ items: [event] });
        return HttpResponse.json({ items: [lowerVolume, notTrending, higherVolume] });
      }),
    );

    const { unmount } = renderWithProviders(<PredictionsContractPage />);
    expect(await screen.findByText('Lower volume market')).toBeInTheDocument();
    unmount();

    renderWithProviders(<PredictionsBreakingContractPage />);
    expect(await screen.findByText('Higher volume market')).toBeInTheDocument();
    expect(screen.queryByText('Not trending market')).not.toBeInTheDocument();
    const higherVolumeButton = screen.getByRole('button', { name: /Higher volume market/ });
    const lowerVolumeButton = screen.getByRole('button', { name: /Lower volume market/ });
    expect(
      higherVolumeButton.compareDocumentPosition(lowerVolumeButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('sends the search term to the prediction events contract', async () => {
    let requestedSearch = '';
    server.use(
      http.get('*/predictions/events', ({ request }) => {
        requestedSearch = new URL(request.url).searchParams.get('search') ?? '';
        return HttpResponse.json({ items: requestedSearch ? [event] : [] });
      }),
    );

    renderWithProviders(<PredictionsSearchContractPage />);
    fireEvent.change(await screen.findByPlaceholderText('Tìm event…'), {
      target: { value: 'BTC' },
    });

    expect(await screen.findByText('Will BTC close above 100k?')).toBeInTheDocument();
    expect(requestedSearch).toBe('BTC');
  });

  it('renders positions and the empty portfolio state', async () => {
    server.use(http.get('*/predictions/positions', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<PredictionPortfolioContractPage />);
    expect(await screen.findByText('Chưa có vị thế.')).toBeInTheDocument();
  });

  it('renders reward opportunities from the contract', async () => {
    server.use(
      http.get('*/predictions/rewards', () =>
        HttpResponse.json({
          items: [
            {
              id: 'reward-1',
              eventId: 'event-1',
              category: 'Crypto',
              maxSpread: 0.03,
              minShares: 10,
              dailyReward: 4,
              earningsPct: 12,
              priceChange24h: 1.2,
            },
          ],
        }),
      ),
    );
    renderWithProviders(<PredictionRewardsContractPage />);
    expect(await screen.findByText('Crypto · event-1')).toBeInTheDocument();
    expect(screen.getByText(/12% APY/)).toBeInTheDocument();
  });

  it('renders leaderboard results and activity items from their contracts', async () => {
    server.use(
      http.get('*/predictions/leaderboard', () =>
        HttpResponse.json({
          items: [
            {
              rank: 1,
              user: 'Trader One',
              avatar: 'T',
              pnl: 120,
              pnlPct: 12,
              volume: 1_000,
              trades: 8,
              winRate: 75,
            },
          ],
        }),
      ),
      http.get('*/predictions/activity', () =>
        HttpResponse.json({
          items: [
            {
              id: 'activity-1',
              user: 'Trader Two',
              avatar: 'A',
              action: 'bought',
              outcome: 'Yes',
              eventId: 'event-1',
              price: 0.62,
              amount: 62,
              shares: 100,
              timestamp: '2026-09-24T01:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const { unmount } = renderWithProviders(<PredictionLeaderboardContractPage />);
    expect(await screen.findByText(/Trader One/)).toBeInTheDocument();
    unmount();

    renderWithProviders(<PredictionActivityContractPage />);
    expect(await screen.findByText(/Trader Two bought Yes/)).toBeInTheDocument();
  });

  it('renders order status and completion timeline from the receipt contract', async () => {
    server.use(
      http.get('*/predictions/orders/order-1', () =>
        HttpResponse.json({
          id: 'order-1',
          eventId: 'event-1',
          eventTitle: 'Will BTC close above 100k?',
          outcome: 'Yes',
          side: 'buy',
          orderType: 'market',
          shares: 10,
          filledShares: 10,
          price: 0.62,
          avgPrice: 0.62,
          total: 6.2,
          fee: 0,
          status: 'filled',
          createdAt: '2026-09-24T00:00:00.000Z',
          updatedAt: '2026-09-24T00:01:00.000Z',
          timeline: [{ label: 'Đã khớp', date: '01:00', done: true }],
        }),
      ),
    );
    renderWithProviders(
      <Routes>
        <Route path="/predictions/receipt/:orderId" element={<PredictionReceiptContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/predictions/receipt/order-1'] } },
    );

    expect(await screen.findByText('filled')).toBeInTheDocument();
    expect(screen.getByText(/Đã khớp/)).toBeInTheDocument();
  });
});

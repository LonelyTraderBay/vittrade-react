import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PDashboardResponse } from '../model/p2p-types';
import { P2PDashboardPage } from './P2PDashboardPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const dashboard: P2PDashboardResponse = {
  stats: {
    totalOrders: 10,
    completedOrders: 8,
    cancelledOrders: 1,
    disputedOrders: 1,
    completionRate: 80,
    avgCompletionTime: '3m',
    totalVolume7d: 1_000,
    totalVolume30d: 5_000,
    totalVolumeAll: 20_000,
    buyVolume30d: 2_000,
    sellVolume30d: 3_000,
    spreadRevenue30d: 100,
    avgOrderSize: 500,
    uniqueCounterparties: 4,
    repeatCustomerRate: 25,
    avgRatingGiven: 4.5,
    avgRatingReceived: 4.8,
    positiveReviewRate: 95,
    responseTimeAvg: '1m',
    platformAvgCompletionRate: 90,
    platformAvgResponseTime: '2m',
  },
  ordersByMonth: [],
  volumeByWeek: [{ week: 'W1', volume: 1_000 }],
  assetDistribution: [{ asset: 'USDT', percentage: 100, volume: 5_000 }],
  topMerchants: [{ name: 'Merchant One', id: 'merchant-1', trades: 8, volume: 4_000, rating: 4.9 }],
  recentActivity: [],
};

describe('P2P dashboard contract page', () => {
  it('renders typed dashboard analytics without local fixture data', async () => {
    server.use(http.get('*/p2p/dashboard', () => HttpResponse.json(dashboard)));
    renderWithProviders(<P2PDashboardPage />);
    expect(await screen.findByText('P2P Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(screen.getByText('Đơn hoàn thành')).toBeInTheDocument();
  });
});

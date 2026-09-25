import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAd, P2PAdAnalytics } from '../model/p2p-types';
import { P2PAdAnalyticsPage } from './P2PAdAnalyticsPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ad: P2PAd = {
  id: 'ad-1',
  type: 'sell',
  asset: 'USDT',
  merchant: 'Merchant One',
  merchantId: 'merchant-1',
  merchantLevel: 3,
  merchantVerified: true,
  merchantJoinDate: '2025-01-01',
  completionRate: 98,
  completedOrders: 20,
  totalVolume30d: 100_000,
  price: 25_000,
  currency: 'VND',
  priceType: 'fixed',
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 1_000,
  paymentMethods: ['Vietcombank'],
  avgResponseTime: '1m',
  isOnline: true,
  createdAt: '2026-09-22',
  status: 'active',
};

const analytics: P2PAdAnalytics = {
  adId: 'ad-1',
  impressions: 100,
  clicks: 50,
  ordersCreated: 10,
  ordersCompleted: 8,
  ordersDisputed: 1,
  ordersCancelled: 1,
  totalVolume: 200_000,
  totalRevenue: 2_000,
  avgOrderValue: 25_000,
  avgResponseTime: 60,
  avgCompletionTime: 180,
  conversionRate: 10,
  completionRate: 80,
  rating: 4.8,
  reviewsCount: 8,
  ranking: 1,
  totalActiveAds: 5,
  dailyPerformance: [{ date: 'Mon', impressions: 20, orders: 2, volume: 50_000 }],
  hourlyHeatmap: [{ hour: 10, orders: 2 }],
  paymentBreakdown: [{ method: 'Vietcombank', count: 8, volume: 200_000 }],
  competitorComparison: [],
};

describe('P2P ad analytics contract page', () => {
  it('loads ad identity and analytics through separate typed queries', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.get('*/p2p/ads/ad-1/analytics', () => HttpResponse.json(analytics)),
    );
    renderWithProviders(
      <Routes>
        <Route path="/p2p/ad-analytics/:id" element={<P2PAdAnalyticsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/ad-analytics/ad-1'] } },
    );
    expect(await screen.findByText('Bán USDT')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Hạng #1')).toBeInTheDocument();
  });
});

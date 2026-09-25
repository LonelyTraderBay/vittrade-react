import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import type { P2POverviewResponse } from '../model/p2p-types';
import { P2PTradingLevelPage } from './P2PTradingLevelPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const overview: P2POverviewResponse = {
  userLevel: {
    currentLevel: 1,
    completedOrders: 12,
    accumulatedVolume: 20_000,
    dailyUsed: 1_000,
    dailyLimit: 10_000,
    fee: 0.2,
    nextLevelProgress: 0.4,
  },
  tradingLevels: [
    {
      id: 1,
      name: 'Starter',
      nameVi: 'Khởi đầu',
      fee: 0.2,
      dailyLimit: 10_000,
      perOrderLimit: 2_000,
      requirements: ['KYC cơ bản'],
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    },
  ],
  platformStats: {
    volume24h: 100_000,
    volume24hChange: 2,
    totalTrades24h: 100,
    activeMerchants: 10,
    onlineTraders: 20,
    avgCompletionRate: 95,
    avgCompletionTime: '3m',
    totalUsers: 1_000,
    supportedFiats: 4,
    escrowProtected: 80,
  },
};

describe('P2P trading level contract page', () => {
  it('renders the server-owned current level and limits', async () => {
    server.use(http.get('*/p2p/overview', () => HttpResponse.json(overview)));
    renderWithProviders(<P2PTradingLevelPage />);
    expect((await screen.findAllByText('Lv.1 Khởi đầu')).length).toBe(2);
    expect(screen.getByText('Giao dịch hoàn tất')).toBeInTheDocument();
    expect(screen.getByText('Tất cả cấp độ')).toBeInTheDocument();
  });
});

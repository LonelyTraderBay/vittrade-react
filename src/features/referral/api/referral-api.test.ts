import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { referralApi } from './referral-api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const overview = {
  referralCode: 'VITTA-123',
  stats: {
    totalFriends: 2,
    activeFriends: 1,
    kycCompleted: 1,
    totalCommission: 20,
    pendingCommission: 2,
    totalVolume: 1000,
    thisMonthCommission: 5,
    thisMonthFriends: 1,
  },
  currentTier: {
    name: 'Đồng',
    nameEn: 'Bronze',
    friends: 0,
    commission: 20,
    color: '#CD7F32',
    icon: '🥉',
    kycBonus: 5,
  },
  friends: [],
  campaign: {
    id: 'campaign-1',
    title: 'March',
    description: 'Invite',
    bonusLabel: 'x2',
    daysLeft: 5,
    totalParticipants: 100,
  },
};

describe('referral API contract', () => {
  it('loads the authenticated overview', async () => {
    server.use(
      http.get('http://localhost:3000/api/referral/overview', () => HttpResponse.json(overview)),
    );
    await expect(referralApi.getOverview()).resolves.toMatchObject({ referralCode: 'VITTA-123' });
  });

  it('rejects malformed commission stats', async () => {
    server.use(
      http.get('http://localhost:3000/api/referral/overview', () =>
        HttpResponse.json({ ...overview, stats: { ...overview.stats, totalFriends: '2' } }),
      ),
    );
    await expect(referralApi.getOverview()).rejects.toThrow();
  });
});

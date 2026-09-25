import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAchievementsResponse } from '../model/p2p-types';
import { P2PAchievementsPage } from './P2PAchievementsPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const achievements: P2PAchievementsResponse = {
  items: [
    {
      id: 'achievement-1',
      title: 'First trade',
      description: 'Complete your first P2P order.',
      progress: 100,
      currentValue: 1,
      targetValue: 1,
      unit: 'order',
      unlocked: true,
      category: 'trades',
      reward: '10 points',
    },
  ],
  totalUnlocked: 1,
  totalPoints: 10,
  badgeCount: 1,
  currentLevel: 2,
};

describe('P2P achievements contract page', () => {
  it('renders server-owned progress and rewards', async () => {
    server.use(http.get('*/p2p/achievements', () => HttpResponse.json(achievements)));
    renderWithProviders(<P2PAchievementsPage />);
    expect(await screen.findByText('First trade')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });
});

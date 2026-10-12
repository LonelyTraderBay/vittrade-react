import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen } from '@testing-library/react';
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
  it('shows the pending state while the achievements request is unresolved', () => {
    server.use(
      http.get('*/p2p/achievements', async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
        return HttpResponse.json(achievements);
      }),
    );

    renderWithProviders(<P2PAchievementsPage />);

    expect(screen.getByText('Đang tải thành tích…')).toBeInTheDocument();
  });

  it('renders server-owned progress and rewards', async () => {
    server.use(http.get('*/p2p/achievements', () => HttpResponse.json(achievements)));
    renderWithProviders(<P2PAchievementsPage />);
    expect(await screen.findByText('First trade')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('renders all achievement categories and both locked and unlocked presentation', async () => {
    const completeAchievements: P2PAchievementsResponse = {
      ...achievements,
      items: [
        achievements.items[0],
        {
          ...achievements.items[0],
          id: 'achievement-volume',
          title: 'Growing volume',
          progress: 50,
          unlocked: false,
          category: 'volume',
          reward: undefined,
        },
        {
          ...achievements.items[0],
          id: 'achievement-trust',
          title: 'Trusted trader',
          progress: 75,
          unlocked: true,
          category: 'trust',
          reward: undefined,
        },
        {
          ...achievements.items[0],
          id: 'achievement-special',
          title: 'Special milestone',
          progress: 25,
          unlocked: false,
          category: 'special',
          reward: '5 points',
        },
      ],
      totalUnlocked: 2,
    };
    server.use(http.get('*/p2p/achievements', () => HttpResponse.json(completeAchievements)));

    renderWithProviders(<P2PAchievementsPage />);

    expect(await screen.findByText('Growing volume')).toBeInTheDocument();
    expect(screen.getByText('Giao dịch')).toBeInTheDocument();
    expect(screen.getByText('Khối lượng')).toBeInTheDocument();
    expect(screen.getByText('Uy tín')).toBeInTheDocument();
    expect(screen.getByText('Đặc biệt')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '1 / 1 order · 5 points'),
    ).toBeInTheDocument();
  });

  it('offers retry after a request error and renders the recovered response', async () => {
    server.use(
      http.get('*/p2p/achievements', () =>
        HttpResponse.json({ message: 'unavailable' }, { status: 503 }),
      ),
    );
    renderWithProviders(<P2PAchievementsPage />);

    expect(await screen.findByText('Không thể tải thành tích P2P')).toBeInTheDocument();

    server.use(http.get('*/p2p/achievements', () => HttpResponse.json(achievements)));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('First trade')).toBeInTheDocument();
  });
});

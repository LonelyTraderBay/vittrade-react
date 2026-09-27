import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { ArenaDiscoveryPage } from './ArenaDiscoveryPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const response = {
  modes: [
    {
      id: 'mode001',
      title: 'BTC Weekly Predict',
      description: 'Dự đoán giá BTC cuối tuần.',
      cloneCount: 10,
      activeChallenges: 2,
      fairPlay: true,
      icon: '🎯',
      color: '#F59E0B',
      complexity: 'easy',
      creator: {
        id: 'creator-1',
        name: 'Arena creator',
        avatar: '🎮',
        trustScore: 98,
        fairPlayBadge: true,
      },
      completionRate: 90,
      tags: ['Crypto'],
    },
  ],
  challenges: [
    {
      id: 'challenge001',
      title: 'BTC $70K?',
      description: 'Đoán giá BTC trong tuần này.',
      modeId: 'mode001',
      modeName: 'BTC Weekly Predict',
      creator: {
        id: 'creator-1',
        name: 'Arena creator',
        avatar: '🎮',
        trustScore: 98,
        fairPlayBadge: true,
      },
      entryPoints: 100,
      prizePool: 1000,
      slotsTotal: 10,
      slotsFilled: 3,
      format: 'Closest Guess',
      startsAt: '2026-09-27T12:00:00Z',
    },
  ],
};

function renderPage() {
  return renderWithProviders(<ArenaDiscoveryPage />, {
    routerProps: { initialEntries: ['/w/arena'] },
  });
}

describe('ArenaDiscoveryPage', () => {
  it('loads public challenge discovery and discloses that points are not wallet assets', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/discovery', () => HttpResponse.json(response)),
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'BTC $70K?' })).toBeInTheDocument();
    expect(screen.getByText(/không liên quan đến ví hoặc tài sản tài chính/i)).toBeInTheDocument();
    expect(screen.getByText(/100 Arena Points để tham gia/i)).toBeInTheDocument();
  });

  it('filters the active discovery tab and switches to modes', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/discovery', () => HttpResponse.json(response)),
    );

    renderPage();
    await screen.findByRole('heading', { name: 'BTC $70K?' });
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Tìm trong Open Arena' }),
      'not found',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Không tìm thấy challenge phù hợp.');

    await userEvent.clear(screen.getByRole('textbox', { name: 'Tìm trong Open Arena' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Mode' }));
    expect(await screen.findByRole('heading', { name: 'BTC Weekly Predict' })).toBeInTheDocument();
  });
});

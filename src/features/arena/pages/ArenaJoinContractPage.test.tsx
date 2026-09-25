import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { ArenaJoinContractPage, ArenaModeContractPage } from './ArenaContractPages';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const challenge = {
  id: 'ch001',
  title: 'BTC challenge',
  description: 'Predict BTC.',
  modeId: 'mode001',
  modeName: 'BTC Weekly Predict',
  creator: {
    id: 'creator-1',
    name: 'Creator',
    avatar: '🎮',
    trustScore: 98,
    fairPlayBadge: true,
  },
  entryPoints: 100,
  prizePool: 1000,
  slotsTotal: 10,
  slotsFilled: 1,
  status: 'waiting',
  privacy: 'public',
  format: 'Closest Guess',
  rules: ['One prediction'],
  startAt: '2026-09-22T00:00:00Z',
  endAt: '2026-09-23T00:00:00Z',
  leaderboard: [],
  challengeState: 'open',
  participants: [],
};

const mode = {
  id: 'mode001',
  title: 'BTC Weekly Predict',
  description: 'Predict BTC for the coming week.',
  cloneCount: 4,
  activeChallenges: 2,
  fairPlay: true,
  template: {
    id: 'prediction',
    title: 'Price prediction',
    icon: '📈',
    color: '#2563EB',
    complexity: 'easy',
  },
  creator: {
    id: 'creator-1',
    name: 'Arena creator',
    avatar: '🎮',
    trustScore: 98,
    fairPlayBadge: true,
  },
  tags: ['BTC'],
  completionRate: 90,
  allowedFormats: ['Closest Guess'],
  winCondition: 'Closest price wins',
  resolutionType: 'Oracle price',
  avgDuration: '1 week',
  relatedRooms: [],
  relatedModes: [],
};

describe('ArenaModeContractPage', () => {
  it('loads and renders mode rules from the Arena API contract', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/modes/mode001', () => HttpResponse.json(mode)),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/mode/:modeId" element={<ArenaModeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/mode/mode001'] } },
    );

    expect(await screen.findByRole('heading', { name: 'BTC Weekly Predict' })).toBeInTheDocument();
    expect(screen.getByText('Closest price wins')).toBeInTheDocument();
    expect(screen.getByText('Oracle price')).toBeInTheDocument();
    expect(screen.getByText('1 week')).toBeInTheDocument();
    expect(screen.getByText('Closest Guess')).toBeInTheDocument();
  });
});

describe('ArenaJoinContractPage', () => {
  it('requires confirmations and sends an idempotent join mutation', async () => {
    let joinRequests = 0;
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json(challenge),
      ),
      http.post('http://localhost:3000/api/arena/challenges/ch001/join', ({ request }) => {
        joinRequests += 1;
        expect(request.headers.get('Idempotency-Key')).toMatch(/^arena-join-ch001-/);
        return HttpResponse.json(
          {
            challenge: {
              ...challenge,
              slotsFilled: 2,
              participants: [
                {
                  id: 'dev-user',
                  name: 'Test user',
                  avatar: '🧑‍💻',
                  role: 'player',
                  status: 'joined',
                },
              ],
            },
            auditEventId: 'audit-1',
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/arena/join/:challengeId" element={<ArenaJoinContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/join/ch001'] } },
    );

    expect(await screen.findByRole('heading', { name: 'BTC challenge' })).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: 'Xác nhận tham gia' });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getAllByRole('checkbox')[0]);
    await user.click(screen.getAllByRole('checkbox')[1]);
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    await waitFor(() => expect(joinRequests).toBe(1));
  });

  it('does not expose the join action to read-only users', async () => {
    server.use(http.get('*/arena/challenges/ch001', () => HttpResponse.json(challenge)));

    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['arena:read'] },
      },
    };

    renderWithProviders(
      <Routes>
        <Route path="/arena/join/:challengeId" element={<ArenaJoinContractPage />} />
      </Routes>,
      {
        authAdapter: readOnlyAdapter,
        routerProps: { initialEntries: ['/arena/join/ch001'] },
      },
    );

    expect(
      await screen.findByText('Arena join permission is required to enter a challenge.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tham gia/i })).toBeDisabled();
  });
});
